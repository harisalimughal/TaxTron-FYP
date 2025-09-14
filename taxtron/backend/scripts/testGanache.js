const { Web3 } = require('web3');

async function testGanache() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        
        console.log('🔗 Testing Ganache connection...');
        
        // Get accounts
        const accounts = await web3.eth.getAccounts();
        console.log('📋 Available accounts:', accounts.length);
        
        accounts.forEach((account, index) => {
            console.log(`   ${index}: ${account}`);
        });
        
        // Get balances
        console.log('\n💰 Account balances:');
        for (let i = 0; i < Math.min(3, accounts.length); i++) {
            const balance = await web3.eth.getBalance(accounts[i]);
            const ethBalance = web3.utils.fromWei(balance, 'ether');
            console.log(`   ${accounts[i]}: ${ethBalance} ETH`);
        }
        
        // Test network
        const networkId = await web3.eth.net.getId();
        const blockNumber = await web3.eth.getBlockNumber();
        
        console.log('\n🌐 Network info:');
        console.log(`   Network ID: ${networkId}`);
        console.log(`   Block number: ${blockNumber}`);
        
        console.log('\n✅ Ganache connection successful!');
        
        return { accounts, networkId, blockNumber };
        
    } catch (error) {
        console.error('❌ Ganache connection failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure Ganache is running on http://127.0.0.1:7545');
        console.log('   2. Check if the port 7545 is correct');
        console.log('   3. Verify Ganache has accounts with ETH');
        
        throw error;
    }
}

if (require.main === module) {
    testGanache()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { testGanache };
