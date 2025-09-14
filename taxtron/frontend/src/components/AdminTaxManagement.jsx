import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Web3 from 'web3';
import contractABIData from '../contracts/contractABI.json';
import { 
  ArrowLeft, 
  Car, 
  DollarSign, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Edit3,
  Calculator,
  Settings,
  Users,
  TrendingUp
} from 'lucide-react';

const AdminTaxManagement = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingStates, setSavingStates] = useState({});
  const [editingVehicles, setEditingVehicles] = useState({});
  const [walletAddress, setWalletAddress] = useState('');
  const [web3, setWeb3] = useState(null);

  // Contract configuration
  const CONTRACT_ADDRESS = "0x98e503A4364ACdfA19441f07e81F4FFd53Dab75B";
  const CONTRACT_ABI = contractABIData.abi || contractABIData;

  useEffect(() => {
    initializeWeb3();
    fetchAllVehicles();
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
  const calculateAnnualTax = (vehicleType, engineCapacity = 0, vehicleAge = 0) => {
    let annualTax = 0;
    
    const baseTaxRates = {
      'Sedan': 3000, 'Hatchback': 2500, 'SUV': 8000, 'MUV': 6000,
      'Coupe': 4000, 'Van': 4000, 'Bus': 15000, 'Truck': 12000,
      'Motorcycle': 800, 'Scooter': 500, 'Other': 1000,
      'Car': 3000, 'Default': 2000
    };
    
    annualTax = baseTaxRates[vehicleType] || baseTaxRates['Default'];
    
    // Engine capacity multiplier
    if (vehicleType === 'Car' || vehicleType === 'Sedan' || vehicleType === 'Hatchback') {
      if (engineCapacity <= 1000) annualTax *= 1.0;
      else if (engineCapacity <= 1600) annualTax *= 1.5;
      else if (engineCapacity <= 2000) annualTax *= 2.0;
      else if (engineCapacity <= 3000) annualTax *= 3.0;
      else annualTax *= 4.0;
    } else if (vehicleType === 'Motorcycle' || vehicleType === 'Scooter') {
      if (engineCapacity <= 125) annualTax *= 1.0;
      else if (engineCapacity <= 250) annualTax *= 1.5;
      else annualTax *= 2.0;
    }
    
    // Age discount
    if (vehicleAge > 10) annualTax *= 0.7;
    else if (vehicleAge > 5) annualTax *= 0.8;
    
    // Commercial surcharge
    if (vehicleType === 'Bus' || vehicleType === 'Truck' || vehicleType === 'Van') {
      annualTax *= 1.2;
    }
    
    return Math.round(annualTax);
  };

  const fetchAllVehicles = async () => {
    try {
      setLoading(true);
      // Check for admin token first, fallback to user token
      const adminToken = localStorage.getItem('adminToken');
      const userToken = localStorage.getItem('userToken');
      
      if (!adminToken && !userToken) {
        setError('No authentication token found. Please login as admin.');
        setLoading(false);
        return;
      }
      
      const token = adminToken || userToken;
      
      // Fetch all approved vehicles across all users
      const response = await axios.get('http://localhost:5000/api/inspections?status=Approved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const vehiclesWithTax = response.data.data
          .filter(inspection => inspection.isPaid) // Only vehicles with paid registration fees
          .map(inspection => {
            const vehicle = inspection.vehicleDetails;
            const currentYear = new Date().getFullYear();
            const vehicleAge = currentYear - (vehicle.manufacturingYear || currentYear);
            const calculatedTax = calculateAnnualTax(vehicle.vehicleType, vehicle.engineCapacity, vehicleAge);
            
            return {
              ...inspection,
              calculatedTax: calculatedTax,
              currentTaxAmount: inspection.taxAmount || 0,
              vehicleAge: vehicleAge,
              ownerName: inspection.userId?.fullName || 'Unknown',
              ownerEmail: inspection.userId?.email || 'Unknown'
            };
          });
        
        setVehicles(vehiclesWithTax);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTax = (inspectionId, currentAmount) => {
    setEditingVehicles(prev => ({
      ...prev,
      [inspectionId]: currentAmount
    }));
  };

  const handleCancelEdit = (inspectionId) => {
    setEditingVehicles(prev => {
      const newState = { ...prev };
      delete newState[inspectionId];
      return newState;
    });
  };

  const setTaxAmountInContract = async (inspectionId, taxAmount) => {
    if (!walletAddress || !web3) {
      setError('Please connect your admin wallet first');
      return false;
    }

    try {
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      console.log('=== TAX AMOUNT SETTING DEBUG ===');
      console.log('Contract address:', CONTRACT_ADDRESS);
      console.log('Inspection ID:', inspectionId);
      console.log('Tax amount:', taxAmount);
      console.log('Wallet address:', walletAddress);
      
      // First, check who is the contract owner
      try {
        const contractOwner = await contract.methods.owner().call();
        console.log('Contract owner:', contractOwner);
        console.log('Current wallet:', walletAddress);
        console.log('Is owner?', contractOwner.toLowerCase() === walletAddress.toLowerCase());
        
        if (contractOwner.toLowerCase() !== walletAddress.toLowerCase()) {
          setError(`You are not the contract owner. 
          
Contract owner: ${contractOwner}
Your wallet: ${walletAddress}

Please connect with the contract owner wallet to set tax amounts.`);
          return false;
        }
      } catch (ownerError) {
        console.error('Failed to check contract owner:', ownerError);
        setError('Failed to verify contract ownership. Please check the contract address.');
        return false;
      }
      
      // Check if vehicle exists in contract
      try {
        const vehicleData = await contract.methods.getVehicle(inspectionId).call();
        console.log('Vehicle found in contract:', vehicleData);
      } catch (vehicleError) {
        console.error('Vehicle not found in contract:', vehicleError);
        setError(`Vehicle ${inspectionId} not found in contract. The registration fee may not have been paid through the blockchain yet.`);
        return false;
      }
      
      // Now try to set the tax amount
      console.log('Attempting to set tax amount...');
      const tx = await contract.methods.setTaxAmount(inspectionId, taxAmount).send({
        from: walletAddress,
        gas: 200000
      });
      
      console.log('Tax amount set in contract successfully:', tx.transactionHash);
      return true;
      
    } catch (contractError) {
      console.error('Failed to set tax amount in contract:', contractError);
      
      // More detailed error handling
      if (contractError.code === 4001) {
        setError('Transaction rejected by user in MetaMask.');
      } else if (contractError.message && contractError.message.includes('Only contract owner')) {
        setError('Access denied: Only the contract owner can set tax amounts.');
      } else if (contractError.message && contractError.message.includes('Vehicle not found')) {
        setError('Vehicle not found in contract. Ensure the registration fee has been paid.');
      } else if (contractError.message && contractError.message.includes('revert')) {
        setError(`Contract execution failed: ${contractError.message}`);
      } else {
        setError(`Contract error: ${contractError.message || 'Unknown blockchain error'}`);
      }
      return false;
    }
  };

  const handleSaveTax = async (inspectionId) => {
    const newTaxAmount = parseInt(editingVehicles[inspectionId]);
    
    if (!newTaxAmount || newTaxAmount <= 0) {
      setError('Please enter a valid tax amount');
      return;
    }

    try {
      setSavingStates(prev => ({ ...prev, [inspectionId]: true }));
      setError('');
      setSuccess('');
      
      // Step 1: Set tax amount in blockchain contract
      const contractSuccess = await setTaxAmountInContract(inspectionId, newTaxAmount);
      if (!contractSuccess) {
        return; // Error already set in setTaxAmountInContract
      }
      
      // Step 2: Update database using admin endpoint (no authentication required)
      await axios.post(`http://localhost:5000/api/vehicles/admin/${inspectionId}/set-tax-amount`, {
        taxAmount: newTaxAmount
      }, {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setVehicles(prev => prev.map(v => 
        v.inspectionId === inspectionId 
          ? { ...v, currentTaxAmount: newTaxAmount, taxAmount: newTaxAmount }
          : v
      ));
      
      // Clear editing state
      handleCancelEdit(inspectionId);
      
      setSuccess(`Tax amount updated successfully for vehicle ${inspectionId}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error saving tax amount:', error);
      setError(`Failed to save tax amount: ${error.response?.data?.message || error.message}`);
    } finally {
      setSavingStates(prev => ({ ...prev, [inspectionId]: false }));
    }
  };

  const handleUseCalculated = (inspectionId, calculatedAmount) => {
    setEditingVehicles(prev => ({
      ...prev,
      [inspectionId]: calculatedAmount
    }));
  };

  const bulkSetCalculatedTax = async () => {
    if (!walletAddress) {
      setError('Please connect your admin wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let successCount = 0;
      let failCount = 0;
      
        for (const vehicle of vehicles) {
          if (vehicle.currentTaxAmount !== vehicle.calculatedTax) {
            try {
              const contractSuccess = await setTaxAmountInContract(vehicle.inspectionId, vehicle.calculatedTax);
              if (contractSuccess) {
                // Update database using admin endpoint
                await axios.post(`http://localhost:5000/api/vehicles/admin/${vehicle.inspectionId}/set-tax-amount`, {
                  taxAmount: vehicle.calculatedTax
                }, {
                  headers: { 
                    'Content-Type': 'application/json'
                  }
                });
                successCount++;
              } else {
                failCount++;
              }
            } catch (error) {
              console.error(`Failed to set tax for ${vehicle.inspectionId}:`, error);
              failCount++;
            }
          }
        }
      
      setSuccess(`Bulk update completed: ${successCount} successful, ${failCount} failed`);
      await fetchAllVehicles(); // Refresh data
      
    } catch (error) {
      setError(`Bulk update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#8CC152'}}></div>
          <p className="text-gray-600">Loading vehicles for tax management...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Tax Management</h1>
              <p className="text-sm text-gray-600">Set and manage annual tax amounts for registered vehicles</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAllVehicles}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            {vehicles.length > 0 && (
              <button
                onClick={bulkSetCalculatedTax}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center space-x-2"
                style={{backgroundColor: '#8CC152'}}
              >
                <Calculator className="w-4 h-4" />
                <span>Set All Calculated</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Admin Wallet Connection */}
          {!walletAddress && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Wallet Required</h3>
                <p className="text-gray-600 mb-6">Connect your admin wallet to set tax amounts in the blockchain contract</p>
                <button 
                  onClick={connectWallet} 
                  className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Connect Admin Wallet
                </button>
              </div>
            </div>
          )}

          {walletAddress && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Admin Wallet Connected</p>
                  <p className="text-blue-700 text-sm">Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">Success</h4>
                  <p className="text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{vehicles.length}</p>
                </div>
                <Car className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tax Set</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {vehicles.filter(v => v.currentTaxAmount > 0).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tax Pending</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {vehicles.filter(v => v.currentTaxAmount === 0).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tax Paid</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {vehicles.filter(v => v.taxPaid).length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Vehicles List */}
          {vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-center">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles Found</h3>
                <p className="text-gray-600">No vehicles with paid registration fees found for tax management.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Tax Management</h3>
                <p className="text-sm text-gray-600">Set annual tax amounts for registered vehicles</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engine CC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculated Tax</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Tax</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehicles.map((vehicle) => {
                      const isEditing = editingVehicles.hasOwnProperty(vehicle.inspectionId);
                      const isSaving = savingStates[vehicle.inspectionId];
                      
                      return (
                        <tr key={vehicle.inspectionId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{backgroundColor: '#8CC152'}}>
                                <Car className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {vehicle.vehicleDetails.make} {vehicle.vehicleDetails.model}
                                </div>
                                <div className="text-sm text-gray-500">{vehicle.registrationNumber}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vehicle.ownerName}</div>
                            <div className="text-sm text-gray-500">{vehicle.ownerEmail}</div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vehicle.vehicleDetails.engineCapacity} CC
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vehicle.vehicleAge} years
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              PKR {vehicle.calculatedTax.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Auto-calculated</div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingVehicles[vehicle.inspectionId]}
                                onChange={(e) => setEditingVehicles(prev => ({
                                  ...prev,
                                  [vehicle.inspectionId]: e.target.value
                                }))}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Amount"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                PKR {vehicle.currentTaxAmount.toLocaleString()}
                              </div>
                            )}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            {vehicle.taxPaid ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid
                              </span>
                            ) : vehicle.currentTaxAmount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Set
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Pending
                              </span>
                            )}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleSaveTax(vehicle.inspectionId)}
                                  disabled={isSaving}
                                  className="text-white px-3 py-1 rounded text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-1"
                                  style={{backgroundColor: '#8CC152'}}
                                >
                                  {isSaving ? <Clock className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={() => handleCancelEdit(vehicle.inspectionId)}
                                  className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditTax(vehicle.inspectionId, vehicle.currentTaxAmount)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                {vehicle.currentTaxAmount !== vehicle.calculatedTax && (
                                  <button
                                    onClick={() => handleUseCalculated(vehicle.inspectionId, vehicle.calculatedTax)}
                                    className="text-green-600 hover:text-green-700 flex items-center space-x-1 text-xs"
                                  >
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Use Calc</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Information Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Tax Management Information</h4>
                <div className="text-blue-800 space-y-1 text-sm">
                  <p>• <strong>Admin Required:</strong> Only contract owner can set tax amounts</p>
                  <p>• <strong>Blockchain Update:</strong> Tax amounts are stored in the smart contract</p>
                  <p>• <strong>User Payment:</strong> After setting amounts, users can pay their annual tax</p>
                  <p>• <strong>Pakistan System:</strong> Based on engine capacity, vehicle type, and age</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTaxManagement;
