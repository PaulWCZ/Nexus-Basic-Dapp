import { useState } from 'react';
import { useDAO } from '@/hooks/useDAO';
import { SIMPLEDAO } from '@/contracts/simpleDAO';
import { Button } from '@/components/common/Button';

interface CreateProposalProps {
  onSuccess?: () => void;
}

export default function CreateProposal({ onSuccess }: CreateProposalProps) {
  const { createProposal } = useDAO();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProposal(title, description);
    setTitle('');
    setDescription('');
    onSuccess?.();
  };

  return (
    <div className="bg-white rounded-lg">
      <p className="text-gray-600 text-lg mb-4">
        Cost: {SIMPLEDAO.PROPOSAL_COST} NEX
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Proposal Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/5"
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Proposal Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-[24px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px]"
            required
          />
        </div>
        <div className="flex justify-center">
          <Button type="submit">
            Create Proposal (1.0 NEX)
          </Button>
        </div>
      </form>
    </div>
  );
}