const VehicleTaxSimple = artifacts.require("VehicleTaxSimple");

module.exports = function(deployer, network, accounts) {
  // Treasury address - using the second account as treasury
  const treasuryAddress = accounts[1] || "0xeD09fc2a239f19eCC3E5A86967a7d93D45bd4a91";
  
  console.log("Deploying VehicleTaxSimple contract...");
  console.log("Treasury address:", treasuryAddress);
  console.log("Deployer address:", accounts[0]);
  
  deployer.deploy(VehicleTaxSimple, treasuryAddress)
    .then(() => {
      console.log("✅ VehicleTaxSimple contract deployed successfully!");
      console.log("📍 Contract address:", VehicleTaxSimple.address);
      
      // Save contract info for frontend
      const fs = require('fs');
      const path = require('path');
      
      const contractInfo = {
        address: VehicleTaxSimple.address,
        abi: VehicleTaxSimple.abi,
        deployedAt: new Date().toISOString(),
        network: 'ganache',
        treasury: treasuryAddress,
        deployer: accounts[0]
      };
      
      // Save to frontend contracts folder
      const frontendContractPath = path.join(__dirname, '../../frontend/src/contracts/VehicleTax.json');
      fs.writeFileSync(frontendContractPath, JSON.stringify(contractInfo, null, 2));
      
      console.log("💾 Contract info saved to frontend");
      console.log("🎉 Tax contract deployment completed!");
    })
    .catch(error => {
      console.error("❌ Deployment failed:", error);
      throw error;
    });
};
