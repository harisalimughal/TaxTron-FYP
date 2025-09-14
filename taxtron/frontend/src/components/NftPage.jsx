import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import vehicleRegistryABI from '../contracts/contractABI.json';
import vehicleNftABI from '../contracts/VehicleNFT.json';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  ArrowLeft, 
  Car, 
  Wallet, 
  Download, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Award,
  Shield,
  FileText,
  Sparkles
} from 'lucide-react';

const NFTPage = () => {
  const { inspectionId } = useParams();
  const navigate = useNavigate();
  const NFTPageRef = useRef(null);
  const certificateRef = useRef(null);
  
  const [vehicleData, setVehicleData] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [nftData, setNftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingNFT, setIsGeneratingNFT] = useState(false);
  const [nftGenerated, setNftGenerated] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [web3, setWeb3] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Contract configurations
  const VEHICLE_REGISTRY_ADDRESS = "0x98e503A4364ACdfA19441f07e81F4FFd53Dab75B";
  const VEHICLE_NFT_ADDRESS = "0xc303134658E22e75b1494a1FCF5B91222380809f"; 

  // Get the ABI in the correct format
  const CONTRACT_ABI = vehicleRegistryABI.abi || vehicleRegistryABI;
  const NFT_ABI = vehicleNftABI.abi || vehicleNftABI;

  useEffect(() => {
    if (inspectionId) {
      initializeWeb3();
      fetchVehicleData();
      checkWalletConnection();
    } else {
      setError('No inspection ID provided in URL');
      setLoading(false);
    }
  }, [inspectionId]);

  const initializeWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    } else {
      setError('MetaMask not installed');
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

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for inspection ID:', inspectionId);

      const response = await fetch(`http://localhost:5000/api/inspections/${inspectionId}`);
      const data = await response.json();

      console.log('API Response:', data);

      if (data.success) {
        setVehicleData(data.data);
        console.log('Fetched vehicle data for inspection ID:', inspectionId, data.data);
        
        await fetchBlockchainData();
      } else {
        setError(`Vehicle data not found for inspection ID: ${inspectionId}. API Response: ${data.message}`);
      }

    } catch (error) {
      console.error('API fetch error:', error);
      setError(`Failed to fetch vehicle data for ${inspectionId}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchainData = async () => {
    if (!web3) return;
    
    try {
      const nftContract = new web3.eth.Contract(NFT_ABI, VEHICLE_NFT_ADDRESS);
      
      try {
        const nftExists = await nftContract.methods.nftExistsForInspection(inspectionId).call();
        
        if (nftExists) {
          const tokenId = await nftContract.methods.getTokenIdByInspection(inspectionId).call();
          const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
          const tokenOwner = await nftContract.methods.ownerOf(tokenId).call();
          
          // Get vehicle info from contract
          const vehicleInfo = await nftContract.methods.getVehicleInfo(inspectionId).call();
          
          setNftData({
            tokenId: tokenId,
            tokenURI: tokenURI,
            owner: tokenOwner,
            exists: true,
            vehicleInfo: {
              make: vehicleInfo[0],
              model: vehicleInfo[1],
              year: vehicleInfo[2],
              vehicleType: vehicleInfo[3],
              registrationNumber: vehicleInfo[4],
              mintedTo: vehicleInfo[5],
              mintTimestamp: vehicleInfo[6]
            }
          });
          setNftGenerated(true);
          // Auto-show certificate if it already exists
          setShowCertificate(true);
        } else {
          setNftData({ exists: false });
        }
        
      } catch (nftError) {
        console.log('NFT not minted yet:', nftError.message);
        setNftData({ exists: false });
      }
      
      console.log('Blockchain data fetched for inspection ID:', inspectionId);
    } catch (error) {
      console.log(`Vehicle data not found on blockchain yet:`, error.message);
    }
  };

  const generateNFT = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }

    if (!web3) {
      setError('Web3 not initialized');
      return;
    }

    if (!vehicleData) {
      setError('Vehicle data not loaded');
      return;
    }

    try {
      setIsGeneratingNFT(true);
      setError('');

      const nftContract = new web3.eth.Contract(NFT_ABI, VEHICLE_NFT_ADDRESS);
      
      console.log('Vehicle Data Debug:', {
        inspectionId: vehicleData.inspectionId,
        make: vehicleData.vehicleDetails?.make,
        model: vehicleData.vehicleDetails?.model,
        year: vehicleData.vehicleDetails?.manufacturingYear,
        engineNumber: vehicleData.vehicleDetails?.engineNumber,
        chassisNumber: vehicleData.vehicleDetails?.chassisNumber,
        vehicleType: vehicleData.vehicleDetails?.vehicleType
      });

      // Check if NFT already exists
      try {
        const nftExists = await nftContract.methods.nftExistsForInspection(inspectionId).call();
        if (nftExists) {
          setNftGenerated(true);
          setShowCertificate(true);
          return;
        }
      } catch (checkError) {
        console.log('NFT existence check failed:', checkError.message);
      }

      // Create metadata
      const metadata = {
        name: `${vehicleData.vehicleDetails?.make || 'Unknown'} ${vehicleData.vehicleDetails?.model || 'Unknown'}`,
        description: `Vehicle NFT Certificate for ${vehicleData.vehicleDetails?.make || 'Unknown'} ${vehicleData.vehicleDetails?.model || 'Unknown'} (${vehicleData.vehicleDetails?.manufacturingYear || 'Unknown'})`,
        image: vehicleData.vehicleImage || '',
        external_url: `${window.location.origin}/view-nft/${inspectionId}`,
        attributes: [
          {"trait_type": "Make", "value": vehicleData.vehicleDetails?.make || 'Unknown'},
          {"trait_type": "Model", "value": vehicleData.vehicleDetails?.model || 'Unknown'},
          {"trait_type": "Year", "value": vehicleData.vehicleDetails?.manufacturingYear || 'Unknown'},
          {"trait_type": "Engine Number", "value": vehicleData.vehicleDetails?.engineNumber || 'Unknown'},
          {"trait_type": "Chassis Number", "value": vehicleData.vehicleDetails?.chassisNumber || 'Unknown'},
          {"trait_type": "Fuel Type", "value": vehicleData.vehicleDetails?.fuelType || 'Unknown'},
          {"trait_type": "Registration Number", "value": vehicleData.registrationNumber || 'Pending'},
          {"trait_type": "Owner", "value": vehicleData.vehicleDetails?.ownerName || 'Unknown'},
          {"trait_type": "Inspector", "value": vehicleData.inspectedBy || 'Unknown'},
          {"trait_type": "Inspection Date", "value": vehicleData.inspectionDate || 'Unknown'}
        ]
      };
      
      const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      
      // Prepare parameters for the contract call
      const inspectionIdStr = inspectionId || '';
      const make = vehicleData.vehicleDetails?.make || '';
      const model = vehicleData.vehicleDetails?.model || '';
      const year = (vehicleData.vehicleDetails?.manufacturingYear || vehicleData.vehicleDetails?.year || '').toString();
      const vehicleType = vehicleData.vehicleDetails?.vehicleType || '';
      const registrationNumber = vehicleData.registrationNumber || '';
      
      try {
        // Try the extended function first (with vehicle details)
        const gasEstimate = await nftContract.methods.mintVehicleNFT(
          inspectionIdStr,
          walletAddress,
          metadataURI,
          make,
          model,
          year,
          vehicleType,
          registrationNumber
        ).estimateGas({
          from: walletAddress
        });

        console.log('Gas estimate:', gasEstimate);

        const tx = await nftContract.methods.mintVehicleNFT(
          inspectionIdStr,
          walletAddress,
          metadataURI,
          make,
          model,
          year,
          vehicleType,
          registrationNumber
        ).send({
          from: walletAddress,
          gas: Math.floor(Number(gasEstimate) * 1.2)
        });

        console.log('NFT minted successfully for inspection ID:', inspectionId, tx);
        setNftGenerated(true);
        setShowCertificate(true);
        
        setTimeout(async () => {
          await fetchBlockchainData();
        }, 2000);
        
        alert('NFT Certificate generated successfully!');
        
      } catch (extendedError) {
        console.log('Extended mint failed, trying simple version:', extendedError.message);
        
        // Fallback to simple version
        const gasEstimate = await nftContract.methods.mintVehicleNFT(
          inspectionIdStr,
          walletAddress,
          metadataURI
        ).estimateGas({
          from: walletAddress
        });

        console.log('Gas estimate (simple):', gasEstimate);

        const tx = await nftContract.methods.mintVehicleNFT(
          inspectionIdStr,
          walletAddress,
          metadataURI
        ).send({
          from: walletAddress,
          gas: Math.floor(Number(gasEstimate) * 1.2)
        });

        console.log('NFT minted successfully (simple) for inspection ID:', inspectionId, tx);
        setNftGenerated(true);
        setShowCertificate(true);
        
        setTimeout(async () => {
          await fetchBlockchainData();
        }, 2000);
        
        alert('NFT Certificate generated successfully!');
      }
      
    } catch (error) {
      console.error('NFT generation failed for inspection ID:', inspectionId, error);
      
      let errorMessage = 'NFT generation failed: ';
      
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
      setIsGeneratingNFT(false);
    }
  };

  const viewOnExplorer = () => {
    if (nftData?.tokenId) {
      alert(`NFT Token ID: ${nftData.tokenId}\n\nNFT Contract: ${VEHICLE_NFT_ADDRESS}\nRegistry Contract: ${VEHICLE_REGISTRY_ADDRESS}\n\nTo view in Ganache:\n1. Open Ganache application\n2. Go to "Contracts" tab\n3. Check both contract addresses`);
    } else if (transactionHash) {
      alert(`Payment TX: ${transactionHash}\n\nContracts:\nRegistry: ${VEHICLE_REGISTRY_ADDRESS}\nNFT: ${VEHICLE_NFT_ADDRESS}`);
    }
  };

  const copyNFTDetails = () => {
    if (nftData?.exists) {
      const details = `NFT Certificate Details:
Token ID: ${nftData.tokenId}
Contract: ${VEHICLE_NFT_ADDRESS}
Owner: ${nftData.owner}
Inspection ID: ${inspectionId}
Vehicle: ${nftData.vehicleInfo?.make} ${nftData.vehicleInfo?.model}
Year: ${nftData.vehicleInfo?.year}
Registration: ${nftData.vehicleInfo?.registrationNumber}`;
      
      navigator.clipboard.writeText(details).then(() => {
        alert('NFT details copied to clipboard!');
      }).catch(() => {
        alert(details);
      });
    }
  };

  const downloadCertificateAsPDF = async () => {
    const element = certificateRef.current;
    
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 0.75,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 100;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`vehicle-certificate-${inspectionId}.pdf`);
  };

  // Loading and error states
  if (!inspectionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid URL</h3>
            <p className="text-gray-600">No inspection ID provided in the URL</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#8CC152'}}></div>
          <p className="text-gray-900 text-lg font-medium">Loading Vehicle Data...</p>
          <p className="text-gray-600 text-sm mt-2">ID: {inspectionId}</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading NFT</h3>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
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
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-600">No vehicle data found for inspection ID: {inspectionId}</p>
          </div>
        </div>
      </div>
    );
  }

  const { vehicleDetails } = vehicleData;

  return (
    <div ref={NFTPageRef} className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
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
              <h1 className="text-2xl font-bold text-gray-900">Vehicle NFT Certificate</h1>
              <p className="text-sm text-gray-600">Digital blockchain certificate for your vehicle</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Status display showing NFT status only */}
          <div className="mb-6 flex gap-2 justify-center">
            {/* NFT Status */}
            {nftGenerated ? (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>NFT Certificate Available</span>
              </div>
            ) : (
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>NFT Ready to Generate</span>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#8CC152'}}>
                  <Car className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Vehicle Information</h2>
              </div>
              
              {/* Vehicle Image */}
              {vehicleData.vehicleImage && (
                <div className="mb-6">
                  <img 
                    src={vehicleData.vehicleImage} 
                    alt="Vehicle" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Vehicle Details */}
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {vehicleDetails?.make} {vehicleDetails?.model}
                  </h3>
                  <p className="text-gray-600">{vehicleDetails?.manufacturingYear}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 font-medium">Vehicle Type</p>
                    <p className="text-gray-900 font-semibold">{vehicleDetails?.vehicleType || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 font-medium">Engine Capacity</p>
                    <p className="text-gray-900 font-semibold">{vehicleDetails?.engineCapacity ? `${vehicleDetails.engineCapacity} CC` : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 font-medium">Engine Number</p>
                    <p className="text-gray-900 font-semibold text-xs">{vehicleDetails?.engineNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 font-medium">Chassis Number</p>
                    <p className="text-gray-900 font-semibold text-xs">{vehicleDetails?.chassisNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 font-medium">Color</p>
                    <p className="text-gray-900 font-semibold">{vehicleDetails?.color || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 font-medium">Fuel Type</p>
                    <p className="text-gray-900 font-semibold">{vehicleDetails?.fuelType || 'N/A'}</p>
                  </div>
                </div>

                {/* Owner Information Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Owner Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 font-medium">Owner Name</p>
                      <p className="text-gray-900 font-semibold">{vehicleData?.userId?.fullName || vehicleDetails?.ownerName || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 font-medium">CNIC</p>
                      <p className="text-gray-900 font-semibold">{vehicleData?.userId?.cnic || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 font-medium">Email</p>
                      <p className="text-gray-900 font-semibold text-xs">{vehicleData?.userId?.email || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 font-medium">Wallet Address</p>
                      <p className="text-gray-900 font-semibold text-xs">{vehicleData?.userId?.walletAddress ? `${vehicleData.userId.walletAddress.slice(0, 6)}...${vehicleData.userId.walletAddress.slice(-4)}` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Registration Number */}
                {vehicleData.registrationNumber && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-700 text-sm font-medium">Registration Number</p>
                    <p className="text-green-900 font-bold text-lg">
                      {vehicleData.registrationNumber}
                    </p>
                  </div>
                )}

                {/* Wallet Connection */}
                {!walletAddress ? (
                  <button
                    onClick={connectWallet}
                    className="w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
                    style={{backgroundColor: '#8CC152'}}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-green-700 font-medium">Connected Wallet</p>
                    </div>
                    <p className="text-green-900 font-mono text-xs mt-1">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                )}

                {/* Generate NFT Button - Always available when wallet is connected */}
                {walletAddress && !nftGenerated && (
                  <button
                    onClick={generateNFT}
                    disabled={isGeneratingNFT}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    {isGeneratingNFT ? (
                      <>
                        <Clock className="w-5 h-5 animate-spin" />
                        <span>Generating NFT...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate NFT Certificate</span>
                      </>
                    )}
                  </button>
                )}

                {/* View Certificate Button when NFT is generated */}
                {walletAddress && nftGenerated && !showCertificate && (
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
                    style={{backgroundColor: '#8CC152'}}
                  >
                    <FileText className="w-5 h-5" />
                    <span>View NFT Certificate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Certificate Display Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#8CC152'}}>
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">NFT Digital Certificate</h2>
                </div>
                {nftGenerated && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyNFTDetails}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                      title="Copy NFT Details"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={viewOnExplorer}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadCertificateAsPDF}
                      disabled={isDownloadingPDF}
                      className="text-white px-3 py-2 rounded-lg text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      style={{backgroundColor: '#8CC152'}}
                      title="Download PDF"
                    >
                      {isDownloadingPDF ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {nftGenerated && showCertificate ? (
                /* License Card Style Certificate */
                <div 
                  ref={certificateRef}
                  id="certificate-card" 
                  className="certificate-card bg-gradient-to-br from-green-600 via-emerald-600 to-green-800 rounded-2xl p-6 text-white shadow-2xl border-2 max-w-sm mx-auto"
                  style={{borderColor: '#8CC152'}}
                >
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Shield className="w-6 h-6" />
                      <h3 className="text-lg font-bold">VEHICLE REGISTRATION</h3>
                    </div>
                    <p className="text-xs opacity-90">Digital Certificate</p>
                    <div className="w-16 h-0.5 bg-white/50 mx-auto mt-2"></div>
                  </div>

                  {/* Vehicle Photo Section */}
                  {vehicleData.vehicleImage && (
                    <div className="text-center mb-4">
                      <img 
                        src={vehicleData.vehicleImage} 
                        alt="Vehicle" 
                        className="w-24 h-16 object-cover rounded-lg mx-auto border-2 border-white/30"
                      />
                    </div>
                  )}

                  {/* Vehicle Information */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">Vehicle:</span>
                      <span className="font-semibold">{vehicleDetails?.make} {vehicleDetails?.model}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">Year:</span>
                      <span className="font-semibold">{vehicleDetails?.manufacturingYear}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">Type:</span>
                      <span className="font-semibold">{vehicleDetails?.vehicleType}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">Engine:</span>
                      <span className="font-semibold">{vehicleDetails?.engineCapacity}cc</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">Chassis:</span>
                      <span className="font-semibold text-xs">{vehicleDetails?.chassisNumber}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">Color:</span>
                      <span className="font-semibold">{vehicleDetails?.color}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">Fuel:</span>
                      <span className="font-semibold">{vehicleDetails?.fuelType}</span>
                    </div>
                    
                    {/* Owner Information */}
                    <div className="border-t border-white/30 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="opacity-90">Owner:</span>
                        <span className="font-semibold text-xs">{vehicleData?.userId?.fullName || vehicleDetails?.ownerName}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="opacity-90">CNIC:</span>
                        <span className="font-semibold text-xs">{vehicleData?.userId?.cnic}</span>
                      </div>
                    </div>
                    
                    {vehicleData.registrationNumber && (
                      <div className="bg-white/20 p-3 rounded-lg mt-4">
                        <div className="text-center">
                          <p className="text-xs opacity-90">Registration Number</p>
                          <p className="font-bold text-lg tracking-wider">
                            {vehicleData.registrationNumber}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* NFT Details */}
                    {nftData?.exists && (
                      <div className="border-t border-white/30 pt-3 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="opacity-90">Token ID:</span>
                          <span className="font-mono text-xs">{nftData.tokenId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="opacity-90">Owner:</span>
                          <span className="font-mono text-xs">{nftData.owner?.slice(0, 6)}...{nftData.owner?.slice(-4)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-6 pt-4 border-t border-white/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                      <p className="text-xs opacity-75">Blockchain Verified</p>
                    </div>
                    <p className="text-xs opacity-75">Inspection ID: {inspectionId}</p>
                    <div className="flex justify-center items-center mt-2">
                      <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                      <span className="text-xs">Authentic Certificate</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Placeholder when NFT not generated */
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    NFT Certificate Ready
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {!walletAddress 
                      ? "Connect your wallet to generate your NFT certificate"
                      : "Click 'Generate NFT Certificate' to create your digital certificate"
                    }
                  </p>
                  
                  {nftGenerated && !showCertificate && (
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="text-white py-2 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      style={{backgroundColor: '#8CC152'}}
                    >
                      View Certificate
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTPage;