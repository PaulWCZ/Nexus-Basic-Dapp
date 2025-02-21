// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    // Prix en NEX (1 NEX = 1e18 wei)
    uint256 public constant TICKET_PRICE = 1e18; // 1 NEX
    uint256 public constant MAX_TICKETS = 15;
    uint256 public constant PRIZE_AMOUNT = 10e18; // 10 NEX
    
    address[] public players;
    uint256 public currentLotteryId;
    bool public isOpen;
    address public immutable owner; // Créateur du contrat
    
    event TicketPurchased(address player, uint256 lotteryId);
    event WinnerSelected(address winner, uint256 lotteryId, uint256 prize);
    event LotteryReset(uint256 newLotteryId);
    
    struct LotteryHistory {
        address winner;
        uint256 prize;
        uint256 timestamp;
    }

    mapping(uint256 => LotteryHistory) public lotteryHistory;
    
    constructor() {
        isOpen = true;
        currentLotteryId = 1;
        owner = msg.sender; // Stocke l'adresse du créateur
    }
    
    function buyTicket() public payable {
        require(isOpen, "Lottery is not open");
        require(msg.value == TICKET_PRICE, "Incorrect ticket price");
        require(players.length < MAX_TICKETS, "Lottery is full");
        
        players.push(msg.sender);
        emit TicketPurchased(msg.sender, currentLotteryId);
        
        if (players.length == MAX_TICKETS) {
            isOpen = false;
        }
    }
    
    function revealWinner() public {
        require(!isOpen, "Lottery still open");
        require(players.length == MAX_TICKETS, "Not enough players");
        
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            block.timestamp
        ))) % MAX_TICKETS;
        
        address winner = players[randomNumber];
        
        // Save history
        lotteryHistory[currentLotteryId] = LotteryHistory({
            winner: winner,
            prize: PRIZE_AMOUNT,
            timestamp: block.timestamp
        });
        
        // Calcul des montants
        uint256 totalAmount = TICKET_PRICE * MAX_TICKETS; // 15 NEX
        uint256 ownerShare = totalAmount - PRIZE_AMOUNT; // 5 NEX
        
        // Envoi du prix au gagnant
        (bool sentToWinner, ) = winner.call{value: PRIZE_AMOUNT}("");
        require(sentToWinner, "Failed to send prize to winner");
        
        // Envoi de la différence au créateur
        (bool sentToOwner, ) = owner.call{value: ownerShare}("");
        require(sentToOwner, "Failed to send remaining funds to owner");
        
        emit WinnerSelected(winner, currentLotteryId, PRIZE_AMOUNT);
        
        // Reset de la loterie
        delete players;
        currentLotteryId++;
        isOpen = true;
        
        emit LotteryReset(currentLotteryId);
    }
    
    // Vue du solde actuel du contrat
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getCurrentPlayers() public view returns (address[] memory) {
        return players;
    }
    
    function getTicketCount() public view returns (uint256) {
        return players.length;
    }
    
    function getRemainingTickets() public view returns (uint256) {
        return MAX_TICKETS - players.length;
    }

    // En cas d'urgence, permet au owner de récupérer les fonds
    function emergencyWithdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent, "Failed to send balance to owner");
    }

    // Nouvelle fonction pour récupérer l'historique
    function getLotteryHistory(uint256 lotteryId) public view returns (address winner, uint256 prize, uint256 timestamp) {
        LotteryHistory memory history = lotteryHistory[lotteryId];
        return (history.winner, history.prize, history.timestamp);
    }
}