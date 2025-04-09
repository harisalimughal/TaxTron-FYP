import React, { useState } from 'react';
import Web3 from 'web3';
import { useLocation } from "react-router-dom";
import axios from 'axios';

const VehicleRegistration = () => {
  const location = useLocation();
  const [account, setAccount] = useState(location.state?.account || "");
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [vehicleData, setVehicleData] = useState({
    ownerName: '',
    fatherName: '',
    cnic: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    variant: '',
    manufacturingYear: '',
    registrationYear: '',
    vehicleType: '',
    fuelType: '',
    imageUrl: ''
  });

  const handleChange = (e) => {
    setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        return accounts[0];
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        alert("Error connecting to MetaMask: " + error.message);
      }
    } else {
      alert("Please install MetaMask to use this feature!");
    }
  };

  // Handle image selection (just preview, don't upload yet)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Store the file for later upload
    setSelectedFile(file);

    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload the image to Cloudinary
  const uploadImage = async () => {
    if (!selectedFile) {
      alert("Please select a vehicle image before registering.");
      return null;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', 'vehicle_nft');

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/harrycloudinary/image/upload`,
        formData
      );
      
      setIsUploading(false);
      console.log("Image uploaded successfully:", response.data.secure_url);
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
      setIsUploading(false);
      return null;
    }
  };

  const registerVehicle = async () => {
    let currentAccount = account;
    
    if (!currentAccount) {
      currentAccount = await connectWallet();
      if (!currentAccount) {
        alert("Please connect MetaMask first!");
        return;
      }
    }

    if (!selectedFile && !vehicleData.imageUrl) {
      alert("Please select a vehicle image before registering.");
      return;
    }

    // First upload the image if not already uploaded
    let imageUrl = vehicleData.imageUrl;
    if (!imageUrl) {
      imageUrl = await uploadImage();
      if (!imageUrl) return; // Exit if image upload failed
      
      // Update the state with the image URL
      setVehicleData({ ...vehicleData, imageUrl });
    }

    try {
      const web3 = new Web3(window.ethereum);
      const contractAddress = "0x93efa469c0fe0F8dC635b8Ae152EF31bb92649DF";
      
      const abi = [
        // ABI stays the same
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "string",
              "name": "registrationNumber",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "ownerWallet",
              "type": "address"
            }
          ],
          "name": "VehicleRegistered",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "string",
              "name": "registrationNumber",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
            }
          ],
          "name": "RegistrationAttempt",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "name": "vehicles",
          "outputs": [
            {
              "internalType": "address",
              "name": "ownerWallet",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "ownerName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "fatherName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "cnic",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "registrationNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "engineNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "chassisNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "make",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "model",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "variant",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "manufacturingYear",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "registrationYear",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "vehicleType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "fuelType",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "isRegistered",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "ownerName",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "fatherName",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "cnic",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "registrationNumber",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "engineNumber",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "chassisNumber",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "make",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "model",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "variant",
                  "type": "string"
                },
                {
                  "internalType": "uint256",
                  "name": "manufacturingYear",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "registrationYear",
                  "type": "uint256"
                },
                {
                  "internalType": "string",
                  "name": "vehicleType",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "fuelType",
                  "type": "string"
                }
              ],
              "internalType": "struct VehicleRegistry.VehicleInput",
              "name": "input",
              "type": "tuple"
            }
          ],
          "name": "registerVehicle",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

      const contract = new web3.eth.Contract(abi, contractAddress);
      
      // Create the struct as expected by the contract
      const vehicleInput = {
        ownerName: vehicleData.ownerName,
        fatherName: vehicleData.fatherName,
        cnic: vehicleData.cnic,
        registrationNumber: vehicleData.registrationNumber,
        engineNumber: vehicleData.engineNumber,
        chassisNumber: vehicleData.chassisNumber,
        make: vehicleData.make,
        model: vehicleData.model,
        variant: vehicleData.variant,
        manufacturingYear: parseInt(vehicleData.manufacturingYear) || 0,
        registrationYear: parseInt(vehicleData.registrationYear) || 0,
        vehicleType: vehicleData.vehicleType,
        fuelType: vehicleData.fuelType
      };
      
      // Send the transaction with the struct
      const tx = await contract.methods
        .registerVehicle(vehicleInput)
        .send({ from: currentAccount, gas: 3000000 });
        
      console.log("Transaction:", tx);
      console.log("Vehicle registered with image URL:", imageUrl);
      
      alert("Vehicle registered successfully with image!");
    } catch (error) {
      console.error("Error registering vehicle:", error);
      alert("Error registering vehicle: " + error.message);
    }
  };

  // Store metadata for NFT creation
  const prepareNftMetadata = () => {
    const metadata = {
      name: `Vehicle ${vehicleData.registrationNumber}`,
      description: `${vehicleData.make} ${vehicleData.model} ${vehicleData.variant}`,
      image: vehicleData.imageUrl,
      attributes: [
        { trait_type: "Make", value: vehicleData.make },
        { trait_type: "Model", value: vehicleData.model },
        { trait_type: "Registration Number", value: vehicleData.registrationNumber },
        { trait_type: "Year", value: vehicleData.manufacturingYear },
        { trait_type: "Engine Number", value: vehicleData.engineNumber },
        { trait_type: "Chassis Number", value: vehicleData.chassisNumber }
      ]
    };
    
    return metadata;
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Register Vehicle</h2>
          <div className="flex items-center">
            <button 
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              {account ? `ConnectedAccount: ${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
            </button>
            <button
              className="ml-4 text-blue-400 hover:text-blue-300 transition duration-200"
              onClick={() => window.history.back()}
            >
              &lt; Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration Number</label>
              <input 
                type="text" 
                name="registrationNumber" 
                value={vehicleData.registrationNumber} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Engine Number</label>
              <input 
                type="text" 
                name="engineNumber" 
                value={vehicleData.engineNumber} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Chassis Number</label>
              <input 
                type="text" 
                name="chassisNumber" 
                value={vehicleData.chassisNumber} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Make</label>
              <input 
                type="text" 
                name="make" 
                value={vehicleData.make} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Model</label>
              <input 
                type="text" 
                name="model" 
                value={vehicleData.model} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Variant</label>
              <input 
                type="text" 
                name="variant" 
                value={vehicleData.variant} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Manufacturing Year</label>
              <input 
                type="number" 
                name="manufacturingYear" 
                value={vehicleData.manufacturingYear} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration Year</label>
              <input 
                type="number" 
                name="registrationYear" 
                value={vehicleData.registrationYear} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Vehicle Type</label>
              <div className="relative">
                <select 
                  name="vehicleType" 
                  value={vehicleData.vehicleType} 
                  onChange={handleChange} 
                  className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none" 
                  required
                >
                  <option value="">Select type</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="truck">Truck</option>
                  <option value="bus">Bus</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fuel Type</label>
              <div className="relative">
                <select 
                  name="fuelType" 
                  value={vehicleData.fuelType} 
                  onChange={handleChange} 
                  className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none" 
                  required
                >
                  <option value="">Select fuel</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="cng">CNG</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Owner Information & Image Upload */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Owner Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Owner Name</label>
                  <input 
                    type="text" 
                    name="ownerName" 
                    value={vehicleData.ownerName} 
                    onChange={handleChange} 
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Father Name</label>
                  <input 
                    type="text" 
                    name="fatherName" 
                    value={vehicleData.fatherName} 
                    onChange={handleChange} 
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CNIC</label>
                  <input 
                    type="text" 
                    name="cnic" 
                    value={vehicleData.cnic} 
                    onChange={handleChange} 
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                    required 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Vehicle Image</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Select Vehicle Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white text-sm" 
                  />
                </div>
                
                {/* Image preview */}
                <div className="bg-gray-800 rounded-md p-3 flex items-center justify-center border border-gray-700" style={{ height: "200px" }}>
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Vehicle preview" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p>No image selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={registerVehicle} 
            disabled={isUploading}
            className={`${
              isUploading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white px-10 py-2 rounded-md font-medium transition duration-200 w-48`}
          >
            {isUploading ? 'Processing...' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistration;