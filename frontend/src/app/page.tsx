'use client'

import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, JsonRpcSigner, Contract, ethers } from 'ethers'

const CONTRACT_ADDRESS = '0xc8D29b794F595ca5CA8c872eB805BCa5fcFd80CF'
const CONTRACT_ABI = [
  "function buyTicket() public payable",
  "function revealWinner() public",
  "function getCurrentPlayers() public view returns (address[] memory)",
  "function getTicketCount() public view returns (uint256)",
  "function getRemainingTickets() public view returns (uint256)",
  "function isOpen() public view returns (bool)",
  "function currentLotteryId() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function getLotteryHistory(uint256 lotteryId) public view returns (address winner, uint256 prize, uint256 timestamp)",
  "event TicketPurchased(address player, uint256 lotteryId)",
  "event WinnerSelected(address winner, uint256 lotteryId, uint256 prize)",
  "event LotteryReset(uint256 newLotteryId)"
]

const NEXUS_CHAIN_ID = '0x188'
const NEXUS_RPC_URL = 'https://rpc.nexus.xyz/http'
const EXPLORER_URL = 'https://explorer.nexus.xyz'

const PUBLIC_PROVIDER = new ethers.JsonRpcProvider(NEXUS_RPC_URL)

interface NotificationProps {
  message: string
  type: 'error' | 'success' | 'info'
}

interface WinnerHistory {
  address: string;
  prize: bigint;
  timestamp: number;
  lotteryId: number;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [lastTxHash, setLastTxHash] = useState<string>('')
  const [lotteryState, setLotteryState] = useState({
    currentLotteryId: 0,
    isOpen: false,
    ticketCount: 0,
    players: [],
    isOwner: false
  })
  const [notification, setNotification] = useState<NotificationProps | null>(null)
  const [winners, setWinners] = useState<WinnerHistory[]>([])

  // Déclarer les fonctions avec useCallback avant leur utilisation
  const refreshLotteryState = useCallback(async () => {
    if (!signer) return
    
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    try {
      const [isOpen, currentId, ticketCount, players, owner] = await Promise.all([
        contract.isOpen(),
        contract.currentLotteryId(),
        contract.getTicketCount(),
        contract.getCurrentPlayers(),
        contract.owner()
      ])

      setLotteryState(prev => ({
        ...prev,
        isOpen,
        currentLotteryId: Number(currentId),
        ticketCount: Number(ticketCount),
        players,
        isOwner: owner.toLowerCase() === userAddress.toLowerCase()
      }))
    } catch (error) {
      console.error('Error refreshing lottery state:', error)
    }
  }, [signer, userAddress])

  const checkNetwork = useCallback(async () => {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    setIsCorrectNetwork(chainId === NEXUS_CHAIN_ID)
    return chainId === NEXUS_CHAIN_ID
  }, [])

  const handleChainChange = useCallback(async () => {
    const networkCorrect = await checkNetwork()
    if (networkCorrect) {
      const provider = new BrowserProvider(window.ethereum)
      setSigner(await provider.getSigner())
      await refreshLotteryState()
    }
  }, [checkNetwork, refreshLotteryState])

  const checkWalletConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        
        if (accounts.length > 0) {
          const networkCorrect = await checkNetwork()
          setIsConnected(true)
          if (networkCorrect) {
            setSigner(await provider.getSigner())
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }, [checkNetwork])

  // Maintenant on peut utiliser les useEffect
  useEffect(() => {
    checkWalletConnection()
    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChange)
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChange)
      }
    }
  }, [checkWalletConnection, handleChainChange])

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      refreshLotteryState()
    }
  }, [isConnected, isCorrectNetwork, refreshLotteryState])

  useEffect(() => {
    if (signer) {
      signer.getAddress().then(address => setUserAddress(address))
      refreshLotteryState()
    }
  }, [signer])

  // Fonctions spécifiques à la loterie
  const showNotification = (message: string, type: 'error' | 'success' | 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const buyTicket = async () => {
    if (!signer) return;
    
    try {
      // Vérifier le solde d'abord
      const balance = await signer.provider.getBalance(await signer.getAddress());
      const balanceInNex = Number(ethers.formatEther(balance));
      
      if (balanceInNex < 1.1) {
        showNotification(
          `Insufficient balance. You have ${balanceInNex.toFixed(2)} NEX, you need at least 1.1 NEX`,
          'error'
        );
        return;
      }

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const isOpen = await contract.isOpen();
      if (!isOpen) {
        console.error("The lottery is not open");
        return;
      }

      const ticketPrice = ethers.parseEther("1.0");
      
      // Utiliser le gasPrice au lieu de maxFeePerGas/maxPriorityFeePerGas
      const feeData = await signer.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      const gasEstimate = await contract.buyTicket.estimateGas({
        from: await signer.getAddress(),
        value: ticketPrice,
        gasPrice: gasPrice // Utiliser gasPrice au lieu des paramètres EIP-1559
      });

      const gasLimit = Math.floor(Number(gasEstimate) * 1.3);


      // Envoyer la transaction en mode legacy
      const tx = await contract.buyTicket({
        value: ticketPrice,
        gasLimit: gasLimit,
        gasPrice: gasPrice, // Utiliser gasPrice au lieu des paramètres EIP-1559
        type: 0 // Forcer le type de transaction legacy
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
    if (!signer) return
    
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    try {
      const tx = await contract.revealWinner()
      setLastTxHash(tx.hash)
      await tx.wait()
      await refreshLotteryState()
      showNotification("Winner revealed successfully", 'success')
    } catch (error) {
      console.error('Error revealing winner:', error)
      showNotification("Failed to reveal winner", 'error')
    }
  }

  // Réutilisation des fonctions utilitaires du template
  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatHash = (hash: string) => {
    if (!hash) return ''
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NEXUS_CHAIN_ID }],
      })
      const networkCorrect = await checkNetwork()
      if (networkCorrect) {
        const provider = new BrowserProvider(window.ethereum)
        setSigner(await provider.getSigner())
        await refreshLotteryState()
      }
      return true
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: NEXUS_CHAIN_ID,
              rpcUrls: [NEXUS_RPC_URL],
              chainName: 'Nexus Testnet',
              nativeCurrency: {
                name: 'NEXUS',
                symbol: 'NEXUS',
                decimals: 18
              },
            }],
          })
          const networkCorrect = await checkNetwork()
          if (networkCorrect) {
            const provider = new BrowserProvider(window.ethereum)
            setSigner(await provider.getSigner())
            await refreshLotteryState()
          }
          return true
        } catch (addError) {
          console.error('Error adding network:', addError)
          return false
        }
      }
      console.error('Error switching network:', switchError)
      return false
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        const networkCorrect = await checkNetwork()
        setIsConnected(true)
        if (networkCorrect) {
          setSigner(await provider.getSigner())
        }
      } catch (error) {
        console.error('Error connecting wallet:', error)
      }
    }
  }

  const disconnectWallet = async () => {
    setIsConnected(false)
    setSigner(null)
    setUserAddress('')
  }

  // Ajouter une fonction pour charger les stats
  const loadLotteryStats = async () => {
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, PUBLIC_PROVIDER)
      
      const [currentId, isOpen, players] = await Promise.all([
        contract.currentLotteryId(),
        contract.isOpen(),
        contract.getCurrentPlayers()
      ])

      setLotteryState(prev => ({
        ...prev,
        currentLotteryId: Number(currentId),
        isOpen,
        ticketCount: players.length,
        players
      }))

      // Charger l'historique des winners en même temps
      const histories: WinnerHistory[] = []
      for(let i = 0; i < Number(currentId); i++) {
        const [winner, prize, timestamp] = await contract.getLotteryHistory(i)
        if(winner !== ethers.ZeroAddress) {
          histories.push({
            address: winner,
            prize,
            timestamp,
            lotteryId: i
          })
        }
      }
      console.log("Winners:", histories)
      setWinners(histories)
    } catch (error) {
      console.error('Error loading lottery stats:', error)
    }
  }

  // Charger les stats au montage du composant
  useEffect(() => {
    loadLotteryStats()
  }, [])

  return (
    <main className="min-h-screen bg-white relative font-['Arial',_'Helvetica',_sans-serif]">
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <p className="text-sm font-medium tracking-wide">{notification.message}</p>
        </div>
      )}

      <div className="absolute top-4 right-4">
        {isConnected ? (
          <div className="relative group">
            <button 
              className="px-6 py-2 rounded-full bg-black text-white shadow-lg hover:bg-black/80 transition-all duration-200"
            >
              {formatAddress(userAddress)}
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button
                onClick={disconnectWallet}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-6 py-2 rounded-full bg-black text-white shadow-lg hover:bg-black/80 transition-all duration-200"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="max-w-4xl w-full px-4">
          <div className="space-y-12 text-center">
            <h1 className="text-6xl font-light tracking-tight text-black mb-16">
              Nexus Lottery
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Status Box */}
              <div className="bg-black/5 p-8 rounded-[32px] backdrop-blur-sm">
                <h2 className="text-3xl font-light text-black mb-8 text-center">Lottery #{lotteryState.currentLotteryId}</h2>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Status</span>
                    <span className={lotteryState.isOpen ? "text-green-500 text-lg" : "text-red-500 text-lg"}>
                      {lotteryState.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Tickets</span>
                    <span className="text-black text-lg">{lotteryState.ticketCount}/15</span>
                  </div>
                </div>
              </div>

              {/* Prize Box */}
              <div className="bg-black/5 p-8 rounded-[32px] backdrop-blur-sm">
                <h2 className="text-3xl font-light text-black mb-8 text-center">Prize Pool</h2>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Prize</span>
                    <span className="text-black text-lg">10 NEXUS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-lg">Ticket Price</span>
                    <span className="text-black text-lg">1 NEXUS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-8">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="px-8 py-4 text-lg font-light text-white bg-black rounded-xl 
                           hover:bg-black/80 transition-all duration-200 shadow-lg
                           hover:shadow-xl hover:scale-105"
                >
                  Connect Wallet
                </button>
              ) : !isCorrectNetwork ? (
                <button
                  onClick={switchNetwork}
                  className="px-8 py-4 text-lg font-light text-black border-2 border-black rounded-xl
                           hover:bg-black hover:text-white transition-all duration-200"
                >
                  Switch to Nexus Network
                </button>
              ) : (
                <div className="space-y-8">
                  {lotteryState.isOpen ? (
                    <button
                      onClick={buyTicket}
                      className="px-10 py-4 text-lg font-light text-white bg-black rounded-full
                               hover:bg-black/90 transition-all duration-200"
                    >
                      Buy Ticket (1 NEXUS)
                    </button>
                  ) : lotteryState.isOwner && (
                    <button
                      onClick={revealWinner}
                      className="px-8 py-4 text-lg font-light text-white bg-black rounded-xl
                               hover:bg-black/80 transition-all duration-200 shadow-lg
                               hover:shadow-xl hover:scale-105"
                    >
                      Reveal Winner
                    </button>
                  )}
                </div>
              )}

              {/* Transaction Hash - Always below buttons */}
              {lastTxHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 
                           transition-colors duration-200"
                >
                  <span className="mr-1">Latest tx:</span>
                  <span className="font-medium">{formatHash(lastTxHash)}</span>
                  <svg 
                    className="w-3.5 h-3.5 ml-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                    />
                  </svg>
                </a>
              )}
            </div>

            {/* Current Players */}
            {lotteryState.players.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-light text-black mb-6">Current Players</h2>
                <div className="flex flex-wrap gap-3 justify-center">
                  {lotteryState.players.map((player, index) => (
                    <div 
                      key={index} 
                      className="bg-black/5 px-4 py-2 rounded-full font-mono text-sm text-black hover:bg-black/10 transition-colors"
                      title={`Player ${index + 1}`}
                    >
                      {formatAddress(player)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Winners - At the bottom */}
            {winners.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-light text-black mb-6">Previous Winners</h2>
                <div className="flex flex-wrap gap-3 justify-center">
                  {winners.map((winner, index) => (
                    <div 
                      key={index} 
                      className="bg-black/5 px-6 py-3 rounded-2xl flex items-center gap-4"
                    >
                      <span className="text-gray-500 text-sm">#{winner.lotteryId}</span>
                      <span className="font-mono text-black text-sm">{formatAddress(winner.address)}</span>
                      <span className="text-black text-sm">{ethers.formatEther(winner.prize)} NEX</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Smaller and more compact */}
      <footer className="w-full pt-2 mt-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-black">Made by</span>
            <a 
              href="https://x.com/wczpaul" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-medium text-black hover:text-black/70 transition-colors duration-200 border-b border-black"
            >
              @WczPaul
            </a>
          </div>
          <p className="text-sm text-black m-0">
            Code will be in open source soon, give a follow to get notified :)
          </p>
        </div>
      </footer>
    </main>
  )
}