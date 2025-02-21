import { useState, useCallback } from 'react';
import { Contract, ethers } from 'ethers';
import { useWallet, PUBLIC_PROVIDER } from '../providers/WalletProvider';
import { useNotification } from '../providers/NotificationProvider';
import { SIMPLEDAO, CONTRACT_ABI } from '../contracts/simpleDAO';
import { ProposalView, DAOState } from '../contracts/types';

export function useDAO() {
  const { signer, userAddress } = useWallet();
  const { showNotification } = useNotification();
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [proposalCount, setProposalCount] = useState<{ total: number; active: number }>({ total: 0, active: 0 });
  const [daoState, setDaoState] = useState<DAOState>({
    isOwner: false,
    proposals: [],
    recentProposals: [],
    hasVoted: false
  });

  const extractErrorMessage = (error: any): string => {
    if (error.reason) return error.reason;
    if (error.message) {
      const match = error.message.match(/"([^"]+)"/);
      if (match) return match[1];
      return error.message;
    }
    return 'An error occurred';
  };

  const getProposalCount = useCallback(async () => {
    try {
      const contract = new Contract(SIMPLEDAO.ADDRESS, CONTRACT_ABI, PUBLIC_PROVIDER);
      const counts = await contract.getProposalCount();
      setProposalCount({ total: Number(counts.total), active: Number(counts.active) });
      return counts;
    } catch (error) {
      console.warn('Error fetching proposal counts:', error);
      showNotification('Error fetching proposal counts', 'error');
      return { total: 0, active: 0 };
    }
  }, [showNotification]);

  const refreshDAOState = useCallback(async () => {
    try {
      const contract = new Contract(SIMPLEDAO.ADDRESS, CONTRACT_ABI, PUBLIC_PROVIDER);
      
      const counts = await getProposalCount();

      let proposals: ProposalView[] = [];
      let recentProposals: ProposalView[] = [];
      if (counts.active > 0) {
        try {
          const rawProposals = await contract.getAllProposals();
          
          proposals = rawProposals.map((p: any) => ({
            id: Number(p.id),
            title: p.title,
            description: p.description,
            creator: p.creator,
            yesVotes: Number(p.yesVotes),
            noVotes: Number(p.noVotes),
            exists: p.exists
          }));

          recentProposals = proposals.slice(0, 5);
          proposals.sort((a, b) => b.yesVotes - a.yesVotes);
          
        } catch (error) {
          console.warn('Error fetching all proposals:', error);
          showNotification('Error fetching proposals', 'error');
        }
      }

      setDaoState(prev => ({
        ...prev,
        proposals: proposals,
        recentProposals: recentProposals
      }));

      if (userAddress) {
        try {
          const owner = await contract.owner();
          const isOwner = userAddress.toLowerCase() === owner.toLowerCase();
          setDaoState(prev => ({ ...prev, isOwner }));
        } catch (error) {
          console.warn('Error checking owner:', error);
          showNotification('Error checking owner status', 'error');
        }
      }

    } catch (error: any) {
      console.error('Error fetching DAO state:', error);
      showNotification('Error fetching DAO state', 'error');
    }
  }, [userAddress, showNotification, getProposalCount]);

  const createProposal = useCallback(async (title: string, description: string) => {
    if (!signer) {
      showNotification('Please connect your wallet', 'error');
      return;
    }

    try {
      const contract = new Contract(SIMPLEDAO.ADDRESS, CONTRACT_ABI, signer);
      showNotification('Creating proposal...', 'info');
      
      const tx = await contract.createProposal(title, description, {
        value: ethers.parseEther(SIMPLEDAO.PROPOSAL_COST)
      });
      setLastTxHash(tx.hash);
      showNotification('Transaction submitted. Waiting for confirmation...', 'info');
      
      await tx.wait();
      showNotification('Proposal created successfully!', 'success');
      await refreshDAOState();
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      const errorMessage = extractErrorMessage(error);
      showNotification(errorMessage, 'error');
    }
  }, [signer, showNotification, refreshDAOState]);

  const vote = useCallback(async (proposalId: number, support: boolean) => {
    if (!signer) {
      showNotification('Please connect your wallet', 'error');
      return;
    }

    try {
      const contract = new Contract(SIMPLEDAO.ADDRESS, CONTRACT_ABI, signer);
      showNotification('Submitting vote...', 'info');
      
      const tx = await contract.vote(proposalId, support);
      setLastTxHash(tx.hash);
      showNotification('Transaction submitted. Waiting for confirmation...', 'info');
      
      await tx.wait();
      showNotification('Vote submitted successfully!', 'success');
      await refreshDAOState();
    } catch (error: any) {
      console.error('Error voting:', error);
      const errorMessage = extractErrorMessage(error);
      showNotification(errorMessage, 'error');
    }
  }, [signer, showNotification, refreshDAOState]);

  const deleteProposal = useCallback(async (proposalId: number) => {
    if (!signer) {
      showNotification('Please connect your wallet', 'error');
      return;
    }

    try {
      const contract = new Contract(SIMPLEDAO.ADDRESS, CONTRACT_ABI, signer);
      showNotification('Deleting proposal...', 'info');
      
      const tx = await contract.deleteProposal(proposalId);
      setLastTxHash(tx.hash);
      showNotification('Transaction submitted. Waiting for confirmation...', 'info');
      
      await tx.wait();
      showNotification('Proposal deleted successfully!', 'success');
      await refreshDAOState();
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      const errorMessage = extractErrorMessage(error);
      showNotification(errorMessage, 'error');
    }
  }, [signer, showNotification, refreshDAOState]);

  return {
    daoState,
    lastTxHash,
    proposalCount,
    getProposalCount,
    refreshDAOState,
    createProposal,
    vote,
    deleteProposal
  };
}