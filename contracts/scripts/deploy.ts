import { ethers } from "hardhat";

async function main() {
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();

  await lottery.waitForDeployment();

  console.log(`Lottery deployed to ${await lottery.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});