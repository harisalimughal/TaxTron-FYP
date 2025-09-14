const { Web3 } = require('web3');
const contractABI = require('../build/contracts/VehicleRegistration.json');

async function checkContractOwner() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        const CONTRACT_ADDRESS = '0x98e503A4364ACdfA19441f07e81F4FFd53Dab75B';
        
        console.log('🔍 Checking Vehicle Registration Contract Owner...');
        console.log('📍 Contract Address:', CONTRACT_ADDRESS);
        
        const contract = new web3.eth.Contract(contractABI.abi, CONTRACT_ADDRESS);
        
        // Get contract owner
        const contractOwner = await contract.methods.owner().call();
        console.log('👑 Contract Owner:', contractOwner);
        
        // Get all Ganache accounts
        const accounts = await web3.eth.getAccounts();
        console.log('\n📋 Available Ganache Accounts:');
        
        accounts.forEach((account, index) => {
            const isOwner = account.toLowerCase() === contractOwner.toLowerCase();
            console.log(`   ${index}: ${account} ${isOwner ? '← 👑 CONTRACT OWNER (USE THIS ONE)' : ''}`);
        });
        
        // Get balances for first few accounts
        console.log('\n💰 Account Balances:');
        for (let i = 0; i < Math.min(3, accounts.length); i++) {
            const balance = await web3.eth.getBalance(accounts[i]);
            const ethBalance = web3.utils.fromWei(balance, 'ether');
            const isOwner = accounts[i].toLowerCase() === contractOwner.toLowerCase();
            console.log(`   ${accounts[i]}: ${ethBalance} ETH ${isOwner ? '← OWNER' : ''}`);
        }
        
        console.log('\n🎯 SOLUTION:');
        console.log(`   1. In MetaMask, switch to account: ${contractOwner}`);
        console.log(`   2. This is the account that deployed the contract`);
        console.log(`   3. Only this account can set tax amounts`);
        console.log(`   4. Import this account in MetaMask if not already present`);
        
        return contractOwner;
        
    } catch (error) {
        console.error('❌ Error checking contract owner:', error.message);
        
        if (error.message.includes('connection')) {
            console.log('\n💡 Troubleshooting:');
            console.log('   1. Make sure Ganache is running on http://127.0.0.1:7545');
            console.log('   2. Check if the contract address is correct');
        }
        
        throw error;
    }
}

if (require.main === module) {
    checkContractOwner()
        .then(owner => {
            console.log(`\n✅ Contract owner identified: ${owner}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Failed to check contract owner');
            process.exit(1);
        });
}

module.exports = { checkContractOwner };
