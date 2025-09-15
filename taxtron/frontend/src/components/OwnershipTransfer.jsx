import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Car, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText,
  Shield,
  CreditCard,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import axios from 'axios';

const OwnershipTransfer = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [chassisNumber, setChassisNumber] = useState('');
  const [recipientCnic, setRecipientCnic] = useState('');

  // Format CNIC with dashes as user types
  const formatCnic = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 13 digits
    const limitedDigits = digits.slice(0, 13);
    
    // Add dashes at appropriate positions
    if (limitedDigits.length <= 5) {
      return limitedDigits;
    } else if (limitedDigits.length <= 12) {
      return `${limitedDigits.slice(0, 5)}-${limitedDigits.slice(5)}`;
    } else {
      return `${limitedDigits.slice(0, 5)}-${limitedDigits.slice(5, 12)}-${limitedDigits.slice(12)}`;
    }
  };

  const handleCnicChange = (e) => {
    const formatted = formatCnic(e.target.value);
    setRecipientCnic(formatted);
  };
  const [transferFee, setTransferFee] = useState(5000);

  // Data states
  const [vehicleData, setVehicleData] = useState(null);
  const [recipientData, setRecipientData] = useState(null);
  const [transferData, setTransferData] = useState(null);

  // Wallet states
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    // Check if wallet is connected
    if (window.ethereum) {
      checkWalletConnection();
    }
  }, []);

  const checkWalletConnection = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setIsWalletConnected(true);
      setError('');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const searchVehicle = async () => {
    if (!chassisNumber.trim()) {
      setError('Please enter chassis number');
      return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
      setError('Please log in to search for vehicles');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/ownership-transfer/search-vehicle/${chassisNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setVehicleData(response.data.vehicle);
        setCurrentStep(2);
        setSuccess('Vehicle found successfully!');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error searching vehicle:', error);
      setError(error.response?.data?.message || 'Failed to search vehicle');
    } finally {
      setLoading(false);
    }
  };

  const searchRecipient = async () => {
    if (!recipientCnic.trim()) {
      setError('Please enter recipient CNIC');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`/api/ownership-transfer/search-user/${recipientCnic}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecipientData(response.data.user);
        setCurrentStep(3);
        setSuccess('Recipient found successfully!');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error searching recipient:', error);
      const errorMessage = error.response?.data?.message || 'Failed to search recipient';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initiateTransfer = async () => {
    if (!vehicleData || !recipientData) {
      setError('Missing vehicle or recipient data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.post('/api/ownership-transfer/initiate', {
        vehicleId: vehicleData.inspectionId,
        recipientCnic: recipientData.cnic,
        transferFee: transferFee
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTransferData(response.data.transfer);
        setCurrentStep(4);
        setSuccess('Transfer initiated successfully!');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error initiating transfer:', error);
      setError(error.response?.data?.message || 'Failed to initiate transfer');
    } finally {
      setLoading(false);
    }
  };

  const completeTransfer = async () => {
    if (!transferData) {
      setError('No transfer data available');
      return;
    }

    if (!isWalletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Here you would integrate with blockchain for actual transfer
      // For now, we'll simulate the completion
      const token = localStorage.getItem('userToken');
      const response = await axios.post(`/api/ownership-transfer/complete/${transferData.transferId}`, {
        blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64), // Simulated hash
        transferDeed: 'simulated_transfer_deed_data'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCurrentStep(5);
        setSuccess('Transfer completed successfully!');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error completing transfer:', error);
      setError(error.response?.data?.message || 'Failed to complete transfer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setChassisNumber('');
    setRecipientCnic('');
    setVehicleData(null);
    setRecipientData(null);
    setTransferData(null);
    setError('');
    setSuccess('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
            <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vehicle Ownership Transfer</h1>
                <p className="text-sm text-gray-600">Transfer vehicle ownership to another user</p>
              </div>
            </div>
            
            {/* Wallet Connection */}
            <div className="flex items-center space-x-3">
              {isWalletConnected ? (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              ) : (
            <button
                  onClick={connectWallet}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
                  <Shield className="w-4 h-4" />
                  <span>Connect Wallet</span>
            </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 5 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Search Vehicle</span>
            <span>Find Recipient</span>
            <span>Confirm Details</span>
            <span>Complete Transfer</span>
            <span>Success</span>
          </div>
        </div>


        {/* Step 1: Search Vehicle */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center mb-6">
              <Car className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Your Vehicle</h2>
              <p className="text-gray-600">Enter the chassis number of the vehicle you want to transfer</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    placeholder="Enter chassis number (e.g., ABC123456789)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={searchVehicle}
                  disabled={loading || !chassisNumber.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Searching...' : 'Search Vehicle'}</span>
                </button>

                {/* Error/Success Messages for Vehicle Search */}
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-green-800 text-sm">{success}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Details & Search Recipient */}
        {currentStep === 2 && vehicleData && (
          <div className="space-y-6">
            {/* Vehicle Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Car className="w-5 h-5 text-green-600" />
                <span>Vehicle Details</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Make & Model:</span>
                    <span className="font-medium">{vehicleData.make} {vehicleData.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year:</span>
                    <span className="font-medium">{vehicleData.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{vehicleData.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chassis:</span>
                    <span className="font-medium text-xs">{vehicleData.chassisNumber}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Engine:</span>
                    <span className="font-medium">{vehicleData.engineCapacity} CC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="font-medium">{vehicleData.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration:</span>
                    <span className="font-medium">{vehicleData.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Owner:</span>
                    <span className="font-medium">{vehicleData.currentOwner.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Recipient */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-center mb-6">
                <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Recipient</h2>
                <p className="text-gray-600">Enter the CNIC of the person you want to transfer the vehicle to</p>
                </div>

              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient CNIC
                    </label>
                    <input
                      type="text"
                      value={recipientCnic}
                      onChange={handleCnicChange}
                      placeholder="Enter CNIC (e.g., 12345-1234567-1)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={searchRecipient}
                    disabled={loading || !recipientCnic.trim()}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Searching...' : 'Search Recipient'}</span>
                  </button>

                  {/* Error/Success Messages for Recipient Search */}
                  {error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-800 text-sm">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-green-800 text-sm">{success}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Recipient Details & Transfer Confirmation */}
        {currentStep === 3 && vehicleData && recipientData && (
          <div className="space-y-6">
            {/* Recipient Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Recipient Details</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{recipientData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CNIC:</span>
                    <span className="font-medium">{recipientData.cnic}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-sm">{recipientData.email}</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wallet:</span>
                    <span className="font-medium text-xs">{recipientData.walletAddress.slice(0, 6)}...{recipientData.walletAddress.slice(-4)}</span>
                </div>
                </div>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <span>Transfer Details</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transfer Fee:</span>
                  <span className="text-2xl font-bold text-green-600">PKR {transferFee.toLocaleString()}</span>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Notice:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>This action will permanently transfer ownership of the vehicle</li>
                        <li>Make sure all taxes and fees are paid before transfer</li>
                        <li>You will need to connect your wallet to complete the transfer</li>
                        <li>A transfer deed will be generated and stored on the blockchain</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={initiateTransfer}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Initiating...' : 'Initiate Transfer'}</span>
                  </button>
                  
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                </div>

                {/* Error/Success Messages for Transfer Initiation */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-green-800 text-sm">{success}</span>
                  </div>
                )}
              </div>
            </div>
                  </div>
                )}

        {/* Step 4: Complete Transfer */}
        {currentStep === 4 && transferData && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center mb-6">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Transfer</h2>
              <p className="text-gray-600">Connect your wallet and complete the ownership transfer</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Transfer Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Transfer Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer ID:</span>
                    <span className="font-medium">{transferData.transferId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium">{transferData.vehicle.make} {transferData.vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{transferData.fromOwner.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{transferData.toOwner.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium text-green-600">PKR {transferData.transferFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Wallet Connection Status */}
              {!isWalletConnected ? (
                <div className="text-center">
                  <button
                    onClick={connectWallet}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Connect Wallet to Continue</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      ✓ Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                  
                  <button
                    onClick={completeTransfer}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
                  >
                    {loading ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Completing Transfer...' : 'Complete Transfer'}</span>
                  </button>

                  {/* Error/Success Messages for Transfer Completion */}
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-800 text-sm">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-green-800 text-sm">{success}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {currentStep === 5 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Transfer Completed!</h2>
              <p className="text-gray-600 mb-6">Vehicle ownership has been successfully transferred</p>

              {transferData && (
                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Transfer Details</h3>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transfer ID:</span>
                      <span className="font-medium">{transferData.transferId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-medium">{transferData.vehicle.make} {transferData.vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">New Owner:</span>
                      <span className="font-medium">{transferData.toOwner.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Transfer Another Vehicle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnershipTransfer;