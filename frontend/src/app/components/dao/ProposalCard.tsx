import { ProposalView } from '@/contracts/types';
import { useDAO } from '@/hooks/useDAO';
import { formatAddress } from '@/utils/formatters';
import { useWallet } from '@/providers/WalletProvider';
import { Button } from '@/components/common/Button';

interface ProposalCardProps {
  proposal: ProposalView;
  isOwner: boolean;
  onVoted: () => Promise<void>;
}

export function ProposalCard({ proposal, isOwner, onVoted }: ProposalCardProps) {
  const { vote, deleteProposal } = useDAO();
  const { userAddress } = useWallet();
  const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
  const yesPercentage = totalVotes > 0 ? (Number(proposal.yesVotes) / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (Number(proposal.noVotes) / totalVotes) * 100 : 0;

  const canDelete = isOwner || (userAddress && userAddress.toLowerCase() === proposal.creator.toLowerCase());

  const handleVote = async (support: boolean) => {
    await vote(proposal.id, support);
    await onVoted();
  };

  const handleDelete = async () => {
    await deleteProposal(proposal.id);
    await onVoted();
  };

  return (
    <div className="bg-white/80 rounded-[24px] p-6 shadow-sm backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-medium mb-1">{proposal.title}</h3>
          <p className="text-gray-500 text-sm">
            Created by {formatAddress(proposal.creator)}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>

      <p className="text-gray-600 mb-6">{proposal.description}</p>

      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${yesPercentage}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${noPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{proposal.yesVotes} Yes</span>
          <span>{proposal.noVotes} No</span>
        </div>
      </div>

      {userAddress && (
        <div className="flex gap-3">
          <Button 
            onClick={() => handleVote(true)}
            className="flex-1 bg-green-500 hover:bg-green-600"
          >
            Vote Yes
          </Button>
          <Button
            onClick={() => handleVote(false)}
            className="flex-1 bg-red-500 hover:bg-red-600"
          >
            Vote No
          </Button>
        </div>
      )}
    </div>
  );
}