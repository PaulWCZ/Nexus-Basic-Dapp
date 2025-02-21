'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner, JsonRpcProvider } from 'ethers';
import { NETWORK } from '@/utils/constants';

// Créer et exporter le provider public
export const PUBLIC_PROVIDER = new JsonRpcProvider(NETWORK.RPC_URL);

interface WalletContextType {
  isConnected: boolean;
  isCorrectNetwork: boolean;
  signer: JsonRpcSigner | null;
  userAddress: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [userAddress, setUserAddress] = useState('');

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const isCorrect = chainId === NETWORK.CHAIN_ID;
    setIsCorrectNetwork(isCorrect);
    return isCorrect;
  }, []);

  const checkInitialConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new BrowserProvider(window.ethereum);
          const networkCorrect = await checkNetwork();
          setIsConnected(true);
          
          if (networkCorrect) {
            const newSigner = await provider.getSigner();
            setSigner(newSigner);
            setUserAddress(await newSigner.getAddress());
          }
        }
      } catch (error) {
        console.error('Error checking initial connection:', error);
      }
    }
  }, [checkNetwork]);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const networkCorrect = await checkNetwork();
        setIsConnected(true);
        
        if (networkCorrect) {
          const newSigner = await provider.getSigner();
          setSigner(newSigner);
          setUserAddress(await newSigner.getAddress());
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setIsConnected(false);
        setSigner(null);
        setUserAddress('');
      }
    }
  }, [checkNetwork]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setSigner(null);
    setUserAddress('');
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK.CHAIN_ID }],
      });
      
      const networkCorrect = await checkNetwork();
      if (networkCorrect) {
        const provider = new BrowserProvider(window.ethereum);
        const newSigner = await provider.getSigner();
        setSigner(newSigner);
        setUserAddress(await newSigner.getAddress());
      }
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: NETWORK.CHAIN_ID,
              chainName: NETWORK.NAME,
              rpcUrls: [NETWORK.RPC_URL],
              nativeCurrency: {
                name: NETWORK.CURRENCY.NAME,
                symbol: NETWORK.CURRENCY.SYMBOL,
                decimals: NETWORK.CURRENCY.DECIMALS
              },
            }],
          });
          return switchNetwork();
        } catch (addError) {
          console.error('Error adding network:', addError);
          return false;
        }
      }
      console.error('Error switching network:', switchError);
      return false;
    }
  }, [checkNetwork]);

  useEffect(() => {
    checkInitialConnection();
  }, [checkInitialConnection]);

  useEffect(() => {
    const handleChainChanged = () => {
      checkNetwork();
    };

    const handleAccountsChanged = () => {
      if (isConnected) {
        connectWallet();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [checkNetwork, connectWallet, isConnected]);

  return (
    <WalletContext.Provider value={{
      isConnected,
      isCorrectNetwork,
      signer,
      userAddress,
      connectWallet,
      disconnectWallet,
      switchNetwork
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}