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
    // This function would prepare the metadata for NFT creation
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Register Vehicle</h2>
        <button 
          onClick={connectWallet} 
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium transition duration-200"
        >
          {account ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
        </button>
      </div>
      
      {/* Image Upload Section with Smaller Preview */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Vehicle Image</h3>
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Select Vehicle Photo</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full p-2 border rounded" 
            />
            <p className="text-sm text-gray-500 mt-1">Image will be uploaded when you click "Register Vehicle"</p>
          </div>
          {/* Smaller image preview container */}
          <div style={{ width: '500px', height: '500px' }} className="bg-gray-200 rounded flex items-center justify-center overflow-hidden">
  {imagePreview ? (
    <img 
      src={imagePreview} 
      alt="Vehicle preview" 
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    />
  ) : (
    <span className="text-gray-400 text-xs text-center">No image</span>
  )}
</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Owner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Owner Name</label>
              <input 
                type="text" 
                name="ownerName" 
                value={vehicleData.ownerName} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Father Name</label>
              <input 
                type="text" 
                name="fatherName" 
                value={vehicleData.fatherName} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CNIC</label>
              <input 
                type="text" 
                name="cnic" 
                value={vehicleData.cnic} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Registration Number</label>
              <input 
                type="text" 
                name="registrationNumber" 
                value={vehicleData.registrationNumber} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Engine Number</label>
              <input 
                type="text" 
                name="engineNumber" 
                value={vehicleData.engineNumber} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chassis Number</label>
              <input 
                type="text" 
                name="chassisNumber" 
                value={vehicleData.chassisNumber} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <input 
                type="text" 
                name="make" 
                value={vehicleData.make} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input 
                type="text" 
                name="model" 
                value={vehicleData.model} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Variant</label>
              <input 
                type="text" 
                name="variant" 
                value={vehicleData.variant} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Manufacturing Year</label>
              <input 
                type="number" 
                name="manufacturingYear" 
                value={vehicleData.manufacturingYear} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration Year</label>
              <input 
                type="number" 
                name="registrationYear" 
                value={vehicleData.registrationYear} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle Type</label>
              <input 
                type="text" 
                name="vehicleType" 
                value={vehicleData.vehicleType} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Type</label>
              <input 
                type="text" 
                name="fuelType" 
                value={vehicleData.fuelType} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
                required 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={registerVehicle} 
          disabled={isUploading}
          className={`${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white px-6 py-2 rounded font-medium transition duration-200`}
        >
          {isUploading ? 'Uploading & Registering...' : 'Register Vehicle'}
        </button>
      </div>
    </div>
  );
};

export default VehicleRegistration;