export const SIMPLEDAO = {
    ADDRESS: '0xc7591E8Ef2250A5eBC350E99E07acDfc2b08C288',
    PROPOSAL_COST: '1.0'
}

export const CONTRACT_ABI = [
    "function owner() public view returns (address)",
    "function createProposal(string memory title, string memory description) external payable returns (uint256)",
    "function vote(uint256 proposalId, bool support) external",
    "function deleteProposal(uint256 proposalId) external",
    "function getProposal(uint256 proposalId) external view returns (string memory title, string memory description, address creator, uint256 yesVotes, uint256 noVotes, bool exists)",
    "function hasVoted(uint256 proposalId, address voter) external view returns (bool)",
    "function getRecentProposals() external view returns (tuple(uint256 id, string title, string description, address creator, uint256 yesVotes, uint256 noVotes, bool exists)[] memory)",
    "function getAllProposals() external view returns (tuple(uint256 id, string title, string description, address creator, uint256 yesVotes, uint256 noVotes, bool exists)[] memory)",
    "function getProposalCount() external view returns (uint256 total, uint256 active)",
    "event ProposalCreated(uint256 indexed proposalId, string title, string description, address indexed creator)",
    "event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 yesVotes, uint256 noVotes)",
    "event ProposalDeleted(uint256 indexed proposalId, address indexed deletedBy)"
]