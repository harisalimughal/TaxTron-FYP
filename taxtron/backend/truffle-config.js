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
      version: "0.8.17",  // Use a more compatible version
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