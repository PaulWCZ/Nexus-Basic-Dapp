import { WinnerHistory } from '../../contracts/types';
import { formatAddress } from '../../utils/formatters';
import { ethers } from 'ethers';

interface WinnerHistoryProps {
  winners: WinnerHistory[];
}

export function WinnerHistoryList({ winners }: WinnerHistoryProps) {
  if (winners.length === 0) return null;

  return (
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
  );
}