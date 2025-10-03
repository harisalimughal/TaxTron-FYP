import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Web3 from 'web3';
import contractABIData from '../contracts/contractABI.json';
import { 
  ArrowLeft, 
  Car, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Wallet,
  Calendar,
  DollarSign,
  ExternalLink
} from 'lucide-react';

const TaxPayment = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState({});
  const [walletAddress, setWalletAddress] = useState('');
  const [web3, setWeb3] = useState(null);
  const [user, setUser] = useState(null);

  // Use your actual deployed Vehicle Registration contract address
  const CONTRACT_ADDRESS = "0x98e503A4364ACdfA19441f07e81F4FFd53Dab75B"; // Your deployed Vehicle Registration contract
  const CONTRACT_ABI = contractABIData.abi || contractABIData;

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    initializeWeb3();
    fetchVehiclesForTax();
    checkWalletConnection();
  }, []);

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

  // Pakistan Annual Vehicle Tax calculation
  const calculateAnnualTax = (vehicleType, engineCapacity = 0, vehicleValue = 0, vehicleAge = 0) => {
    let annualTax = 0;
    
    // Base annual tax rates for Pakistan (in PKR)
    const baseTaxRates = {
      'Sedan': 3000,
      'Hatchback': 2500,
      'SUV': 8000,
      'MUV': 6000,
      'Coupe': 4000,
      'Van': 4000,
      'Bus': 15000,
      'Truck': 12000,
      'Motorcycle': 800,
      'Scooter': 500,
      'Other': 1000,
      'Car': 3000,
      'Default': 2000
    };
    
    annualTax = baseTaxRates[vehicleType] || baseTaxRates['Default'];
    
    // Engine capacity multiplier (Pakistan system)
    if (vehicleType === 'Car' || vehicleType === 'Sedan' || vehicleType === 'Hatchback') {
      if (engineCapacity <= 1000) {
        annualTax *= 1.0;
      } else if (engineCapacity <= 1600) {
        annualTax *= 1.5;
      } else if (engineCapacity <= 2000) {
        annualTax *= 2.0;
      } else if (engineCapacity <= 3000) {
        annualTax *= 3.0;
      } else {
        annualTax *= 4.0;
      }
    } else if (vehicleType === 'Motorcycle' || vehicleType === 'Scooter') {
      if (engineCapacity <= 125) {
        annualTax *= 1.0;
      } else if (engineCapacity <= 250) {
        annualTax *= 1.5;
      } else {
        annualTax *= 2.0;
      }
    }
    
    // Vehicle age discount
    if (vehicleAge > 10) {
      annualTax *= 0.7;
    } else if (vehicleAge > 5) {
      annualTax *= 0.8;
    }
    
    // Commercial vehicle surcharge
    if (vehicleType === 'Bus' || vehicleType === 'Truck' || vehicleType === 'Van') {
      annualTax *= 1.2;
    }
    
    return Math.round(annualTax);
  };

  const fetchVehiclesForTax = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      // Use the same endpoint as Dashboard for consistency
      const response = await axios.get('http://localhost:5000/api/vehicles/tax-payment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Process vehicles and calculate annual tax
        const vehiclesWithTax = response.data.data.map(vehicle => {
          const currentYear = new Date().getFullYear();
          const vehicleAge = currentYear - (vehicle.year || currentYear);
          const annualTax = calculateAnnualTax(
            vehicle.vehicleType,
            vehicle.engineCapacity,
            0, // Vehicle value - can be added later
            vehicleAge
          );
          
          return {
            ...vehicle,
            vehicleDetails: {
              make: vehicle.make,
              model: vehicle.model,
              manufacturingYear: vehicle.year,
              vehicleType: vehicle.vehicleType,
              engineCapacity: vehicle.engineCapacity
            },
            annualTax: annualTax,
            vehicleAge: vehicleAge,
            taxDueDate: new Date(new Date().getFullYear() + 1, 0, 31), // January 31st next year
            isPaidThisYear: vehicle.taxPaid || false
          };
        });
        
        setVehicles(vehiclesWithTax);
      }
    } catch (error) {
      console.error('Error fetching vehicles for tax:', error);
      setError('Failed to load vehicles for tax payment');
    } finally {
      setLoading(false);
    }
  };

  const handleTaxPayment = async (vehicle) => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }

    if (!web3) {
      setError('Web3 not initialized');
      return;
    }

    try {
      setPaymentLoading(prev => ({ ...prev, [vehicle.inspectionId]: true }));
      setError('');
      
      // Create contract instance (using existing VehicleRegistry contract)
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      // First, check if vehicle is registered in the blockchain
      try {
        const vehicleExists = await contract.methods.getVehicle(vehicle.inspectionId).call();
        console.log('Vehicle found in blockchain:', vehicleExists);
      } catch (checkError) {
        console.error('Vehicle not found in blockchain:', checkError);
        setError(`Vehicle not registered in blockchain yet. Please ensure the registration fee has been paid and confirmed on the blockchain before paying tax.`);
        return;
      }
      
      // Check if tax is already paid
      try {
        const taxAlreadyPaid = await contract.methods.isTaxPaid(vehicle.inspectionId).call();
        if (taxAlreadyPaid) {
          setError('Tax has already been paid for this vehicle.');
          return;
        }
      } catch (taxCheckError) {
        console.log('Tax status check failed, proceeding with payment...');
      }
      
      // Check if tax amount is set in contract (required for payment)
      try {
        const contractTaxAmount = await contract.methods.getTaxAmount(vehicle.inspectionId).call();
        if (contractTaxAmount == 0) {
          setError(`Tax amount not set by admin yet. Please contact the administrator to set the tax amount for this vehicle.
          
Calculated tax amount: PKR ${vehicle.annualTax.toLocaleString()}

Admin can set this amount at: /admin/tax-management`);
          return;
        }
        console.log('Tax amount set in contract:', contractTaxAmount);
      } catch (taxAmountError) {
        console.error('Failed to get tax amount from contract:', taxAmountError);
        setError('Failed to verify tax amount in contract. Please try again.');
        return;
      }
      
      // Get the contract tax amount (this is what we need to pay)
      const contractTaxAmount = await contract.methods.getTaxAmount(vehicle.inspectionId).call();
      const taxInWei = web3.utils.toWei(contractTaxAmount.toString(), 'wei');
      
      console.log('Contract tax amount:', contractTaxAmount);
      console.log('Tax amount in Wei:', taxInWei);
      
      // Generate transaction hash placeholder
      const txHashPlaceholder = `TAX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Estimate gas for tax payment
      const gasEstimate = await contract.methods.payTax(
        vehicle.inspectionId,
        txHashPlaceholder
      ).estimateGas({
        from: walletAddress,
        value: taxInWei
      });

      // Execute tax payment transaction
      const tx = await contract.methods.payTax(
        vehicle.inspectionId,
        txHashPlaceholder
      ).send({
        from: walletAddress,
        value: taxInWei,
        gas: Math.floor(Number(gasEstimate) * 1.2)
      });

      console.log('Tax payment transaction confirmed:', tx);

      // Update backend with tax payment status
      await updateTaxPaymentStatus(vehicle.inspectionId, tx.transactionHash, vehicle.annualTax);

      // Update local state
      setVehicles(prev => prev.map(v => 
        v.inspectionId === vehicle.inspectionId 
          ? { ...v, isPaidThisYear: true, taxTransactionHash: tx.transactionHash }
          : v
      ));
      
      alert('Annual tax payment successful!');
      
    } catch (error) {
      console.error('Tax payment failed:', error);
      let errorMessage = 'Tax payment failed: ';
      
      if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user';
      } else if (error.message && error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds in wallet';
      } else {
        errorMessage += (error.message || 'Unknown error occurred');
      }
      
      setError(errorMessage);
    } finally {
      setPaymentLoading(prev => ({ ...prev, [vehicle.inspectionId]: false }));
    }
  };

  const updateTaxPaymentStatus = async (inspectionId, txHash, taxAmount) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`http://localhost:5000/api/vehicles/${inspectionId}/pay-tax`, {
        transactionHash: txHash,
        taxAmount: taxAmount
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to update tax payment status:', error);
    }
  };

  const viewOnEtherscan = (txHash) => {
    const explorerUrl = `https://etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#8CC152'}}></div>
          <p className="text-gray-600">Loading vehicles for tax payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header - Attached to upper wall */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Annual Vehicle Tax Payment</h1>
                <p className="text-sm text-gray-600">Pay your annual vehicle tax as per Pakistan Excise system</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 lg:p-8 pt-0">
        <div className="max-w-6xl mx-auto">
          {/* Tax Information Card */}

          {/* Wallet Connection */}
          {!walletAddress && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#8CC152'}}>
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">Connect your MetaMask wallet to pay vehicle tax</p>
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
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Wallet Connected</p>
                  <p className="text-green-700 text-sm">Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          {vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-center">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles Found</h3>
                <p className="text-gray-600">You don't have any approved vehicles that require tax payment.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {vehicles.map((vehicle) => {
                const currentYear = new Date().getFullYear();
                const isPaymentLoading = paymentLoading[vehicle.inspectionId];
                
                return (
                  <div key={vehicle.inspectionId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    {/* Vehicle Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#8CC152'}}>
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vehicle.vehicleDetails.make} {vehicle.vehicleDetails.model}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Registration: {vehicle.registrationNumber || 'Pending'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Tax Status Badge */}
                      <div className="flex items-center space-x-3">
                        {vehicle.isPaidThisYear ? (
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Tax Paid {currentYear}</span>
                          </div>
                        ) : (
                          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>Tax Due {currentYear}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-600">Vehicle Type</p>
                        <p className="text-lg font-semibold text-gray-900">{vehicle.vehicleDetails.vehicleType}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-600">Engine Capacity</p>
                        <p className="text-lg font-semibold text-gray-900">{vehicle.vehicleDetails.engineCapacity} CC</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-600">Vehicle Age</p>
                        <p className="text-lg font-semibold text-gray-900">{vehicle.vehicleAge} years</p>
                      </div>
                    </div>

                    {/* Tax Calculation */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">Annual Tax Calculation ({currentYear})</h4>
                          <div className="text-blue-800 text-sm space-y-1">
                            <p>Base Tax: PKR {Math.round(vehicle.annualTax / (vehicle.vehicleAge > 10 ? 0.7 : vehicle.vehicleAge > 5 ? 0.8 : 1)).toLocaleString()}</p>
                            {vehicle.vehicleAge > 5 && (
                              <p>Age Discount: -{vehicle.vehicleAge > 10 ? '30%' : '20%'}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700 font-medium">Total Annual Tax</p>
                          <p className="text-2xl font-bold text-blue-900">PKR {vehicle.annualTax.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Section */}
                    {!vehicle.isPaidThisYear ? (
                      <div className="space-y-4">
                        {/* Prerequisites Check */}
                        {!vehicle.registrationFeePaid && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-amber-800">Registration Fee Required</h4>
                                <p className="text-amber-700 text-sm">You must pay the registration fee first before paying annual tax.</p>
                                <button
                                  onClick={() => navigate(`/pay-fee/${vehicle.inspectionId}`)}
                                  className="mt-2 text-amber-800 hover:text-amber-900 font-medium text-sm underline"
                                >
                                  Pay Registration Fee First →
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="font-medium text-gray-900">Tax Due Date: January 31, {currentYear + 1}</p>
                              <p className="text-sm text-gray-600">Pay before due date to avoid penalties</p>
                            </div>
                          </div>
                          
                          {walletAddress && vehicle.registrationFeePaid && (
                            <button
                              onClick={() => handleTaxPayment(vehicle)}
                              disabled={isPaymentLoading}
                              className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              style={{backgroundColor: '#8CC152'}}
                            >
                              {isPaymentLoading ? (
                                <>
                                  <Clock className="w-5 h-5 animate-spin" />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-5 h-5" />
                                  <span>Pay Tax (PKR {vehicle.annualTax.toLocaleString()})</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div>
                              <p className="font-semibold text-green-800">Tax Paid for {currentYear}</p>
                              <p className="text-sm text-green-700">Amount: PKR {vehicle.annualTax.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {vehicle.taxTransactionHash && (
                            <button
                              onClick={() => viewOnEtherscan(vehicle.taxTransactionHash)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Transaction</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mt-6">
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

export default TaxPayment;