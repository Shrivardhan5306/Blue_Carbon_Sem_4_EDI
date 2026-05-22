const hre = require("hardhat");

async function main() {
  const oldCarbonTokenAddress = "0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9";

  console.log("Deploying CarbonMarketplace using CarbonToken:", oldCarbonTokenAddress);

  const CarbonMarketplace = await hre.ethers.getContractFactory("CarbonMarketplace");
  const marketplace = await CarbonMarketplace.deploy(oldCarbonTokenAddress);

  await marketplace.waitForDeployment();
  const address = await marketplace.getAddress();

  console.log(`CarbonMarketplace deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
