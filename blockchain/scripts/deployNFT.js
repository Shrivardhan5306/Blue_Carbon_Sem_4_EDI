const hre = require("hardhat");

async function main() {
  const oldCarbonTokenAddress = "0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9";

  console.log("Deploying CarbonOffsetNFT using CarbonToken:", oldCarbonTokenAddress);

  const CarbonOffsetNFT = await hre.ethers.getContractFactory("CarbonOffsetNFT");
  const nft = await CarbonOffsetNFT.deploy(oldCarbonTokenAddress);

  await nft.waitForDeployment();
  const address = await nft.getAddress();

  console.log(`CarbonOffsetNFT deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
