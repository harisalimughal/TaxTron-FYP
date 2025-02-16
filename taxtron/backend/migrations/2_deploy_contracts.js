const VehicleRegistry = artifacts.require("VehicleRegistry");

module.exports = function (deployer) {
  deployer.deploy(VehicleRegistry);
};
