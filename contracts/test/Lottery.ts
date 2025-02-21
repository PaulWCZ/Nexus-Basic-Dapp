import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Lottery", function () {
  // Fixture pour réutiliser le même setup
  async function deployLotteryFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();

    return { lottery, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should initialize with correct state", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);

      expect(await lottery.isOpen()).to.be.true;
      expect(await lottery.currentLotteryId()).to.equal(1);
      expect(await lottery.getTicketCount()).to.equal(0);
      expect(await lottery.getRemainingTickets()).to.equal(15);
    });

    it("Should set the right owner", async function () {
      const { lottery, owner } = await loadFixture(deployLotteryFixture);
      expect(await lottery.owner()).to.equal(owner.address);
    });
  });

  describe("Ticket Purchase", function () {
    it("Should allow buying a ticket with correct price", async function () {
      const { lottery, otherAccount } = await loadFixture(deployLotteryFixture);
      const ticketPrice = await hre.ethers.parseEther("1"); // 1 NEX

      await expect(lottery.connect(otherAccount).buyTicket({ value: ticketPrice }))
        .to.emit(lottery, "TicketPurchased")
        .withArgs(otherAccount.address, 1);

      expect(await lottery.getTicketCount()).to.equal(1);
    });

    it("Should fail if ticket price is incorrect", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const wrongPrice = await hre.ethers.parseEther("0.5"); // 0.5 NEX

      await expect(
        lottery.buyTicket({ value: wrongPrice })
      ).to.be.revertedWith("Incorrect ticket price");
    });

    it("Should close lottery when max tickets reached", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const ticketPrice = await hre.ethers.parseEther("1");
      const signers = await hre.ethers.getSigners();

      // Acheter 14 tickets (laissant 1 ticket disponible)
      for (let i = 0; i < 14; i++) {
        await lottery.connect(signers[i]).buyTicket({ value: ticketPrice });
      }

      // Vérifier que la loterie est encore ouverte avec 14 tickets
      expect(await lottery.isOpen()).to.be.true;
      expect(await lottery.getTicketCount()).to.equal(14);

      // Acheter le dernier ticket qui devrait fermer la loterie
      await lottery.connect(signers[14]).buyTicket({ value: ticketPrice });

      // Vérifier que la loterie est maintenant fermée
      expect(await lottery.isOpen()).to.be.false;
      expect(await lottery.getTicketCount()).to.equal(15);

      // Tenter d'acheter un ticket supplémentaire
      await expect(
        lottery.connect(signers[0]).buyTicket({ value: ticketPrice })
      ).to.be.revertedWith("Lottery is not open");
    });
  });

  describe("Winner Selection", function () {
    it("Should not allow reveal before lottery is full", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      await expect(lottery.revealWinner()).to.be.revertedWith("Lottery still open");
    });

    it("Should select winner and distribute prizes correctly", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const signers = await hre.ethers.getSigners();
      const ticketPrice = await hre.ethers.parseEther("1");
      const prizeAmount = await hre.ethers.parseEther("10");

      // Buy all tickets
      for (let i = 0; i < 15; i++) {
        await lottery.connect(signers[i]).buyTicket({ value: ticketPrice });
      }

      // Get initial balances
      const initialContractBalance = await hre.ethers.provider.getBalance(await lottery.getAddress());
      const initialOwnerBalance = await hre.ethers.provider.getBalance(signers[0].address);

      // Reveal winner
      await lottery.revealWinner();

      // Get final balances
      const finalContractBalance = await hre.ethers.provider.getBalance(await lottery.getAddress());
      const finalOwnerBalance = await hre.ethers.provider.getBalance(signers[0].address);

      // Contract should be empty (all funds distributed)
      expect(finalContractBalance).to.equal(0);

      // Owner should receive 5 NEX (minus gas costs)
      const ownerShare = ticketPrice * BigInt(15) - prizeAmount; // 5 NEX
      expect(finalOwnerBalance).to.be.gt(initialOwnerBalance); // Owner received their share
    });
  });

  describe("View Functions", function () {
    it("Should return correct player list", async function () {
      const { lottery, owner, otherAccount } = await loadFixture(deployLotteryFixture);
      const ticketPrice = await hre.ethers.parseEther("1");

      await lottery.buyTicket({ value: ticketPrice });
      await lottery.connect(otherAccount).buyTicket({ value: ticketPrice });

      const players = await lottery.getCurrentPlayers();
      expect(players.length).to.equal(2);
      expect(players[0]).to.equal(owner.address);
      expect(players[1]).to.equal(otherAccount.address);
    });

    it("Should return correct remaining tickets", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const ticketPrice = await hre.ethers.parseEther("1");

      await lottery.buyTicket({ value: ticketPrice });
      expect(await lottery.getRemainingTickets()).to.equal(14);
    });
  });

  describe("Winner History", function () {
    it("Should record winner history after revealing winner", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const signers = await hre.ethers.getSigners();
      const ticketPrice = await hre.ethers.parseEther("1");

      // Buy all tickets
      for (let i = 0; i < 15; i++) {
        await lottery.connect(signers[i]).buyTicket({ value: ticketPrice });
      }

      // Get current lottery ID
      const currentLotteryId = await lottery.currentLotteryId();
      
      // Reveal winner
      await lottery.revealWinner();

      // Get lottery history
      const [winner, prize, timestamp] = await lottery.getLotteryHistory(currentLotteryId);
      
      // Verify history was recorded
      expect(winner).to.not.equal(hre.ethers.ZeroAddress);
      expect(prize).to.equal(hre.ethers.parseEther("10")); // Prize amount
      expect(timestamp).to.be.gt(0);
    });

    it("Should maintain history across multiple lottery rounds", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const signers = await hre.ethers.getSigners();
      const ticketPrice = await hre.ethers.parseEther("1");

      // Complete first lottery
      for (let i = 0; i < 15; i++) {
        await lottery.connect(signers[i]).buyTicket({ value: ticketPrice });
      }
      const firstLotteryId = await lottery.currentLotteryId();
      await lottery.revealWinner();
      
      // Complete second lottery
      for (let i = 0; i < 15; i++) {
        await lottery.connect(signers[i]).buyTicket({ value: ticketPrice });
      }
      const secondLotteryId = await lottery.currentLotteryId();
      await lottery.revealWinner();

      // Get and verify both histories
      const [firstWinner] = await lottery.getLotteryHistory(firstLotteryId);
      const [secondWinner] = await lottery.getLotteryHistory(secondLotteryId);

      expect(firstWinner).to.not.equal(hre.ethers.ZeroAddress);
      expect(secondWinner).to.not.equal(hre.ethers.ZeroAddress);
    });

    it("Should return empty history for non-existent lottery", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const nonExistentId = 999;
      
      const [winner, prize, timestamp] = await lottery.getLotteryHistory(nonExistentId);

      expect(winner).to.equal(hre.ethers.ZeroAddress);
      expect(prize).to.equal(0);
      expect(timestamp).to.equal(0);
    });
  });
});