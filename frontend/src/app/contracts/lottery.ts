export const LOTTERY = {
    ADDRESS: '0x2724b5d520f2D864F1153a891Bb02613822eAa57',
    TICKET_PRICE: '1.0',
    MAX_TICKETS: 15,
    PRIZE_AMOUNT: '10.0',
    REVEALER_REWARD: '0.5'
  }
  
  export const CONTRACT_ABI = [
    "function buyTicket() public payable",
    "function revealWinner() public",
    "function getCurrentPlayers() public view returns (address[] memory)",
    "function getTicketCount() public view returns (uint256)",
    "function getRemainingTickets() public view returns (uint256)",
    "function isOpen() public view returns (bool)",
    "function currentLotteryId() public view returns (uint256)",
    "function owner() public view returns (address)",
    "function getLotteryHistory(uint256 lotteryId) public view returns (address winner, uint256 prize, uint256 timestamp)",
    "event TicketPurchased(address player, uint256 lotteryId)",
    "event WinnerSelected(address winner, uint256 lotteryId, uint256 prize)",
    "event LotteryReset(uint256 newLotteryId)"
  ];