import { useState, useCallback } from 'react';
import { Contract, ethers } from 'ethers';
import { useWallet, PUBLIC_PROVIDER } from '../providers/WalletProvider';
import { useNotification } from '../providers/NotificationProvider';
import { LOTTERY, CONTRACT_ABI } from '../contracts/lottery';
import { LotteryState, WinnerHistory } from '../contracts/types';

export function useLottery() {
  const { signer, userAddress } = useWallet();
  const { showNotification } = useNotification();
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [lotteryState, setLotteryState] = useState<LotteryState>({
    currentLotteryId: 0,
    isOpen: false,
    ticketCount: 0,
    players: [],
    isOwner: false
  });
  const [winners, setWinners] = useState<WinnerHistory[]>([]);

  const refreshLotteryState = useCallback(async () => {
    try {
      const contract = new Contract(LOTTERY.ADDRESS, CONTRACT_ABI, PUBLIC_PROVIDER);
      
      // Charger l'état de base
      const [isOpen, currentId, players, owner] = await Promise.all([
        contract.isOpen(),
        contract.currentLotteryId(),
        contract.getCurrentPlayers(),
        contract.owner()
      ]);

      setLotteryState({
        isOpen,
        currentLotteryId: Number(currentId),
        ticketCount: players.length,
        players,
        isOwner: owner.toLowerCase() === userAddress?.toLowerCase()
      });

      // Charger l'historique des winners
      const histories: WinnerHistory[] = [];
      for(let i = 0; i < Number(currentId); i++) {
        const [winner, prize, timestamp] = await contract.getLotteryHistory(i);
        if(winner !== ethers.ZeroAddress) {
          histories.push({
            address: winner,
            prize,
            timestamp,
            lotteryId: i
          });
        }
      }
      setWinners(histories);
    } catch (error) {
      console.error('Error refreshing lottery state:', error);
    }
  }, [userAddress]);

  const buyTicket = async () => {
    if (!signer) return;
    
    try {
      const balance = await signer.provider.getBalance(await signer.getAddress());
      const balanceInNex = Number(ethers.formatEther(balance));
      
      if (balanceInNex < 1.1) {
        showNotification(
          `Insufficient balance. You have ${balanceInNex.toFixed(2)} NEX, you need at least 1.1 NEX`,
          'error'
        );
        return;
      }

      const contract = new Contract(LOTTERY.ADDRESS, CONTRACT_ABI, signer);
      const isOpen = await contract.isOpen();
      if (!isOpen) {
        console.error("The lottery is not open");
        return;
      }

      const ticketPrice = ethers.parseEther("1.0");
      const Fee = await signer.provider.getFeeData();
      const gasPrice = Fee.gasPrice;

      const gasEstimate = await contract.buyTicket.estimateGas({
        value: ticketPrice,
        gasPrice: gasPrice
      });

      const gasLimit = Math.floor(Number(gasEstimate) * 1.3);

      const tx = await contract.buyTicket({
        value: ticketPrice,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        type: 0
      });

      console.log("Transaction sent:", tx.hash);
      setLastTxHash(tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      showNotification("Ticket purchased successfully", 'success');
      
      await refreshLotteryState();
    } catch (error: any) {
      console.error('Error details:', error);
      
      let errorMessage = 'An error occurred';
      if (error.code === 'CALL_EXCEPTION') {
        errorMessage = 'Transaction failed: check your balance';
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      showNotification(errorMessage, 'error');
      throw error;
    }
  };

  const revealWinner = async () => {
    if (!signer) return;
    
    try {
      const contract = new Contract(LOTTERY.ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.revealWinner();
      
      console.log("Revealing winner...");
      setLastTxHash(tx.hash);
      
      const receipt = await tx.wait();
      console.log("Winner revealed:", receipt);
      
      showNotification("Winner successfully revealed!", 'success');
      await refreshLotteryState();
    } catch (error: any) {
      console.error('Error revealing winner:', error);
      showNotification(error.reason || 'Error revealing winner', 'error');
    }
  };

  return {
    lotteryState,
    winners,
    lastTxHash,
    refreshLotteryState,
    buyTicket,
    revealWinner
  };
}