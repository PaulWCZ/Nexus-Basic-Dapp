import { ethers } from "hardhat";
import * as readline from "readline/promises";

// Liste des contrats disponibles
const CONTRACTS = {
  LOTTERY: "Lottery",
  SIMPLEDAO: "SimpleDAO"
} as const;

type ContractName = keyof typeof CONTRACTS;

async function main() {
  // Créer l'interface readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Afficher les options disponibles
    console.log("\nContrats disponibles :");
    Object.entries(CONTRACTS).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    // Demander quel contrat déployer
    const answer = await rl.question("\nQuel contrat voulez-vous déployer ? (LOTTERY/SIMPLEDAO) : ");
    const contractName = answer.toUpperCase() as ContractName;

    if (!CONTRACTS[contractName]) {
      throw new Error("Contrat non reconnu");
    }

    // Déployer le contrat choisi
    console.log(`\nDéploiement du contrat ${CONTRACTS[contractName]}...`);
    
    const [deployer] = await ethers.getSigners();
    console.log("Déploiement avec l'adresse:", deployer.address);

    const Contract = await ethers.getContractFactory(CONTRACTS[contractName]);
    const contract = await Contract.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`${CONTRACTS[contractName]} déployé à l'adresse:`, address);

  } catch (error) {
    console.error("Erreur lors du déploiement:", error);
    process.exit(1);
  } finally {
    // Fermer proprement readline
    rl.close();
  }
}

// Exécuter le script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});