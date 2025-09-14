const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Ganache configuration
const GANACHE_URL = 'http://127.0.0.1:7545'; // Default Ganache URL
const web3 = new Web3(GANACHE_URL);

// Treasury address (you can use any Ganache account)
const TREASURY_ADDRESS = '0x4E7f5a1D602ea6a326BA6272defB76CBB1Ff938d';

async function deployVehicleTaxContract() {
    try {
        console.log('🚀 Starting VehicleTax contract deployment...');
        console.log('📡 Connecting to Ganache at:', GANACHE_URL);
        
        // Get accounts from Ganache
        const accounts = await web3.eth.getAccounts();
        console.log('📋 Available accounts:', accounts.length);
        console.log('💰 Deployer account:', accounts[0]);
        console.log('🏦 Treasury account:', TREASURY_ADDRESS);
        
        // Read the compiled contract
        const contractPath = path.join(__dirname, '../build/contracts/VehicleTax.json');
        
        if (!fs.existsSync(contractPath)) {
            console.log('❌ Contract not compiled yet. Please compile first:');
            console.log('   cd taxtron/backend');
            console.log('   npx truffle compile');
            return;
        }
        
        const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const abi = contractJson.abi;
        const bytecode = contractJson.bytecode;
        
        console.log('📄 Contract ABI loaded, functions:', abi.filter(item => item.type === 'function').length);
        
        // Create contract instance
        const VehicleTaxContract = new web3.eth.Contract(abi);
        
        // Deploy contract
        console.log('🔨 Deploying contract...');
        const deployedContract = await VehicleTaxContract
            .deploy({
                data: bytecode,
                arguments: [TREASURY_ADDRESS] // Constructor argument
            })
            .send({
                from: accounts[0],
                gas: 6000000,
                gasPrice: web3.utils.toWei('20', 'gwei')
            });
        
        console.log('✅ Contract deployed successfully!');
        console.log('📍 Contract address:', deployedContract.options.address);
        console.log('⛽ Gas used:', deployedContract.options.gas);
        
        // Save contract address and ABI for frontend
        const contractInfo = {
            address: deployedContract.options.address,
            abi: abi,
            deployedAt: new Date().toISOString(),
            network: 'ganache',
            treasury: TREASURY_ADDRESS,
            deployer: accounts[0]
        };
        
        // Save to frontend contracts folder
        const frontendContractPath = path.join(__dirname, '../../frontend/src/contracts/VehicleTax.json');
        fs.writeFileSync(frontendContractPath, JSON.stringify(contractInfo, null, 2));
        
        console.log('💾 Contract info saved to:', frontendContractPath);
        
        // Test basic functionality
        console.log('🧪 Testing contract functionality...');
        
        // Test setting tax rate
        await deployedContract.methods.setYearlyTaxRate(2025, 1000).send({
            from: accounts[0],
            gas: 100000
        });
        
        console.log('✅ Tax rate set for 2025');
        
        // Test registering a vehicle for tax
        await deployedContract.methods.registerVehicleForTax(
            'TEST-VEHICLE-001',
            'Toyota',
            'Corolla',
            'Sedan',
            1800,
            2023,
            accounts[1]
        ).send({
            from: accounts[0],
            gas: 300000
        });
        
        console.log('✅ Test vehicle registered for tax');
        
        console.log('\n🎉 Deployment completed successfully!');
        console.log('\n📋 Contract Details:');
        console.log('   Address:', deployedContract.options.address);
        console.log('   Treasury:', TREASURY_ADDRESS);
        console.log('   Owner:', accounts[0]);
        console.log('\n🔧 Next Steps:');
        console.log('   1. Update TaxPayment.jsx with new contract address');
        console.log('   2. Test tax payment functionality');
        console.log('   3. Verify transactions in Ganache');
        
        return deployedContract.options.address;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        
        if (error.message.includes('connection')) {
            console.log('\n💡 Troubleshooting:');
            console.log('   1. Make sure Ganache is running on http://127.0.0.1:7545');
            console.log('   2. Check if the network settings are correct');
            console.log('   3. Verify accounts are available');
        }
        
        if (error.message.includes('revert')) {
            console.log('\n💡 Contract Error:');
            console.log('   1. Check constructor parameters');
            console.log('   2. Verify treasury address is valid');
            console.log('   3. Check gas limits');
        }
        
        throw error;
    }
}

// Run deployment if called directly
if (require.main === module) {
    deployVehicleTaxContract()
        .then(address => {
            console.log(`\n🎯 Contract deployed at: ${address}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Deployment failed:', error.message);
            process.exit(1);
        });
}

module.exports = { deployVehicleTaxContract };
