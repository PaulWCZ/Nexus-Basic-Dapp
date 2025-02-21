"use client"

import { ProposalCard } from './ProposalCard';
import { DAOState } from '@/contracts/types';

interface ProposalListProps {
  daoState: DAOState;
  onVoted: () => Promise<void>;
}

export function ProposalList({ daoState, onVoted }: ProposalListProps) {
  return (
    <div className="bg-black/5 p-8 rounded-[32px] backdrop-blur-sm">
      <h2 className="text-3xl font-light text-black mb-8">Active Proposals</h2>
      
      {(!daoState.proposals || daoState.proposals.length === 0) ? (
        <div className="text-center p-8">
          <p className="text-gray-600">No proposals yet. Create the first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {daoState.proposals.map((proposal) => (
            <ProposalCard 
              key={proposal.id} 
              proposal={proposal}
              isOwner={daoState.isOwner}
              onVoted={onVoted}
            />
          ))}
        </div>
      )}
    </div>
  );
}