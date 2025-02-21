'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDAO } from '@/hooks/useDAO';
import { ProposalList } from '@/components/dao/ProposalList';
import CreateProposal from '@/components/dao/CreateProposal';
import { Button } from '@/components/common/Button';

export default function DAOPage() {
  const { refreshDAOState, daoState } = useDAO();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    await refreshDAOState();
  }, [refreshDAOState]);

  useEffect(() => {
    fetchData();
  }, []); 

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowCreateModal(false);
    }
  };

  const handleProposalCreated = async () => {
    setShowCreateModal(false);
    await fetchData();
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-semibold">
            DAO Proposals ({daoState.proposals.length})
          </h1>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <span>+ Create Proposal</span>
          </Button>
        </div>

        <div className="w-full">
          <ProposalList 
            daoState={daoState}
            onVoted={fetchData}
          />
        </div>

        {showCreateModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleOverlayClick}
          >
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Create Proposal</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <CreateProposal onSuccess={handleProposalCreated} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}