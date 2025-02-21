import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { expect } from "chai";
  import hre from "hardhat";
  
  describe("SimpleDAO", function () {
    async function deploySimpleDAOFixture() {
      const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();
      const SimpleDAO = await hre.ethers.getContractFactory("SimpleDAO");
      const simpleDAO = await SimpleDAO.deploy();
  
      return { simpleDAO, owner, otherAccount, thirdAccount };
    }
  
    describe("Deployment", function () {
      it("Should set the right owner", async function () {
        const { simpleDAO, owner } = await loadFixture(deploySimpleDAOFixture);
        expect(await simpleDAO.owner()).to.equal(owner.address);
      });
    });
  
    describe("Proposal Creation", function () {
      it("Should create a proposal with correct payment", async function () {
        const { simpleDAO, otherAccount } = await loadFixture(deploySimpleDAOFixture);
        const proposalCost = hre.ethers.parseEther("1"); // 1 NEX
  
        await expect(simpleDAO.connect(otherAccount).createProposal(
          "Test Proposal",
          "Description",
          { value: proposalCost }
        )).to.emit(simpleDAO, "ProposalCreated");
  
        const proposal = await simpleDAO.getProposal(0);
        expect(proposal[0]).to.equal("Test Proposal"); // title
        expect(proposal[1]).to.equal("Description"); // description
        expect(proposal[2]).to.equal(otherAccount.address); // creator
        expect(proposal[5]).to.be.true; // exists
      });
  
      it("Should fail if not enough NEX sent", async function () {
        const { simpleDAO, otherAccount } = await loadFixture(deploySimpleDAOFixture);
        const wrongCost = hre.ethers.parseEther("0.5");
  
        await expect(
          simpleDAO.connect(otherAccount).createProposal(
            "Test",
            "Description",
            { value: wrongCost }
          )
        ).to.be.revertedWith("Must send 1 NEX to create proposal");
      });
    });
  
    describe("Voting", function () {
      async function proposalFixture() {
        const { simpleDAO, owner, otherAccount, thirdAccount } = await loadFixture(deploySimpleDAOFixture);
        const proposalCost = hre.ethers.parseEther("1");
  
        await simpleDAO.connect(otherAccount).createProposal(
          "Test Proposal",
          "Description",
          { value: proposalCost }
        );
  
        return { simpleDAO, owner, otherAccount, thirdAccount };
      }
  
      it("Should allow voting on existing proposal", async function () {
        const { simpleDAO, thirdAccount } = await loadFixture(proposalFixture);
  
        await expect(simpleDAO.connect(thirdAccount).vote(0, true))
          .to.emit(simpleDAO, "Voted")
          .withArgs(0, thirdAccount.address, true, 1, 0);
      });
  
      it("Should not allow creator to vote", async function () {
        const { simpleDAO, otherAccount } = await loadFixture(proposalFixture);
  
        await expect(
          simpleDAO.connect(otherAccount).vote(0, true)
        ).to.be.revertedWith("Creator cannot vote");
      });
  
      it("Should not allow double voting", async function () {
        const { simpleDAO, thirdAccount } = await loadFixture(proposalFixture);
  
        await simpleDAO.connect(thirdAccount).vote(0, true);
        await expect(
          simpleDAO.connect(thirdAccount).vote(0, true)
        ).to.be.revertedWith("Already voted");
      });
    });
  
    describe("Proposal Management", function () {
      async function proposalFixture() {
        const { simpleDAO, owner, otherAccount, thirdAccount } = await loadFixture(deploySimpleDAOFixture);
        const proposalCost = hre.ethers.parseEther("1");
  
        await simpleDAO.connect(otherAccount).createProposal(
          "Test Proposal",
          "Description",
          { value: proposalCost }
        );
  
        return { simpleDAO, owner, otherAccount, thirdAccount };
      }
  
      it("Should allow creator to delete proposal", async function () {
        const { simpleDAO, otherAccount } = await loadFixture(proposalFixture);
  
        await expect(simpleDAO.connect(otherAccount).deleteProposal(0))
          .to.emit(simpleDAO, "ProposalDeleted")
          .withArgs(0, otherAccount.address);
      });
  
      it("Should allow owner to delete proposal", async function () {
        const { simpleDAO, owner } = await loadFixture(proposalFixture);
  
        await expect(simpleDAO.connect(owner).deleteProposal(0))
          .to.emit(simpleDAO, "ProposalDeleted")
          .withArgs(0, owner.address);
      });
  
      it("Should not allow non-owner/non-creator to delete", async function () {
        const { simpleDAO, thirdAccount } = await loadFixture(proposalFixture);
  
        await expect(
          simpleDAO.connect(thirdAccount).deleteProposal(0)
        ).to.be.revertedWith("Only creator or owner can delete");
      });
    });
  
    describe("Proposal Queries", function () {
      async function multipleProposalsFixture() {
        const { simpleDAO, owner, otherAccount, thirdAccount } = await loadFixture(deploySimpleDAOFixture);
        const proposalCost = hre.ethers.parseEther("1");
  
        // Create multiple proposals
        for(let i = 0; i < 7; i++) {
          await simpleDAO.connect(otherAccount).createProposal(
            `Proposal ${i}`,
            "Description",
            { value: proposalCost }
          );
          
          // Add some votes to first 3 proposals
          if (i < 3) {
            await simpleDAO.connect(thirdAccount).vote(i, true);
          }
        }
  
        return { simpleDAO, owner, otherAccount, thirdAccount };
      }
  
      it("Should return recent proposals", async function () {
        const { simpleDAO } = await loadFixture(multipleProposalsFixture);
        
        const recentProposals = await simpleDAO.getRecentProposals();
        expect(recentProposals.length).to.equal(5);
        expect(recentProposals[0].id).to.equal(6); // Most recent first
      });
  
      it("Should return all proposals sorted by votes", async function () {
        const { simpleDAO } = await loadFixture(multipleProposalsFixture);
        
        const allProposals = await simpleDAO.getAllProposals();
        expect(allProposals.length).to.equal(7);
        // First proposals should have votes
        expect(allProposals[0].yesVotes).to.be.gt(0);
      });
    });
  });