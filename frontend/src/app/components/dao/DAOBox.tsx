"use client"

import { useDAO } from '@/hooks/useDAO';
import { useEffect } from 'react';
import { HomeBox } from '../common/HomeBox';
export function DAOBox() {
  const { proposalCount, getProposalCount } = useDAO();

  useEffect(() => {
    getProposalCount();
  }, [getProposalCount]);

  return (
    <HomeBox
      title="DAO"
      description={`${proposalCount.active} active proposals`}
      href="/dao"
      buttonText="Create and vote on proposals"
    />
  );
}