const VehicleNFT = artifacts.require("VehicleNFT");

module.exports = async function (deployer) {
  await deployer.deploy(VehicleNFT);
};
