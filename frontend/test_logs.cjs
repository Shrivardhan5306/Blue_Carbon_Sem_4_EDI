const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/asD5khNptnhgPrPkDG3-e";
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  const abiPath = path.join(__dirname, 'src', 'CarbonTokenABI.json');
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  
  const TOKEN_ADDRESS = "0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9";
  const contract = new ethers.Contract(TOKEN_ADDRESS, abi, provider);

  try {
    const currentBlock = await provider.getBlockNumber();
    console.log("Current block:", currentBlock);
    const fromBlock = currentBlock - 50000;
    
    console.log("Querying Transfer events from block", fromBlock);
    const filter = contract.filters.Transfer();
    const logs = await contract.queryFilter(filter, fromBlock, 'latest');
    console.log("Found", logs.length, "Transfer logs");
    
    if (logs.length > 0) {
      const sample = logs[0];
      console.log("Sample log transactionHash:", sample.transactionHash);
      console.log("Sample log index:", sample.index);
      console.log("Sample log args type:", typeof sample.args);
      if (sample.args) {
        console.log("Sample log args is Array:", Array.isArray(sample.args));
        console.log("Sample log args keys:", Object.keys(sample.args));
        console.log("Sample log args values:", Array.from(sample.args));
        console.log("args[0]:", sample.args[0]);
        console.log("args[1]:", sample.args[1]);
        console.log("args[2]:", sample.args[2]);
        console.log("args[2] (formatted):", ethers.formatEther(sample.args[2]));
      }
    }
  } catch (err) {
    console.error("Error during log fetch:", err);
  }
}

main();
