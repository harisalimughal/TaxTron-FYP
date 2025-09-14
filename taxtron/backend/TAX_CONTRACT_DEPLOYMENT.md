# 🚗 Vehicle Tax Contract Deployment Guide

## 📋 Overview
This guide helps you deploy the VehicleTax smart contract on Ganache for handling annual vehicle tax payments through MetaMask.

## 🛠️ Prerequisites

### 1. **Ganache Setup**
- Install and run Ganache
- Default URL: `http://127.0.0.1:7545`
- Ensure you have at least 2 accounts available

### 2. **Truffle Configuration**
Make sure your `truffle-config.js` includes Ganache network:
```javascript
networks: {
  development: {
    host: "127.0.0.1",
    port: 7545,
    network_id: "*",
    gas: 6721975,
    gasPrice: 20000000000
  }
}
```

## 🚀 Deployment Steps

### Step 1: Compile the Contract
```bash
cd taxtron/backend
npx truffle compile
```

### Step 2: Deploy Using Truffle
```bash
npx truffle migrate --network development
```

### Step 3: Alternative - Deploy Using Script
```bash
node scripts/deployTaxContract.js
```

## 📄 Contract Features

### **Tax Payment Functions:**
- `payAnnualTax(inspectionId, amount, year)` - Pay annual tax
- `isTaxPaid(inspectionId, year)` - Check payment status
- `getTaxPayment(inspectionId, year)` - Get payment details

### **Vehicle Management:**
- `registerVehicleForTax()` - Register vehicle for tax
- `getVehicleTaxInfo()` - Get vehicle tax information
- `getPaidYears()` - Get all paid years for a vehicle

### **Admin Functions:**
- `setYearlyTaxRate()` - Set tax rates
- `setTreasuryAddress()` - Update treasury
- `transferOwnership()` - Change contract owner

## 💰 Tax Calculation (Pakistan System)

### **Base Rates:**
- **Cars (Sedan/Hatchback)**: PKR 3,000 base
- **SUV**: PKR 8,000 base
- **Motorcycles**: PKR 800 base
- **Buses**: PKR 15,000 base
- **Trucks**: PKR 12,000 base

### **Engine Capacity Multipliers:**
- **≤1000cc**: 1.0x
- **1001-1600cc**: 1.5x
- **1601-2000cc**: 2.0x
- **2001-3000cc**: 3.0x
- **>3000cc**: 4.0x

### **Age Discounts:**
- **>10 years**: 30% discount
- **>5 years**: 20% discount

## 🔧 Integration Steps

### 1. **Update Contract Address**
After deployment, update `TaxPayment.jsx`:
```javascript
const TAX_CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

### 2. **MetaMask Configuration**
- Add Ganache network to MetaMask
- Import Ganache accounts
- Ensure sufficient ETH for gas fees

### 3. **Backend Integration**
The tax payment endpoint `/api/vehicles/:inspectionId/pay-tax` is already configured.

## 🧪 Testing

### 1. **Test Tax Payment Flow:**
1. Register a vehicle
2. Pay registration fee
3. Navigate to tax payment page
4. Connect MetaMask
5. Pay annual tax
6. Verify transaction in Ganache

### 2. **Verify Contract State:**
```javascript
// Check if tax is paid
await contract.methods.isTaxPaid("INSP-123", 2025).call();

// Get payment details
await contract.methods.getTaxPayment("INSP-123", 2025).call();
```

## 🔍 Troubleshooting

### **Common Issues:**
1. **"Contract not deployed"** - Run truffle migrate
2. **"Insufficient funds"** - Add ETH to MetaMask account
3. **"Gas estimation failed"** - Check contract parameters
4. **"Revert"** - Verify vehicle is registered and tax not already paid

### **Debug Commands:**
```bash
# Check Ganache connection
npx truffle console --network development

# Verify deployment
npx truffle networks

# Test contract interaction
npx truffle exec scripts/testTaxContract.js
```

## 📊 Expected Results

After successful deployment:
- ✅ Contract deployed on Ganache
- ✅ Tax payment functionality working
- ✅ MetaMask integration active
- ✅ Backend recording payments
- ✅ Dashboard showing tax status

## 🎯 Next Steps

1. Deploy the contract using the steps above
2. Test tax payment with a sample vehicle
3. Verify transaction appears in Ganache
4. Check backend logs for payment confirmation
5. Confirm Dashboard shows updated tax status

---

**Need Help?** Check the console logs during deployment for detailed information about the process.
