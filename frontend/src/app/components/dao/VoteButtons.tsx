import { useDAO } from '@/hooks/useDAO';

interface VoteButtonsProps {
  proposalId: number;
}

export default function VoteButtons({ proposalId }: VoteButtonsProps) {
  const { vote } = useDAO();

  return (
    <div className="flex gap-4">
      <button
        onClick={() => vote(proposalId, true)}
        className="flex-1 bg-green-500 text-white px-8 py-3 rounded-full hover:opacity-80 transition-opacity"
      >
        Vote Yes
      </button>
      <button
        onClick={() => vote(proposalId, false)}
        className="flex-1 bg-red-500 text-white px-8 py-3 rounded-full hover:opacity-80 transition-opacity"
      >
        Vote No
      </button>
    </div>
  );
}