import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import contractABIData from '../contracts/contractABI.json';
import Web3 from 'web3';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Car,
  Wallet,
  Clock
} from 'lucide-react';

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
      // Vehicle types based on bodyType from database
      'Sedan': 5000,
      'Hatchback': 4500,
      'SUV': 7000,
      'MUV': 6500,
      'Coupe': 5500,
      'Convertible': 8000,
      'Wagon': 5500,
      'Pickup': 7500,
      'Van': 6000,
      'Bus': 10000,
      'Truck': 8000,
      'Motorcycle': 2000,
      'Scooter': 1500,
      'Other': 1500,
      // Legacy support for existing registrations
      'Car': 5000,
      'Auto Rickshaw': 1500,
      'Heavy Truck': 12000,
      'Sport Bike': 2500,
      'Standard Bike': 1800,
      'Default': 4000
    };
    
    let regFee = baseFees[vehicleType] || baseFees['Default'];
    
    // Additional fee based on engine capacity
    if ((vehicleType === 'Car' || vehicleType === 'Sedan' || vehicleType === 'Hatchback' || 
         vehicleType === 'Coupe' || vehicleType === 'Convertible' || vehicleType === 'Wagon') && engineCapacity > 2000) {
      regFee += 2000; // High capacity car surcharge
    } else if ((vehicleType === 'Motorcycle' || vehicleType === 'Scooter' || vehicleType === 'Sport Bike' || vehicleType === 'Standard Bike') && engineCapacity > 600) {
      regFee += 1000; // High capacity motorcycle surcharge
    } else if (vehicleType === 'Truck' && engineCapacity > 3000) {
      regFee += 3000; // Large truck surcharge
    } else if ((vehicleType === 'Heavy Truck' || vehicleType === 'Truck') && engineCapacity > 5000) {
      regFee += 5000; // Heavy duty truck surcharge
    } else if (vehicleType === 'Bus' && engineCapacity > 6000) {
      regFee += 4000; // Large bus surcharge
    } else if ((vehicleType === 'Van' || vehicleType === 'MUV') && engineCapacity > 2000) {
      regFee += 1500; // Large van surcharge
    } else if ((vehicleType === 'SUV' || vehicleType === 'Pickup') && engineCapacity > 2500) {
      regFee += 2500; // Large SUV/Pickup surcharge
    } else if ((vehicleType === 'Other' || vehicleType === 'Auto Rickshaw') && engineCapacity > 300) {
      regFee += 500; // Small vehicle surcharge
    }
    
    return {
      regFee: regFee,
      totalFee: regFee // No tax for now, so total equals reg fee
    };
  };

  // Pakistan Annual Vehicle Tax calculation based on Excise system
  const calculateAnnualTax = (vehicleType, engineCapacity = 0, vehicleValue = 0, vehicleAge = 0) => {
    let annualTax = 0;
    
    // Base annual tax rates for Pakistan (in PKR)
    const baseTaxRates = {
      'Sedan': 3000,
      'Hatchback': 2500,
      'SUV': 8000,
      'MUV': 6000,
      'Coupe': 4000,
      'Convertible': 10000,
      'Wagon': 3500,
      'Pickup': 5000,
      'Van': 4000,
      'Bus': 15000,
      'Truck': 12000,
      'Motorcycle': 800,
      'Scooter': 500,
      'Other': 1000,
      // Legacy support
      'Car': 3000,
      'Auto Rickshaw': 600,
      'Heavy Truck': 20000,
      'Sport Bike': 1200,
      'Standard Bike': 800,
      'Default': 2000
    };
    
    annualTax = baseTaxRates[vehicleType] || baseTaxRates['Default'];
    
    // Engine capacity multiplier (Pakistan system)
    if (vehicleType === 'Car' || vehicleType === 'Sedan' || vehicleType === 'Hatchback') {
      if (engineCapacity <= 1000) {
        annualTax *= 1.0; // Base rate
      } else if (engineCapacity <= 1600) {
        annualTax *= 1.5;
      } else if (engineCapacity <= 2000) {
        annualTax *= 2.0;
      } else if (engineCapacity <= 3000) {
        annualTax *= 3.0;
      } else {
        annualTax *= 4.0; // High-end vehicles
      }
    } else if (vehicleType === 'Motorcycle' || vehicleType === 'Scooter') {
      if (engineCapacity <= 125) {
        annualTax *= 1.0;
      } else if (engineCapacity <= 250) {
        annualTax *= 1.5;
      } else {
        annualTax *= 2.0;
      }
    } else if (vehicleType === 'SUV' || vehicleType === 'Pickup') {
      if (engineCapacity <= 2000) {
        annualTax *= 1.5;
      } else if (engineCapacity <= 3000) {
        annualTax *= 2.5;
      } else {
        annualTax *= 3.5;
      }
    }
    
    // Vehicle age discount (older vehicles pay less)
    if (vehicleAge > 10) {
      annualTax *= 0.7; // 30% discount for very old vehicles
    } else if (vehicleAge > 5) {
      annualTax *= 0.8; // 20% discount for old vehicles
    }
    
    // Commercial vehicle surcharge
    if (vehicleType === 'Bus' || vehicleType === 'Truck' || vehicleType === 'Van') {
      annualTax *= 1.2; // 20% commercial surcharge
    }
    
    return Math.round(annualTax);
  };

  // Use your actual deployed Vehicle Registration contract address
  const CONTRACT_ADDRESS = "0x98e503A4364ACdfA19441f07e81F4FFd53Dab75B"; // Your deployed Vehicle Registration contract
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
        Manuyear: vehicleData.vehicleDetails.manufacturingYear,
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#8CC152'}}></div>
          <p className="text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-600">No vehicle data found</p>
          </div>
        </div>
      </div>
    );
  }

  const { vehicleDetails } = vehicleData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Registration Fee</h1>
              <p className="text-sm text-gray-600">Complete your vehicle registration payment</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Vehicle Details Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#8CC152'}}>
                <Car className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Make</p>
                <p className="text-lg font-semibold text-gray-900">{vehicleDetails.make}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Model</p>
                <p className="text-lg font-semibold text-gray-900">{vehicleDetails.model}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Manufacturing Year</p>
                <p className="text-lg font-semibold text-gray-900">{vehicleDetails.manufacturingYear}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-lg font-semibold text-gray-900">{vehicleDetails.vehicleType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Variant</p>
                <p className="text-lg font-semibold text-gray-900">{vehicleDetails.variant}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Registration Number</p>
                <p className="text-lg font-semibold text-gray-900">{vehicleData.registrationNumber || 'Will be generated'}</p>
              </div>
            </div>
          </div>

          {/* Fee Breakdown Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#8CC152'}}>
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Fee Breakdown</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Registration Fee</span>
                <span className="text-xl font-bold" style={{color: '#8CC152'}}>PKR {vehicleDetails.regFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-green-50 rounded-lg px-4 border-2 border-green-200">
                <span className="text-gray-900 font-semibold text-lg">Total Registration Fee</span>
                <span className="text-2xl font-bold" style={{color: '#8CC152'}}>PKR {vehicleDetails.totalFee.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Blockchain Payment Notice</h4>
                <p className="text-amber-700 mb-1"><strong>Note:</strong> Payment will be processed on the Ethereum blockchain</p>
                <p className="text-amber-700">Make sure you have sufficient ETH for gas fees</p>
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          {!walletAddress && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#8CC152'}}>
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">Connect your MetaMask wallet to proceed with the payment</p>
                <button 
                  onClick={connectWallet} 
                  className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{backgroundColor: '#8CC152'}}
                >
                  Connect MetaMask Wallet
                </button>
              </div>
            </div>
          )}

          {walletAddress && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Wallet Connected</h4>
                  <p className="text-green-700">Connected Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          {!isPaid && walletAddress && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Pay</h3>
                <button 
                  onClick={handlePayment} 
                  disabled={paymentLoading}
                  className="text-white px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  style={{backgroundColor: '#8CC152'}}
                >
                  {paymentLoading ? (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 animate-spin" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    `Pay Registration Fee (PKR ${vehicleDetails.totalFee.toLocaleString()})`
                  )}
                </button>
                <p className="text-gray-600 text-sm">
                  Registration fee will be deducted from your MetaMask wallet
                </p>
              </div>
            </div>
          )}

          {/* Payment Success */}
          {isPaid && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-6">Your vehicle has been registered on the blockchain.</p>
                
                {transactionHash && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Transaction Hash</p>
                    <p className="font-mono text-sm text-gray-800 mb-3">
                      {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                    </p>
                    <button 
                      onClick={viewOnEtherscan} 
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm mx-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Block Explorer</span>
                    </button>
                  </div>
                )}
                
                <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-blue-900 mb-3">Next Steps:</h4>
                  <ul className="text-blue-800 space-y-2 text-sm">
                    <li>• Tax payment can be made separately when required</li>
                    <li>• Your vehicle is now officially registered</li>
                    <li>• See your Vehicle NFT certificate</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* NFT Button */}
          {isPaid && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-center">
                <button 
                  onClick={goToNFT} 
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  View Vehicle NFT Certificate
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fee;