// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleDAO {
    address public owner;
    uint256 public constant PROPOSAL_COST = 1 ether; // 1 NEX

    struct Proposal {
        string title;           
        string description;     
        address creator;        
        uint256 yesVotes;      
        uint256 noVotes;       
        bool exists;           
        mapping(address => bool) hasVoted;  
    }

    // Pour retourner les propositions dans getAllProposals
    struct ProposalView {
        uint256 id;
        string title;           
        string description;     
        address creator;        
        uint256 yesVotes;      
        uint256 noVotes;       
        bool exists;
    }

    // État du contrat
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId, 
        string title,
        string description, 
        address indexed creator
    );
    event Voted(
        uint256 indexed proposalId, 
        address indexed voter, 
        bool support,
        uint256 yesVotes,
        uint256 noVotes
    );
    event ProposalDeleted(uint256 indexed proposalId, address indexed deletedBy);

    constructor() {
        owner = msg.sender;
        proposalCount = 0;
    }

    function createProposal(
        string memory title,
        string memory description
    ) external payable returns (uint256) {
        require(msg.value == PROPOSAL_COST, "Must send 1 NEX to create proposal");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.title = title;
        newProposal.description = description;
        newProposal.creator = msg.sender;
        newProposal.exists = true;

        // Transférer le NEX à l'owner
        (bool sent, ) = owner.call{value: msg.value}("");
        require(sent, "Failed to send NEX to owner");
        
        emit ProposalCreated(proposalId, title, description, msg.sender);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.exists, "Proposal does not exist");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(msg.sender != proposal.creator, "Creator cannot vote");

        proposal.hasVoted[msg.sender] = true;

        if (support) {
            proposal.yesVotes += 1;
        } else {
            proposal.noVotes += 1;
        }

        emit Voted(
            proposalId, 
            msg.sender, 
            support, 
            proposal.yesVotes, 
            proposal.noVotes
        );
    }

    function deleteProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.creator || msg.sender == owner,
            "Only creator or owner can delete"
        );
        require(proposal.exists, "Proposal does not exist");
        
        proposal.exists = false;
        emit ProposalDeleted(proposalId, msg.sender);
    }

    // Getters
    function getProposal(uint256 proposalId) external view returns (
        string memory title,
        string memory description,
        address creator,
        uint256 yesVotes,
        uint256 noVotes,
        bool exists
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.creator,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.exists
        );
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    // Récupérer les 5 dernières propositions
    function getRecentProposals() external view returns (ProposalView[] memory) {
        uint256 count = proposalCount > 5 ? 5 : proposalCount;
        ProposalView[] memory recentProposals = new ProposalView[](count);
        
        for(uint256 i = 0; i < count; i++) {
            uint256 proposalId = proposalCount - 1 - i;
            Proposal storage proposal = proposals[proposalId];
            recentProposals[i] = ProposalView({
                id: proposalId,
                title: proposal.title,
                description: proposal.description,
                creator: proposal.creator,
                yesVotes: proposal.yesVotes,
                noVotes: proposal.noVotes,
                exists: proposal.exists
            });
        }
        
        return recentProposals;
    }

    // Récupérer toutes les propositions triées par votes
    function getAllProposals() external view returns (ProposalView[] memory) {
        // Créer un tableau de la taille maximale possible
        ProposalView[] memory allProposals = new ProposalView[](proposalCount);
        uint256 activeCount = 0;
        
        // Remplir le tableau avec les propositions existantes
        for(uint256 i = 0; i < proposalCount; i++) {
            if(proposals[i].exists) {
                allProposals[activeCount] = ProposalView({
                    id: i,
                    title: proposals[i].title,
                    description: proposals[i].description,
                    creator: proposals[i].creator,
                    yesVotes: proposals[i].yesVotes,
                    noVotes: proposals[i].noVotes,
                    exists: true
                });
                activeCount++;
            }
        }

        // Créer un tableau de la bonne taille avec seulement les propositions actives
        ProposalView[] memory activeProposals = new ProposalView[](activeCount);
        for(uint256 i = 0; i < activeCount; i++) {
            activeProposals[i] = allProposals[i];
        }

        return activeProposals;
    }

    // Ajoutons aussi une fonction plus simple pour obtenir juste le nombre de propositions
    function getProposalCount() external view returns (uint256 total, uint256 active) {
        total = proposalCount;
        active = 0;
        for(uint256 i = 0; i < proposalCount; i++) {
            if(proposals[i].exists) {
                active++;
            }
        }
        return (total, active);
    }
}