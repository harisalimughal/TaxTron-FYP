module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,  // Ganache default port
      network_id: "*", // Match any network
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",  // Updated to match OpenZeppelin requirements
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        viaIR: true  // Re-enable IR to fix "stack too deep" error
      }
    }
  }
};