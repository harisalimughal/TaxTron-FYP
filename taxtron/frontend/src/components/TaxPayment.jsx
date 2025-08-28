// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { ethers } from 'ethers';
// import './TaxPayment.css';

// const TaxPayment = () => {
//   const { inspectionId } = useParams();
  
//   const [vehicleData, setVehicleData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [paymentLoading, setPaymentLoading] = useState(false);
//   const [taxPaid, setTaxPaid] = useState(false);
//   const [error, setError] = useState('');
//   const [walletAddress, setWalletAddress] = useState('');
//   const [taxAmount, setTaxAmount] = useState(0);
//   const [transactionHash, setTransactionHash] = useState('');

//   // Contract ABI (same as registration component)
//   const CONTRACT_ABI = [
//     "function getVehicle(string memory _inspectionId) external view returns (tuple(string inspectionId, string make, string model, uint256 year, string engineNumber, string chassisNumber, string vehicleType, uint256 engineCapacity, string registrationNumber, address vehicleOwner, uint256 registrationFee, bool registrationFeePaid, uint256 registrationTimestamp, uint256 taxAmount, bool taxPaid, uint256 taxPaidTimestamp, string registrationTxHash, string taxTxHash, bool isActive))",
//     "function payTax(string memory _inspectionId, string memory _taxTxHash) external payable",
//     "function getTaxAmount(string memory _inspectionId) external view returns (uint256)",
//     "function getPaymentStatus(string memory _inspectionId) external view returns (bool registrationPaid, bool taxPaid, uint256 taxAmount)",
//     "event TaxPaid(string indexed inspectionId, address indexed owner, uint256 taxAmount, uint256 timestamp)"
//   ];

//   const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual deployed address

//   useEffect(() => {
//     checkWalletConnection();
//     fetchVehicleData();
//   }, [inspectionId]);

//   const checkWalletConnection = async () => {
//     if (window.ethereum) {
//       try {
//         const accounts = await window.ethereum.request({ method: 'eth_accounts' });
//         if (accounts.length > 0) {
//           setWalletAddress(accounts[0]);
//           checkTaxStatus(accounts[0]);
//         }
//       } catch (error) {
//         console.error('Error checking wallet connection:', error);
//       }
//     }
//   };

//   const connectWallet = async () => {
//     if (window.ethereum) {
//       try {
//         const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//         setWalletAddress(accounts[0]);
//         checkTaxStatus(accounts[0]);
//       } catch (error) {
//         setError('Failed to connect wallet');
//       }
//     } else {
//       setError('MetaMask not installed');
//     }
//   };

//   const fetchVehicleData = async () => {
//     try {
//       setLoading(true);
      
//       const response = await fetch(`http://localhost:5000/api/inspections/${inspectionId}`);
//       const data = await response.json();
      
//       if (data.success) {
//         setVehicleData(data.data);
//       } else {
//         setError(`Vehicle data not found: ${data.message}`);
//       }
//     } catch (error) {
//       setError(`Failed to fetch vehicle data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkTaxStatus = async (address) => {
//     if (!address || !inspectionId) return;
    
//     try {
//       const provider = new ethers.providers.Web3Provider(window.ethereum);
//       const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
//       // Check vehicle registration and tax status
//       const paymentStatus = await contract.getPaymentStatus(inspectionId);
      
//       if (!paymentStatus.registrationPaid) {
//         setError('Vehicle must be registered before paying tax');
//         return;
//       }
      
//       setTaxPaid(paymentStatus.taxPaid);
//       setTaxAmount(ethers.utils.formatUnits(paymentStatus.taxAmount, 'wei'));
      
//       if (paymentStatus.taxPaid) {
//         // Get transaction hash from vehicle data
//         const vehicleData = await contract.getVehicle(inspectionId);
//         setTransactionHash(vehicleData.taxTxHash);
//       }
      
//     } catch (error) {
//       console.error('Error checking tax status:', error);
//       setError('Failed to check tax status from blockchain');
//     }
//   };

//   const calculateTaxAmount = (vehicleType, engineCapacity, year) => {
//     // Tax calculation logic based on your requirements
//     let baseTax = 0;
    
//     const currentYear = new Date().getFullYear();
//     const vehicleAge = currentYear - year;
    
//     // Base tax by vehicle type
//     const baseTaxRates = {
//       'Car': 3000,
//       'Motorcycle': 1000,
//       'Truck': 5000,
//       'Bus': 7000,
//       'Van': 4000,
//       'SUV': 4500,
//       'Default': 2000
//     };
    
//     baseTax = baseTaxRates[vehicleType] || baseTaxRates['Default'];
    
//     // Age-based adjustment
//     if (vehicleAge > 10) {
//       baseTax *= 0.8; // 20% reduction for old vehicles
//     } else if (vehicleAge < 3) {
//       baseTax *= 1.2; // 20% increase for new vehicles
//     }
    
//     // Engine capacity adjustment
//     if (vehicleType === 'Car' && engineCapacity > 2000) {
//       baseTax += 1500;
//     } else if (vehicleType === 'Motorcycle' && engineCapacity > 600) {
//       baseTax += 500;
//     }
    
//     return Math.floor(baseTax);
//   };

//   const handleTaxPayment = async () => {
//     if (!walletAddress) {
//       await connectWallet();
//       return;
//     }

//     if (taxAmount === 0) {
//       setError('Tax amount not set. Please contact administrator.');
//       return;
//     }

//     try {
//       setPaymentLoading(true);
//       setError('');

//       const provider = new ethers.providers.Web3Provider(window.ethereum);
//       const signer = provider.getSigner();
      
//       // Convert tax amount to Wei (assuming tax is in PKR, convert to ETH)
//       const taxInEth = ethers.utils.parseEther((taxAmount * 0.000001).toString());
      
//       // Create contract instance
//       const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
//       // Pay tax
//       const tx = await contract.payTax(
//         inspectionId,
//         "", // Transaction hash will be set after confirmation
//         {
//           value: taxInEth,
//           gasLimit: 300000
//         }
//       );

//       console.log('Tax payment transaction submitted:', tx.hash);
      
//       // Wait for transaction confirmation
//       const receipt = await tx.wait();
//       console.log('Tax payment confirmed:', receipt);

//       // Update backend
//       await updateTaxPaymentStatus(tx.hash);

//       setTaxPaid(true);
//       setTransactionHash(tx.hash);
      
//       alert('Tax payment successful!');
      
//     } catch (error) {
//       console.error('Tax payment failed:', error);
//       let errorMessage = 'Tax payment failed: ';
      
//       if (error.code === 4001) {
//         errorMessage += 'Transaction rejected by user';
//       } else if (error.message.includes('insufficient funds')) {
//         errorMessage += 'Insufficient funds in wallet';
//       } else if (error.message.includes('Tax already paid')) {
//         errorMessage += 'Tax has already been paid for this vehicle';
//       } else {
//         errorMessage += error.message;
//       }
      
//       setError(errorMessage);
//     } finally {
//       setPaymentLoading(false);
//     }
//   };

//   const updateTaxPaymentStatus = async (txHash) => {
//     try {
//       await fetch(`http://localhost:5000/api/inspections/${inspectionId}/tax-payment`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           taxPaid: true,
//           taxTransactionHash: txHash,
//           walletAddress: walletAddress,
//           taxAmount: taxAmount
//         })
//       });
//     } catch (error) {
//       console.error('Failed to update tax payment status in backend:', error);
//     }
//   };

//   const viewTransaction = () => {
//     const explorerUrl = `https://etherscan.io/tx/${transactionHash}`;
//     window.open(explorerUrl, '_blank');
//   };

//   if (loading) {
//     return (
//       <div className="tax-container">
//         <div className="loading">Loading vehicle details...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="tax-container">
//         <div className="error">{error}</div>
//       </div>
//     );
//   }

//   if (!vehicleData) {
//     return (
//       <div className="tax-container">
//         <div className="error">No vehicle data found</div>
//       </div>
//     );
//   }

//   const { vehicleDetails } = vehicleData;
//   const calculatedTax = calculateTaxAmount(vehicleDetails.vehicleType, vehicleDetails.engineCapacity, vehicleDetails.year);

//   return (
//     <div className="tax-container">
//       <div className="tax-card">
//         <h2>Vehicle Tax Payment</h2>
        
//         {/* Vehicle Details */}
//         <div className="vehicle-summary">
//           <h3>Vehicle Information</h3>
//           <div className="summary-item">
//             <span>{vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.year})</span>
//           </div>
//           <div className="summary-item">
//             <span>Registration: {vehicleData.registrationNumber}</span>
//           </div>
//           <div className="summary-item">
//             <span>Type: {vehicleDetails.vehicleType}</span>
//           </div>
//         </div>

//         {/* Tax Information */}
//         <div className="tax-info">
//           <h3>Tax Details</h3>
//           <div className="tax-breakdown">
//             <div className="tax-item">
//               <span className="tax-label">Calculated Annual Tax:</span>
//               <span className="tax-value">PKR {calculatedTax.toLocaleString()}</span>
//             </div>
//             {taxAmount > 0 && taxAmount !== calculatedTax && (
//               <div className="tax-item">
//                 <span className="tax-label">Official Tax Amount:</span>
//                 <span className="tax-value">PKR {parseInt(taxAmount).toLocaleString()}</span>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Wallet Connection */}
//         {!walletAddress && (
//           <div className="wallet-section">
//             <button onClick={connectWallet} className="connect-wallet-btn">
//               Connect MetaMask Wallet
//             </button>
//           </div>
//         )}

//         {walletAddress && (
//           <div className="wallet-info">
//             <p>Connected Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
//           </div>
//         )}

//         {/* Tax Payment Section */}
//         {!taxPaid && walletAddress && taxAmount > 0 && (
//           <div className="payment-section">
//             <button 
//               onClick={handleTaxPayment} 
//               disabled={paymentLoading}
//               className="pay-tax-btn"
//             >
//               {paymentLoading ? 'Processing Tax Payment...' : `Pay Tax (PKR ${parseInt(taxAmount).toLocaleString()})`}
//             </button>
//             <p className="payment-note">
//               Tax amount will be deducted from your MetaMask wallet
//             </p>
//           </div>
//         )}

//         {/* Tax Amount Not Set */}
//         {!taxPaid && taxAmount === 0 && (
//           <div className="tax-not-set">
//             <div className="info-icon">ℹ️</div>
//             <h3>Tax Amount Not Set</h3>
//             <p>The official tax amount has not been set by the authorities yet.</p>
//             <p>Estimated tax: PKR {calculatedTax.toLocaleString()}</p>
//             <p>Please check back later or contact the registration office.</p>
//           </div>
//         )}

//         {/* Tax Payment Success */}
//         {taxPaid && (
//           <div className="payment-success">
//             <div className="success-icon">✅</div>
//             <h3>Tax Payment Successful!</h3>
//             <p>Your vehicle tax has been paid and recorded on the blockchain.</p>
//             {transactionHash && (
//               <div className="transaction-info">
//                 <p className="tx-hash">
//                   Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
//                 </p>
//                 <button onClick={viewTransaction} className="view-tx-btn">
//                   View on Block Explorer
//                 </button>
//               </div>
//             )}
//             <div className="tax-receipt">
//               <h4>Tax Payment Receipt</h4>
//               <div className="receipt-item">
//                 <span>Vehicle: {vehicleDetails.make} {vehicleDetails.model}</span>
//               </div>
//               <div className="receipt-item">
//                 <span>Registration: {vehicleData.registrationNumber}</span>
//               </div>
//               <div className="receipt-item">
//                 <span>Tax Amount: PKR {parseInt(taxAmount).toLocaleString()}</span>
//               </div>
//               <div className="receipt-item">
//                 <span>Payment Date: {new Date().toLocaleDateString()}</span>
//               </div>
//             </div>
//           </div>
//         )}

//         {error && (
//           <div className="error-message">
//             {error}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TaxPayment;





"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const TaxPayment = () => {
  const navigate = useNavigate()
  const [account, setAccount] = useState("")
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingTax, setPayingTax] = useState({})
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockVehicles = [
      {
        id: "VEH001",
        registrationNumber: "ABC-123",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        engineCapacity: "1300cc",
        vehicleType: "Car",
        taxStatus: "Due",
        taxAmount: 7500,
        dueDate: "2024-03-15",
        lastPaidDate: "2023-03-10",
        penaltyAmount: 750,
        totalAmount: 8250,
      },
      {
        id: "VEH002",
        registrationNumber: "XYZ-456",
        make: "Honda",
        model: "Civic",
        year: 2019,
        engineCapacity: "1500cc",
        vehicleType: "Car",
        taxStatus: "Paid",
        taxAmount: 8500,
        dueDate: "2024-06-20",
        lastPaidDate: "2024-01-15",
        penaltyAmount: 0,
        totalAmount: 8500,
      },
      {
        id: "VEH003",
        registrationNumber: "DEF-789",
        make: "Suzuki",
        model: "Mehran",
        year: 2018,
        engineCapacity: "800cc",
        vehicleType: "Car",
        taxStatus: "Due",
        taxAmount: 4500,
        dueDate: "2024-02-28",
        lastPaidDate: "2023-02-20",
        penaltyAmount: 900,
        totalAmount: 5400,
      },
      {
        id: "VEH004",
        registrationNumber: "GHI-321",
        make: "Honda",
        model: "CD 70",
        year: 2021,
        engineCapacity: "70cc",
        vehicleType: "Motorcycle",
        taxStatus: "Paid",
        taxAmount: 2000,
        dueDate: "2024-08-10",
        lastPaidDate: "2024-02-05",
        penaltyAmount: 0,
        totalAmount: 2000,
      },
    ]

    setTimeout(() => {
      setVehicles(mockVehicles)
      setLoading(false)
    }, 1000)
  }, [])

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setAccount(accounts[0])
        return accounts[0]
      } catch (error) {
        console.error("Error connecting to MetaMask", error)
        alert("Error connecting to MetaMask: " + error.message)
      }
    } else {
      alert("Please install MetaMask to use this feature!")
    }
  }

  const handlePayTax = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowPaymentModal(true)
  }

  const processPayment = async () => {
    if (!account) {
      const connectedAccount = await connectWallet()
      if (!connectedAccount) {
        alert("Please connect MetaMask first!")
        return
      }
    }

    setPayingTax({ ...payingTax, [selectedVehicle.id]: true })

    try {
      // Simulate payment processing
      console.log("Processing payment for vehicle:", selectedVehicle.registrationNumber)
      console.log("Amount:", selectedVehicle.totalAmount)
      console.log("Wallet:", account)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Update vehicle status
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === selectedVehicle.id
            ? {
                ...vehicle,
                taxStatus: "Paid",
                lastPaidDate: new Date().toISOString().split("T")[0],
                penaltyAmount: 0,
                totalAmount: vehicle.taxAmount,
              }
            : vehicle,
        ),
      )

      alert(`Tax payment successful for ${selectedVehicle.registrationNumber}! Transaction completed.`)
      setShowPaymentModal(false)
      setSelectedVehicle(null)
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setPayingTax({ ...payingTax, [selectedVehicle.id]: false })
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "text-green-400 bg-green-900/50 border-green-500"
      case "due":
        return "text-red-400 bg-red-900/50 border-red-500"
      case "overdue":
        return "text-orange-400 bg-orange-900/50 border-orange-500"
      default:
        return "text-gray-400 bg-gray-900/50 border-gray-500"
    }
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading your vehicles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Vehicle Tax Payment</h2>
          <div className="flex items-center">
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              {account ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
            </button>
            <button
              className="ml-4 text-blue-400 hover:text-blue-300 transition duration-200"
              onClick={() => navigate("/dashboard")}
            >
              &lt; Back to Dashboard
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-md p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-white mb-1">{vehicles.length}</div>
            <div className="text-gray-400 text-sm">Total Vehicles</div>
          </div>
          <div className="bg-gray-800 rounded-md p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {vehicles.filter((v) => v.taxStatus === "Paid").length}
            </div>
            <div className="text-gray-400 text-sm">Tax Paid</div>
          </div>
          <div className="bg-gray-800 rounded-md p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {vehicles.filter((v) => v.taxStatus === "Due").length}
            </div>
            <div className="text-gray-400 text-sm">Tax Due</div>
          </div>
          <div className="bg-gray-800 rounded-md p-4 border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              PKR{" "}
              {vehicles
                .filter((v) => v.taxStatus === "Due")
                .reduce((sum, v) => sum + v.totalAmount, 0)
                .toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total Due</div>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-gray-800 rounded-md p-6 border-l-4 border-blue-500">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                <div className="mb-4 lg:mb-0">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </h3>
                  <p className="text-gray-400">Registration: {vehicle.registrationNumber}</p>
                  <p className="text-gray-400 text-sm">
                    {vehicle.engineCapacity} • {vehicle.vehicleType}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(vehicle.taxStatus)}`}
                  >
                    {vehicle.taxStatus}
                    {vehicle.taxStatus === "Due" && isOverdue(vehicle.dueDate) && " (Overdue)"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Tax Amount</p>
                  <p className="text-white font-medium">PKR {vehicle.taxAmount.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Due Date</p>
                  <p className="text-white font-medium">{new Date(vehicle.dueDate).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Last Paid</p>
                  <p className="text-white font-medium">
                    {vehicle.lastPaidDate ? new Date(vehicle.lastPaidDate).toLocaleDateString() : "Never"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">
                    {vehicle.penaltyAmount > 0 ? "Total (with penalty)" : "Total Amount"}
                  </p>
                  <p className="text-white font-medium">PKR {vehicle.totalAmount.toLocaleString()}</p>
                  {vehicle.penaltyAmount > 0 && (
                    <p className="text-red-400 text-xs">Penalty: PKR {vehicle.penaltyAmount.toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                {vehicle.taxStatus === "Due" ? (
                  <button
                    onClick={() => handlePayTax(vehicle)}
                    disabled={payingTax[vehicle.id]}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md transition duration-200"
                  >
                    {payingTax[vehicle.id] ? "Processing..." : "Pay Tax"}
                  </button>
                ) : (
                  <button className="bg-green-600 text-white px-6 py-2 rounded-md cursor-not-allowed">
                    Tax Paid ✔️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No vehicles found</h3>
            <p className="text-gray-400">Register your vehicles to view tax information</p>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">Confirm Tax Payment</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Vehicle:</span>
                  <span className="text-white">{selectedVehicle.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax Amount:</span>
                  <span className="text-white">PKR {selectedVehicle.taxAmount.toLocaleString()}</span>
                </div>
                {selectedVehicle.penaltyAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Penalty:</span>
                    <span className="text-red-400">PKR {selectedVehicle.penaltyAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-600 pt-3">
                  <span className="text-white font-semibold">Total Amount:</span>
                  <span className="text-white font-semibold">PKR {selectedVehicle.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedVehicle(null)
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={payingTax[selectedVehicle.id]}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md transition duration-200"
                >
                  {payingTax[selectedVehicle.id] ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Link */}
        <div className="mt-6 text-center">
          <a href={"/dashboard"} className="inline-block text-sm text-blue-400 hover:underline">
            Go to Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}

export default TaxPayment
