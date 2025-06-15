const VehicleRegistration = artifacts.require("VehicleRegistration");

module.exports = async function (deployer, network, accounts) {
  // Set the treasury address (for testing, we use accounts[1])
  const treasuryAddress = accounts[1];

  // Deploy the contract with the treasury address as constructor argument
  await deployer.deploy(VehicleRegistration, treasuryAddress);
};
