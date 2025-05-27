import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { ethers } from 'ethers';
import './Fee.css';

const Fee = () => {
  const { inspectionId } = useParams();
  const navigate = useNavigate();
  
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  // Fee calculation based on vehicle type (no tax for now)
  const calculateFee = (vehicleType, engineCapacity = 0) => {
    const baseFees = {
      'Car': 5000,
      'Motorcycle': 2000,
      'Truck': 8000,
      'Bus': 10000,
      'Van': 6000,
      'SUV': 7000,
      'Default': 4000
    };
    
    let regFee = baseFees[vehicleType] || baseFees['Default'];
    
    // Additional fee based on engine capacity (for cars and motorcycles)
    if (vehicleType === 'Car' && engineCapacity > 2000) {
      regFee += 2000;
    } else if (vehicleType === 'Motorcycle' && engineCapacity > 600) {
      regFee += 1000;
    }
    
    return {
      regFee: regFee,
      totalFee: regFee // No tax for now, so total equals reg fee
    };
  };

  // Contract ABI (simplified - you'll need to add your actual contract ABI)
  const CONTRACT_ABI = [
    "function registerVehicle(string memory inspectionId, string memory vehicleDetails, address owner) public",
    "function getVehicleByInspection(string memory inspectionId) public view returns (string memory)"
  ];

  const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"; // Replace with your actual contract address

  useEffect(() => {
    fetchVehicleData();
    checkWalletConnection();
  }, [inspectionId]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
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
      
      // Debug: Log the inspection ID being used
      console.log('Fetching data for inspection ID:', inspectionId);
      
      const response = await fetch(`http://localhost:5000/api/inspections/${inspectionId}`);
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      if (data.success) {
        const inspection = data.data;
        
        // Calculate fees based on vehicle details
        const vehicleDetails = inspection.vehicleDetails;
        const feeCalculation = calculateFee(
          vehicleDetails.vehicleType, 
          vehicleDetails.engineCapacity
        );
        
        // Add calculated fees to vehicle data
        setVehicleData({
          ...inspection,
          vehicleDetails: {
            ...vehicleDetails,
            ...feeCalculation
          }
        });
        
        // Check if already paid
        checkPaymentStatus(inspection.inspectionId);
      } else {
        setError(`Vehicle data not found. API Response: ${data.message}`);
        console.error('API Error:', data);
      }
    } catch (error) {
      setError(`Failed to fetch vehicle data: ${error.message}`);
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (inspectionId) => {
    // Check if payment is already made (implement based on your backend logic)
    try {
      const response = await fetch(`http://localhost:5000/api/inspections/${inspectionId}/payment-status`);
      if (response.ok) {
        const data = await response.json();
        setIsPaid(data.isPaid || false);
        setTransactionHash(data.transactionHash || '');
      }
    } catch (error) {
      console.log('Payment status check failed:', error);
    }
  };

  const handlePayment = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');

      // Convert fee to Wei (assuming fee is in PKR, you might need to convert to ETH)
      const feeInEth = ethers.utils.parseEther((vehicleData.vehicleDetails.totalFee / 100000).toString()); // Example conversion
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Send payment transaction
      const paymentTx = await signer.sendTransaction({
        to: "YOUR_TREASURY_ADDRESS", // Replace with your treasury address
        value: feeInEth,
        gasLimit: 21000
      });

      await paymentTx.wait();

      // Call smart contract to register vehicle
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const vehicleDetailsString = JSON.stringify({
        make: vehicleData.vehicleDetails.make,
        model: vehicleData.vehicleDetails.model,
        year: vehicleData.vehicleDetails.year,
        engineNumber: vehicleData.vehicleDetails.engineNumber,
        chassisNumber: vehicleData.vehicleDetails.chassisNumber,
        vehicleType: vehicleData.vehicleDetails.vehicleType,
        registrationNumber: vehicleData.registrationNumber
      });

      const contractTx = await contract.registerVehicle(
        vehicleData.inspectionId,
        vehicleDetailsString,
        walletAddress
      );

      await contractTx.wait();

      // Update payment status in backend
      await updatePaymentStatus(paymentTx.hash);

      setIsPaid(true);
      setTransactionHash(paymentTx.hash);
      
      alert('Payment successful! Vehicle registered on blockchain.');
      
    } catch (error) {
      console.error('Payment failed:', error);
      setError('Payment failed: ' + error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const updatePaymentStatus = async (txHash) => {
    try {
      await fetch(`http://localhost:5000/api/inspections/${inspectionId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPaid: true,
          transactionHash: txHash,
          walletAddress: walletAddress
        })
      });
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const goToNFT = () => {
    navigate(`/nft/${inspectionId}`);
  };

  if (loading) {
    return (
      <div className="fee-container">
        <div className="loading">Loading vehicle details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fee-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!vehicleData) {
    return (
      <div className="fee-container">
        <div className="error">No vehicle data found</div>
      </div>
    );
  }

  const { vehicleDetails } = vehicleData;

  return (
    <div className="fee-container">
      <div className="fee-card">
        <h2>Vehicle Registration Fee</h2>
        
        {/* Vehicle Details Section */}
        <div className="vehicle-details">
          <h3>Vehicle Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Make:</span>
              <span className="value">{vehicleDetails.make}</span>
            </div>
            <div className="detail-item">
              <span className="label">Model:</span>
              <span className="value">{vehicleDetails.model}</span>
            </div>
            <div className="detail-item">
              <span className="label">Year:</span>
              <span className="value">{vehicleDetails.year}</span>
            </div>
            <div className="detail-item">
              <span className="label">Type:</span>
              <span className="value">{vehicleDetails.vehicleType}</span>
            </div>
            <div className="detail-item">
              <span className="label">Engine Capacity:</span>
              <span className="value">{vehicleDetails.engineCapacity}cc</span>
            </div>
            <div className="detail-item">
              <span className="label">Registration Number:</span>
              <span className="value">{vehicleData.registrationNumber || 'Pending'}</span>
            </div>
          </div>
        </div>

        {/* Fee Breakdown Section */}
        <div className="fee-breakdown">
          <div className="fee-item total-fee">
            <span className="fee-label">Registration Fee:</span>
            <span className="fee-value">PKR {vehicleDetails.regFee.toLocaleString()}</span>
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

        {/* Payment Section */}
        {!isPaid && walletAddress && (
          <div className="payment-section">
            <button 
              onClick={handlePayment} 
              disabled={paymentLoading}
              className="pay-btn"
            >
              {paymentLoading ? 'Processing Payment...' : `Pay PKR ${vehicleDetails.totalFee.toLocaleString()}`}
            </button>
          </div>
        )}

        {/* Payment Success */}
        {isPaid && (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>Your vehicle has been registered on the blockchain.</p>
            {transactionHash && (
              <p className="tx-hash">
                Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {/* NFT Button */}
        {isPaid && (
          <div className="nft-section">
            <button onClick={goToNFT} className="nft-btn">
              Generate Vehicle NFT
            </button>
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

export default Fee;