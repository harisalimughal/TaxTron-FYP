import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Web3 from 'web3';
import vehicleRegistryABI from '../contracts/contractABI.json';
import vehicleNftABI from '../contracts/VehicleNFT.json';

const NFTPage = () => {
  const { inspectionId } = useParams();
  
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

  const printCertificate = () => {
    const printWindow = window.open('', '_blank');
    const certificateHTML = document.getElementById('certificate-card').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicle Registration Certificate</title>
          <style>
            body { 
              margin: 20px; 
              font-family: Arial, sans-serif; 
              background: #f5f5f5;
            }
            .certificate-card {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px;
              padding: 24px;
              color: white;
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              max-width: 400px;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { font-size: 24px; margin-bottom: 8px; }
            .title { font-size: 18px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 12px; opacity: 0.9; margin: 4px 0; }
            .vehicle-info { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
            .label { opacity: 0.8; }
            .value { font-weight: bold; }
            .photo-section { text-align: center; margin: 16px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; opacity: 0.7; }
            @media print {
              body { margin: 0; background: white; }
              .certificate-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${certificateHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6 px-4">
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
                    <>🎨 Generate NFT Certificate</>
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
              <h2 className="text-2xl font-bold text-white">Certificate</h2>
              {nftGenerated && (
                <div className="flex gap-2">
                  <button
                    onClick={copyNFTDetails}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-all"
                  >
                    📋
                  </button>
                  <button
                    onClick={viewOnExplorer}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-all"
                  >
                    🔍
                  </button>
                  <button
                    onClick={printCertificate}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-all"
                  >
                    🖨️
                  </button>
                </div>
              )}
            </div>

            {nftGenerated && showCertificate ? (
              /* License Card Style Certificate */
              <div id="certificate-card" className="certificate-card bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-6 text-white shadow-2xl border border-blue-400/30 max-w-sm mx-auto">
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

                {/* Vehicle Information */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Vehicle:</span>
                    <span className="font-bold text-right">
                      {vehicleDetails?.make} {vehicleDetails?.model}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Year:</span>
                    <span className="font-bold">{vehicleDetails?.manufacturingYear}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Type:</span>
                    <span className="font-bold">{vehicleDetails?.vehicleType}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Registration:</span>
                    <span className="font-bold">{vehicleData.registrationNumber || blockchainData?.registrationNumber || 'Pending'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Owner:</span>
                    <span className="font-bold text-right">{vehicleDetails?.ownerName || 'Unknown'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Inspection ID:</span>
                    <span className="font-bold">{inspectionId}</span>
                  </div>

                  {nftData?.tokenId && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Token ID:</span>
                      <span className="font-bold">{nftData.tokenId}</span>
                    </div>
                  )}

                  {nftData?.mintTimestamp && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Minted:</span>
                      <span className="font-bold">
                        {new Date(Number(nftData.mintTimestamp) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                  <div className="w-16 h-0.5 bg-white/50 mx-auto mb-2"></div>
                  <p className="text-xs opacity-70">Verified on Blockchain</p>
                  <p className="text-xs font-mono mt-1">
                    Contract: {VEHICLE_NFT_ADDRESS.slice(0, 6)}...{VEHICLE_NFT_ADDRESS.slice(-4)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 text-slate-400">🎨</div>
                <p className="text-white mb-2">No NFT Certificate Available</p>
                <p className="text-slate-400 text-sm">
                  {isPaid
                    ? 'Click "Generate NFT Certificate" to create one'
                    : 'Complete registration payment to enable NFT generation'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTPage;