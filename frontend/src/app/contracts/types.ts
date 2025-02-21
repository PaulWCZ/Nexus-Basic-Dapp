// Lottery Types

export interface NotificationProps {
    message: string;
    type: 'error' | 'success' | 'info';
}

export interface WinnerHistory {
    address: string;
    prize: bigint;
    timestamp: number;
    lotteryId: number;
}

export interface LotteryState {
    currentLotteryId: number;
    isOpen: boolean;
    ticketCount: number;
    players: string[];
    isOwner: boolean;
}

// SimpleDAO Types

export type ProposalView = {
    id: number;
    title: string;
    description: string;
    creator: string;
    yesVotes: number;
    noVotes: number;
    exists: boolean;
}

export type DAOState = {
    isOwner: boolean;
    proposals: ProposalView[];
    recentProposals: ProposalView[];
    hasVoted: boolean;
}