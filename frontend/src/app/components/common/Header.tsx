'use client'

import Link from 'next/link';
import { useWallet } from '../../providers/WalletProvider';
import { Button } from './Button';
import { formatAddress } from '../../utils/formatters';

export function Header() {
  const { isConnected, userAddress, connectWallet, disconnectWallet } = useWallet();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl md:text-3xl font-light">
            Nexus DApps
          </Link>

          <div className="flex items-center">
            {isConnected ? (
              <>
                <span className="hidden md:block font-mono text-sm text-black mr-4">
                  {formatAddress(userAddress)}
                </span>
                <Button onClick={disconnectWallet} className="px-4 py-2 text-sm">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connectWallet} className="px-4 py-2 text-sm">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>
      <div className="h-16" /> {/* Spacer pour compenser le header fixed */}
    </>
  );
}