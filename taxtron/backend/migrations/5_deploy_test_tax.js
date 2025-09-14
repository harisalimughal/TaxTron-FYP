const TestTax = artifacts.require("TestTax");

module.exports = function(deployer, network, accounts) {
  const treasuryAddress = accounts[1];
  
  console.log("Deploying TestTax contract...");
  console.log("Treasury:", treasuryAddress);
  console.log("Deployer:", accounts[0]);
  
  deployer.deploy(TestTax, treasuryAddress)
    .then(() => {
      console.log("✅ TestTax deployed at:", TestTax.address);
      
      // Save for frontend
      const fs = require('fs');
      const path = require('path');
      
      const contractInfo = {
        address: TestTax.address,
        abi: TestTax.abi,
        deployedAt: new Date().toISOString(),
        network: 'ganache'
      };
      
      const frontendPath = path.join(__dirname, '../../frontend/src/contracts/VehicleTax.json');
      fs.writeFileSync(frontendPath, JSON.stringify(contractInfo, null, 2));
      
      console.log("💾 Contract saved to frontend");
    });
};
