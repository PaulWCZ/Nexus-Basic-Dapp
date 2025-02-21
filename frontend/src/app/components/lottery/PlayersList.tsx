import { formatAddress } from '../../utils/formatters';

interface PlayersListProps {
  players: string[];
}

export function PlayersList({ players }: PlayersListProps) {
  if (players.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-light text-black mb-6">Current Players</h2>
      <div className="flex flex-wrap gap-3 justify-center">
        {players.map((player, index) => (
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
  );
}