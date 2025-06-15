import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import contractABIData from '../contracts/contractABI.json';
import Web3 from 'web3';
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
  const [web3, setWeb3] = useState(null);

  // Get the ABI in the correct format
  const CONTRACT_ABI = contractABIData.abi || contractABIData;

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

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x4E918C44F498184F3F0Cc6E3ECB88123dceD8500"; // Replace with actual deployed address
  const TREASURY_ADDRESS = "0x4E7f5a1D602ea6a326BA6272defB76CBB1Ff938d"; // Replace with actual treasury address

  useEffect(() => {
    initializeWeb3();
    fetchVehicleData();
    checkWalletConnection();
  }, [inspectionId]);

  const initializeWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    }
  };

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          // Check blockchain payment status if wallet is connected
          checkBlockchainPaymentStatus(accounts[0]);
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
        // Check blockchain payment status after connecting
        checkBlockchainPaymentStatus(accounts[0]);
      } catch (error) {
        setError('Failed to connect wallet');
      }
    } else {
      setError('MetaMask not installed');
    }
  };

  const checkBlockchainPaymentStatus = async (address) => {
    if (!address || !inspectionId || !web3) return;
    
    try {
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      // Check if vehicle is registered on blockchain
      try {
        const paymentStatus = await contract.methods.getPaymentStatus(inspectionId).call();
        setIsPaid(paymentStatus.registrationPaid);
        
        if (paymentStatus.registrationPaid) {
          // Get vehicle details from blockchain
          const vehicleData = await contract.methods.getVehicle(inspectionId).call();
          setTransactionHash(vehicleData.registrationTxHash);
        }
      } catch (contractError) {
        // Vehicle not found on blockchain, check backend
        console.log('Vehicle not found on blockchain, checking backend...');
      }
    } catch (error) {
      console.error('Error checking blockchain payment status:', error);
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
        if (!isPaid) { // Only set from backend if not already set from blockchain
          setIsPaid(data.isPaid || false);
          setTransactionHash(data.transactionHash || '');
        }
      }
    } catch (error) {
      console.log('Payment status check failed:', error);
    }
  };

  const generateRegistrationNumber = () => {
    // Generate a unique registration number (implement your logic)
    const prefix = vehicleData.vehicleDetails.vehicleType.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const handlePayment = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }

    if (!web3) {
      setError('Web3 not initialized');
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');
      
      // Convert fee from PKR to Wei (you'll need to implement proper conversion rate)
      // For demonstration, assuming 1 PKR = 0.000001 ETH (adjust according to actual exchange rate)
      const feeInEth = vehicleData.vehicleDetails.totalFee * 0.000001;
      const feeInWei = web3.utils.toWei(feeInEth.toString(), 'ether');
      
      // Create contract instance
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      // Generate registration number
      const registrationNumber = generateRegistrationNumber();
      
      // Debug: Log all vehicle data to identify undefined values
      console.log('Vehicle Data Debug:', {
        inspectionId: vehicleData.inspectionId,
        make: vehicleData.vehicleDetails.make,
        model: vehicleData.vehicleDetails.model,
        year: vehicleData.vehicleDetails.year,
        engineNumber: vehicleData.vehicleDetails.engineNumber,
        chassisNumber: vehicleData.vehicleDetails.chassisNumber,
        vehicleType: vehicleData.vehicleDetails.vehicleType,
        engineCapacity: vehicleData.vehicleDetails.engineCapacity,
        totalFee: vehicleData.vehicleDetails.totalFee
      });
      
      // Safely convert values to strings with fallbacks
      const inspectionId = vehicleData.inspectionId || '';
      const make = vehicleData.vehicleDetails.make || '';
      const model = vehicleData.vehicleDetails.model || '';
      const year = (vehicleData.vehicleDetails.year || 0).toString();
      const engineNumber = vehicleData.vehicleDetails.engineNumber || '';
      const chassisNumber = vehicleData.vehicleDetails.chassisNumber || '';
      const vehicleType = vehicleData.vehicleDetails.vehicleType || '';
      const engineCapacity = (vehicleData.vehicleDetails.engineCapacity || 0).toString();
      const totalFee = (vehicleData.vehicleDetails.totalFee || 0).toString();
      
      // Convert fee to wei (use string representation for large numbers)
      const feeInWeiString = web3.utils.toWei('0', 'wei'); // For contract parameter, use 0 since we're sending ETH separately
      
      // Estimate gas for the transaction
      const gasEstimate = await contract.methods.registerVehicle(
        inspectionId,
        make,
        model,
        year,
        engineNumber,
        chassisNumber,
        vehicleType,
        engineCapacity,
        registrationNumber,
        feeInWeiString,
        "" // Transaction hash will be updated after confirmation
      ).estimateGas({
        from: walletAddress,
        value: feeInWei
      });

      // Call smart contract to register vehicle with payment
      const tx = await contract.methods.registerVehicle(
        inspectionId,
        make,
        model,
        year,
        engineNumber,
        chassisNumber,
        vehicleType,
        engineCapacity,
        registrationNumber,
        feeInWeiString,
        "" // Transaction hash will be updated after confirmation
      ).send({
        from: walletAddress,
        value: feeInWei,
        gas: Math.floor(Number(gasEstimate) * 1.2) // Add 20% buffer to gas estimate
      });

      console.log('Transaction confirmed:', tx);

      // Update backend with payment status
      await updatePaymentStatus(tx.transactionHash, registrationNumber);

      setIsPaid(true);
      setTransactionHash(tx.transactionHash);
      
      // Update vehicle data with registration number
      setVehicleData(prev => ({
        ...prev,
        registrationNumber: registrationNumber
      }));
      
      alert('Payment successful! Vehicle registered on blockchain.');
      
    } catch (error) {
      console.error('Payment failed:', error);
      let errorMessage = 'Payment failed: ';
      
      if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user';
      } else if (error.code === -32603) {
        errorMessage += 'Internal JSON-RPC error';
      } else if (error.message && error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds in wallet';
      } else if (error.message && error.message.includes('gas')) {
        errorMessage += 'Gas estimation failed. Please try again.';
      } else if (error.message && error.message.includes('revert')) {
        errorMessage += 'Transaction reverted. Check contract conditions.';
      } else {
        errorMessage += (error.message || 'Unknown error occurred');
      }
      
      setError(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const updatePaymentStatus = async (txHash, registrationNumber) => {
    try {
      await fetch(`http://localhost:5000/api/inspections/${inspectionId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPaid: true,
          transactionHash: txHash,
          walletAddress: walletAddress,
          registrationNumber: registrationNumber,
          blockchainConfirmed: true
        })
      });
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const goToNFT = () => {
    navigate(`/view-nft/${inspectionId}`);
  };

  const viewOnEtherscan = () => {
    // Replace with appropriate block explorer URL for your network
    const explorerUrl = `https://etherscan.io/tx/${transactionHash}`;
    window.open(explorerUrl, '_blank');
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
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
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
              <span className="value">{vehicleData.registrationNumber || 'Will be generated'}</span>
            </div>
          </div>
        </div>

        {/* Fee Breakdown Section */}
        <div className="fee-breakdown">
          <div className="fee-item">
            <span className="fee-label">Registration Fee:</span>
            <span className="fee-value">PKR {vehicleDetails.regFee.toLocaleString()}</span>
          </div>
          <div className="fee-item">
            <span className="fee-label">Tax (Payable Later):</span>
            <span className="fee-value">Not Set</span>
          </div>
          <div className="fee-item total-fee">
            <span className="fee-label">Total Registration Fee:</span>
            <span className="fee-value">PKR {vehicleDetails.totalFee.toLocaleString()}</span>
          </div>
        </div>

        {/* Network Info */}
        <div className="network-info">
          <p><strong>Note:</strong> Payment will be processed on the Ethereum blockchain</p>
          <p>Make sure you have sufficient ETH for gas fees</p>
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
              {paymentLoading ? 'Processing Payment...' : `Pay Registration Fee (PKR ${vehicleDetails.totalFee.toLocaleString()})`}
            </button>
            <p className="payment-note">
              Registration fee will be deducted from your MetaMask wallet
            </p>
          </div>
        )}

        {/* Payment Success */}
        {isPaid && (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>Your vehicle has been registered on the blockchain.</p>
            {transactionHash && (
              <div className="transaction-info">
                <p className="tx-hash">
                  Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
                <button onClick={viewOnEtherscan} className="view-tx-btn">
                  View on Block Explorer
                </button>
              </div>
            )}
            <div className="next-steps">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Tax payment can be made separately when required</li>
                <li>Your vehicle is now officially registered</li>
                <li>See your Vehicle NFT certificate</li>
              </ul>
            </div>
          </div>
        )}

        {/* NFT Button */}
        {isPaid && (
          <div className="nft-section">
            <button onClick={goToNFT} className="nft-btn">
              Vehicle NFT Certificate
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