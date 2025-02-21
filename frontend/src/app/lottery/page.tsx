'use client'

import { useEffect } from 'react';
import { useWallet } from '@/providers/WalletProvider';
import { useLottery } from '@/hooks/useLottery';
import { useNotification } from '@/providers/NotificationProvider';
import { Button } from '@/components/common/Button';
import { Notification } from '@/components/common/Notification';
import { LotteryStatus } from '@/components/lottery/LotteryStatus';
import { PlayersList } from '@/components/lottery/PlayersList';
import { WinnerHistoryList } from '@/components/lottery/WinnerHistory';
import { NETWORK } from '@/utils/constants';
import { formatHash } from '@/utils/formatters';

export default function LotteryPage() {
  const { isConnected, isCorrectNetwork, connectWallet, switchNetwork } = useWallet();
  const { notification } = useNotification();
  const {
    lotteryState,
    winners,
    lastTxHash,
    buyTicket,
    revealWinner,
    refreshLotteryState
  } = useLottery();

  // Charger les stats dès le montage du composant
  useEffect(() => {
    refreshLotteryState();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {notification && <Notification {...notification} />}

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-6xl font-light text-center mb-16">
          Nexus Lottery
        </h1>

        <div className="space-y-16">
          <LotteryStatus lotteryState={lotteryState} />

          <div className="flex justify-center">
            {!isConnected ? (
              <Button onClick={connectWallet}>Connect Wallet</Button>
            ) : !isCorrectNetwork ? (
              <Button onClick={switchNetwork}>Switch to Nexus Network</Button>
            ) : (
              <Button onClick={lotteryState.isOpen ? buyTicket : revealWinner}>
                {lotteryState.isOpen 
                  ? 'Buy Ticket (1 NEXUS)'
                  : 'Reveal Winner and Earn 0.5 NEX'}
              </Button>
            )}
          </div>

          {lastTxHash && (
            <a
              href={`${NETWORK.EXPLORER_URL}/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-gray-500 hover:text-gray-800"
            >
              Latest tx: {formatHash(lastTxHash)}
            </a>
          )}

          <PlayersList players={lotteryState.players} />
          <WinnerHistoryList winners={winners} />
        </div>
      </div>
    </main>
  );
}