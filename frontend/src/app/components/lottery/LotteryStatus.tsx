import { LotteryState } from '@/contracts/types';
import { LOTTERY } from '@/contracts/lottery';

interface LotteryStatusProps {
  lotteryState: LotteryState;
}

export function LotteryStatus({ lotteryState }: LotteryStatusProps) {
  return (
    <div className="max-w-2xl mx-auto bg-black/5 rounded-3xl p-8 backdrop-blur-sm">
      {/* Round Status */}
      <div className="flex flex-wrap justify-between gap-8 mb-12">
        <div>
          <p className="text-gray-500 text-sm mb-1">Status</p>
          <p className={`text-xl font-medium ${lotteryState.isOpen ? 'text-green-600' : 'text-black'}`}>
            {lotteryState.isOpen ? 'Open' : 'Closed'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm mb-1">Current Round</p>
          <p className="text-xl font-medium">#{lotteryState.currentLotteryId}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm mb-1">Tickets</p>
          <p className="text-xl font-medium">
            {lotteryState.ticketCount} / {LOTTERY.MAX_TICKETS}
          </p>
        </div>
      </div>

      {/* Prize Info */}
      <div className="flex justify-between gap-8">
        <div>
          <p className="text-gray-500 text-sm mb-1">Prize Pool</p>
          <p className="text-xl font-medium">{LOTTERY.PRIZE_AMOUNT} NEXUS</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm mb-1">Ticket Price</p>
          <p className="text-xl font-medium">{LOTTERY.TICKET_PRICE} NEXUS</p>
        </div>
      </div>
    </div>
  );
}