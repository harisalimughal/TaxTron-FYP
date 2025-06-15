import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Web3 from 'web3';
import vehicleRegistryABI from '../contracts/contractABI.json';
import vehicleNftABI from '../contracts/VehicleNFT.json';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const NFTPage = () => {
  const { inspectionId } = useParams();
  const NFTPageRef = useRef(null);
  const certificateRef = useRef(null); // Added specific ref for certificate
  
  const [vehicleData, setVehicleData] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [nftData, setNftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingNFT, setIsGeneratingNFT] = useState(false);
  const [nftGenerated, setNftGenerated] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [web3, setWeb3] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false); // Added state for PDF download

  // Contract configurations
  const VEHICLE_REGISTRY_ADDRESS = "0x4E918C44F498184F3F0Cc6E3ECB88123dceD8500";
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
      const contract = new web3.eth.Contract(CONTRACT_ABI, VEHICLE_REGISTRY_ADDRESS);
      
      try {
        const paymentStatus = await contract.methods.getPaymentStatus(inspectionId).call();
        setIsPaid(paymentStatus.registrationPaid);
        
        if (paymentStatus.registrationPaid) {
          const vehicleData = await contract.methods.getVehicle(inspectionId).call();
          setTransactionHash(vehicleData.registrationTxHash);
          setBlockchainData({
            registrationNumber: vehicleData.registrationNumber,
            owner: vehicleData.owner,
            registrationTxHash: vehicleData.registrationTxHash,
            isRegistered: vehicleData.isRegistered
          });
        }
      } catch (contractError) {
        console.log('Vehicle not found on blockchain, checking backend...');
      }
    } catch (error) {
      console.error('Error checking blockchain payment status:', error);
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
        
        if (!isPaid) {
          await checkPaymentStatus(inspectionId);
        }
        
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

  const checkPaymentStatus = async (inspectionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/inspections/${inspectionId}/payment-status`);
      if (response.ok) {
        const data = await response.json();
        if (!isPaid) {
          setIsPaid(data.isPaid || false);
          setTransactionHash(data.transactionHash || '');
        }
      }
    } catch (error) {
      console.log('Payment status check failed:', error);
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
          {"trait_type": "Registration Number", "value": vehicleData.registrationNumber || blockchainData?.registrationNumber || 'Pending'},
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
      const registrationNumber = vehicleData.registrationNumber || blockchainData?.registrationNumber || '';
      
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
    scale: 0.75, // Reduce this for smaller canvas
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgWidth = 100; // Adjust this based on your layout
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  pdf.save(`vehicle-certificate-${inspectionId}.pdf`);
};


  // Loading and error states
  if (!inspectionId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl mb-4">Invalid URL</h2>
          <p className="text-slate-400">No inspection ID provided in the URL</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading Vehicle Data...</p>
          <p className="text-slate-400 text-sm mt-2">ID: {inspectionId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-4">Error Loading NFT</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!vehicleData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl">No vehicle data found</h2>
          <p className="text-slate-400 mt-2">Inspection ID: {inspectionId}</p>
        </div>
      </div>
    );
  }

  const { vehicleDetails } = vehicleData;

  return (
    <div ref={NFTPageRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Status display showing both payment and NFT status */}
        <div className="mb-4 flex gap-2 justify-center">
          {/* Payment Status */}
          {isPaid ? (
            <div className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ Registered
            </div>
          ) : (
            <div className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold">
              ✗ Payment Pending
            </div>
          )}
          
          {/* NFT Status */}
          {nftGenerated ? (
            <div className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ NFT Certificate Available
            </div>
          ) : (
            <div className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold">
              ⏳ NFT Pending
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information Panel */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600">
            <h1 className="text-2xl font-bold text-white text-center mb-6">
              Vehicle Information
            </h1>
            
            {/* Vehicle Image */}
            {vehicleData.vehicleImage && (
              <div className="mb-6">
                <img 
                  src={vehicleData.vehicleImage} 
                  alt="Vehicle" 
                  className="w-full h-48 object-cover rounded-lg border border-slate-600"
                />
              </div>
            )}

            {/* Vehicle Details */}
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {vehicleDetails?.make} {vehicleDetails?.model}
                </h2>
                <p className="text-slate-400">{vehicleDetails?.manufacturingYear}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-slate-400">Type</p>
                  <p className="text-white font-semibold">{vehicleDetails?.vehicleType}</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-slate-400">Engine</p>
                  <p className="text-white font-semibold text-xs">{vehicleDetails?.engineNumber}</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-slate-400">Chassis</p>
                  <p className="text-white font-semibold text-xs">{vehicleDetails?.chassisNumber}</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-slate-400">Owner</p>
                  <p className="text-white font-semibold text-xs">{vehicleDetails?.ownerName}</p>
                </div>
              </div>

              {/* Registration Number */}
              {(vehicleData.registrationNumber || blockchainData?.registrationNumber) && (
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-lg border border-blue-500/30">
                  <p className="text-slate-400 text-sm">Registration Number</p>
                  <p className="text-white font-bold text-lg">
                    {vehicleData.registrationNumber || blockchainData?.registrationNumber}
                  </p>
                </div>
              )}

              {/* Wallet Connection */}
              {!walletAddress ? (
                <button
                  onClick={connectWallet}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  🔗 Connect Wallet
                </button>
              ) : (
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-slate-400">Connected Wallet</p>
                  <p className="text-white font-mono text-xs">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              )}

              {/* Generate NFT Button */}
              {walletAddress && !nftGenerated && isPaid && (
                <button
                  onClick={generateNFT}
                  disabled={isGeneratingNFT}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  {isGeneratingNFT ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating NFT...
                    </>
                  ) : (
                    <>🎨 View NFT Certificate</>
                  )}
                </button>
              )}

              {/* Payment Required Message */}
              {walletAddress && !isPaid && (
                <div className="bg-orange-600/20 text-orange-300 p-3 rounded-lg text-center">
                  <p className="text-sm">⚠️ Payment required before generating NFT</p>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Display Panel */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">NFT Digital Certificate</h2>
              {nftGenerated && (
                <div className="flex gap-2">
                  <button
                    onClick={copyNFTDetails}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-all"
                    title="Copy NFT Details"
                  >
                    📋
                  </button>
                  <button
                    onClick={viewOnExplorer}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-all"
                    title="View on Explorer"
                  >
                    🔍
                  </button>
                  <button
                    onClick={downloadCertificateAsPDF}
                    disabled={isDownloadingPDF}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-all flex items-center"
                    title="Download PDF"
                  >
                    {isDownloadingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                        ⏳
                      </>
                    ) : (
                      '🖨️'
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
                className="certificate-card bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-6 text-white shadow-2xl border border-blue-400/30 max-w-sm mx-auto"
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold">VEHICLE REGISTRATION</h3>
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

                {/* Vehicle Information - Continuing from where it was cut off */}
                <div className="space-y-3 text-sm">
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
                    <span className="opacity-90">Owner:</span>
                    <span className="font-semibold text-xs">{vehicleDetails?.ownerName}</span>
                  </div>
                  
                  {(vehicleData.registrationNumber || blockchainData?.registrationNumber) && (
                    <div className="bg-white/20 p-3 rounded-lg mt-4">
                      <div className="text-center">
                        <p className="text-xs opacity-90">Registration Number</p>
                        <p className="font-bold text-lg tracking-wider">
                          {vehicleData.registrationNumber || blockchainData?.registrationNumber}
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
                  <p className="text-xs opacity-75">Blockchain Verified</p>
                  <p className="text-xs opacity-75">Inspection ID: {inspectionId}</p>
                  <div className="flex justify-center items-center mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-xs">Authentic Certificate</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder when NFT not generated */
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  NFT Certificate Ready
                </h3>
                <p className="text-slate-400 mb-6">
                  {!walletAddress 
                    ? "Connect your wallet to generate your NFT certificate"
                    : !isPaid 
                    ? "Complete payment to unlock NFT generation"
                    : "Click 'View NFT Certificate' to generate your digital certificate"
                  }
                </p>
                
                {nftGenerated && !showCertificate && (
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white py-2 px-6 rounded-lg font-semibold transition-all duration-200"
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
  );
};

export default NFTPage;