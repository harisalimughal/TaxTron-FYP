import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import './TaxPayment.css';

const TaxPayment = () => {
  const { inspectionId } = useParams();
  
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [taxPaid, setTaxPaid] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [transactionHash, setTransactionHash] = useState('');

  // Contract ABI (same as registration component)
  const CONTRACT_ABI = [
    "function getVehicle(string memory _inspectionId) external view returns (tuple(string inspectionId, string make, string model, uint256 year, string engineNumber, string chassisNumber, string vehicleType, uint256 engineCapacity, string registrationNumber, address vehicleOwner, uint256 registrationFee, bool registrationFeePaid, uint256 registrationTimestamp, uint256 taxAmount, bool taxPaid, uint256 taxPaidTimestamp, string registrationTxHash, string taxTxHash, bool isActive))",
    "function payTax(string memory _inspectionId, string memory _taxTxHash) external payable",
    "function getTaxAmount(string memory _inspectionId) external view returns (uint256)",
    "function getPaymentStatus(string memory _inspectionId) external view returns (bool registrationPaid, bool taxPaid, uint256 taxAmount)",
    "event TaxPaid(string indexed inspectionId, address indexed owner, uint256 taxAmount, uint256 timestamp)"
  ];

  const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual deployed address

  useEffect(() => {
    checkWalletConnection();
    fetchVehicleData();
  }, [inspectionId]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          checkTaxStatus(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        checkTaxStatus(accounts[0]);
      } catch (error) {
        setError('Failed to connect wallet');
      }
    } else {
      setError('MetaMask not installed');
    }
  };

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/inspections/${inspectionId}`);
      const data = await response.json();
      
      if (data.success) {
        setVehicleData(data.data);
      } else {
        setError(`Vehicle data not found: ${data.message}`);
      }
    } catch (error) {
      setError(`Failed to fetch vehicle data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTaxStatus = async (address) => {
    if (!address || !inspectionId) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Check vehicle registration and tax status
      const paymentStatus = await contract.getPaymentStatus(inspectionId);
      
      if (!paymentStatus.registrationPaid) {
        setError('Vehicle must be registered before paying tax');
        return;
      }
      
      setTaxPaid(paymentStatus.taxPaid);
      setTaxAmount(ethers.utils.formatUnits(paymentStatus.taxAmount, 'wei'));
      
      if (paymentStatus.taxPaid) {
        // Get transaction hash from vehicle data
        const vehicleData = await contract.getVehicle(inspectionId);
        setTransactionHash(vehicleData.taxTxHash);
      }
      
    } catch (error) {
      console.error('Error checking tax status:', error);
      setError('Failed to check tax status from blockchain');
    }
  };

  const calculateTaxAmount = (vehicleType, engineCapacity, year) => {
    // Tax calculation logic based on your requirements
    let baseTax = 0;
    
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;
    
    // Base tax by vehicle type
    const baseTaxRates = {
      'Car': 3000,
      'Motorcycle': 1000,
      'Truck': 5000,
      'Bus': 7000,
      'Van': 4000,
      'SUV': 4500,
      'Default': 2000
    };
    
    baseTax = baseTaxRates[vehicleType] || baseTaxRates['Default'];
    
    // Age-based adjustment
    if (vehicleAge > 10) {
      baseTax *= 0.8; // 20% reduction for old vehicles
    } else if (vehicleAge < 3) {
      baseTax *= 1.2; // 20% increase for new vehicles
    }
    
    // Engine capacity adjustment
    if (vehicleType === 'Car' && engineCapacity > 2000) {
      baseTax += 1500;
    } else if (vehicleType === 'Motorcycle' && engineCapacity > 600) {
      baseTax += 500;
    }
    
    return Math.floor(baseTax);
  };

  const handleTaxPayment = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }

    if (taxAmount === 0) {
      setError('Tax amount not set. Please contact administrator.');
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Convert tax amount to Wei (assuming tax is in PKR, convert to ETH)
      const taxInEth = ethers.utils.parseEther((taxAmount * 0.000001).toString());
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Pay tax
      const tx = await contract.payTax(
        inspectionId,
        "", // Transaction hash will be set after confirmation
        {
          value: taxInEth,
          gasLimit: 300000
        }
      );

      console.log('Tax payment transaction submitted:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Tax payment confirmed:', receipt);

      // Update backend
      await updateTaxPaymentStatus(tx.hash);

      setTaxPaid(true);
      setTransactionHash(tx.hash);
      
      alert('Tax payment successful!');
      
    } catch (error) {
      console.error('Tax payment failed:', error);
      let errorMessage = 'Tax payment failed: ';
      
      if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds in wallet';
      } else if (error.message.includes('Tax already paid')) {
        errorMessage += 'Tax has already been paid for this vehicle';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const updateTaxPaymentStatus = async (txHash) => {
    try {
      await fetch(`http://localhost:5000/api/inspections/${inspectionId}/tax-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taxPaid: true,
          taxTransactionHash: txHash,
          walletAddress: walletAddress,
          taxAmount: taxAmount
        })
      });
    } catch (error) {
      console.error('Failed to update tax payment status in backend:', error);
    }
  };

  const viewTransaction = () => {
    const explorerUrl = `https://etherscan.io/tx/${transactionHash}`;
    window.open(explorerUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="tax-container">
        <div className="loading">Loading vehicle details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tax-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!vehicleData) {
    return (
      <div className="tax-container">
        <div className="error">No vehicle data found</div>
      </div>
    );
  }

  const { vehicleDetails } = vehicleData;
  const calculatedTax = calculateTaxAmount(vehicleDetails.vehicleType, vehicleDetails.engineCapacity, vehicleDetails.year);

  return (
    <div className="tax-container">
      <div className="tax-card">
        <h2>Vehicle Tax Payment</h2>
        
        {/* Vehicle Details */}
        <div className="vehicle-summary">
          <h3>Vehicle Information</h3>
          <div className="summary-item">
            <span>{vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.year})</span>
          </div>
          <div className="summary-item">
            <span>Registration: {vehicleData.registrationNumber}</span>
          </div>
          <div className="summary-item">
            <span>Type: {vehicleDetails.vehicleType}</span>
          </div>
        </div>

        {/* Tax Information */}
        <div className="tax-info">
          <h3>Tax Details</h3>
          <div className="tax-breakdown">
            <div className="tax-item">
              <span className="tax-label">Calculated Annual Tax:</span>
              <span className="tax-value">PKR {calculatedTax.toLocaleString()}</span>
            </div>
            {taxAmount > 0 && taxAmount !== calculatedTax && (
              <div className="tax-item">
                <span className="tax-label">Official Tax Amount:</span>
                <span className="tax-value">PKR {parseInt(taxAmount).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Connection */}
        {!walletAddress && (
          <div className="wallet-section">
            <button onClick={connectWallet} className="connect-wallet-btn">
              Connect MetaMask Wallet
            </button>
          </div>
        )}

        {walletAddress && (
          <div className="wallet-info">
            <p>Connected Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
          </div>
        )}

        {/* Tax Payment Section */}
        {!taxPaid && walletAddress && taxAmount > 0 && (
          <div className="payment-section">
            <button 
              onClick={handleTaxPayment} 
              disabled={paymentLoading}
              className="pay-tax-btn"
            >
              {paymentLoading ? 'Processing Tax Payment...' : `Pay Tax (PKR ${parseInt(taxAmount).toLocaleString()})`}
            </button>
            <p className="payment-note">
              Tax amount will be deducted from your MetaMask wallet
            </p>
          </div>
        )}

        {/* Tax Amount Not Set */}
        {!taxPaid && taxAmount === 0 && (
          <div className="tax-not-set">
            <div className="info-icon">ℹ️</div>
            <h3>Tax Amount Not Set</h3>
            <p>The official tax amount has not been set by the authorities yet.</p>
            <p>Estimated tax: PKR {calculatedTax.toLocaleString()}</p>
            <p>Please check back later or contact the registration office.</p>
          </div>
        )}

        {/* Tax Payment Success */}
        {taxPaid && (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h3>Tax Payment Successful!</h3>
            <p>Your vehicle tax has been paid and recorded on the blockchain.</p>
            {transactionHash && (
              <div className="transaction-info">
                <p className="tx-hash">
                  Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
                <button onClick={viewTransaction} className="view-tx-btn">
                  View on Block Explorer
                </button>
              </div>
            )}
            <div className="tax-receipt">
              <h4>Tax Payment Receipt</h4>
              <div className="receipt-item">
                <span>Vehicle: {vehicleDetails.make} {vehicleDetails.model}</span>
              </div>
              <div className="receipt-item">
                <span>Registration: {vehicleData.registrationNumber}</span>
              </div>
              <div className="receipt-item">
                <span>Tax Amount: PKR {parseInt(taxAmount).toLocaleString()}</span>
              </div>
              <div className="receipt-item">
                <span>Payment Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxPayment;