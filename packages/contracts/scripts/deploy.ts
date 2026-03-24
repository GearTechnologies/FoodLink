import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with account:", deployer.address);

  // 1. Deploy BatchRegistry
  const BatchRegistry = await ethers.getContractFactory("BatchRegistry");
  const batchRegistry = await BatchRegistry.deploy(deployer.address, {
    gasPrice: 1500000000000,
  });
  await batchRegistry.waitForDeployment();
  const batchRegistryAddress = await batchRegistry.getAddress();
  console.log("✅ BatchRegistry deployed to:", batchRegistryAddress);

  // 2. Deploy RecallManager
  const RecallManager = await ethers.getContractFactory("RecallManager");
  const recallManager = await RecallManager.deploy(deployer.address, {
    gasPrice: 1500000000000,
  });
  await recallManager.waitForDeployment();
  const recallManagerAddress = await recallManager.getAddress();
  console.log("✅ RecallManager deployed to:", recallManagerAddress);

  // Output env vars for copy-paste
  console.log("\nUpdate your .env with:");
  console.log(`HEDERA_CONTRACT_ID=${batchRegistryAddress}`);
  console.log(`HEDERA_RECALL_MANAGER_CONTRACT_ID=${recallManagerAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
