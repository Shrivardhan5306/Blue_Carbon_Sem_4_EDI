const hre = require("hardhat");

async function main() {

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const CarbonToken = await hre.ethers.getContractFactory("CarbonToken");

  const carbonToken = await CarbonToken.deploy();
  await carbonToken.waitForDeployment();

  const contractAddress = await carbonToken.getAddress();

  console.log("CarbonToken deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});