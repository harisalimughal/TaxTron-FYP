import React, { useState } from 'react';
import Web3 from 'web3';
import { useLocation } from "react-router-dom";

const VehicleRegistration = () => {
  const location = useLocation();
  const [account, setAccount] = useState(location.state?.account || "");

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
    fuelType: ''
  });

  const handleChange = (e) => {
    setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
  };

  const registerVehicle = async () => {
    if (!account) {
      alert("Please connect MetaMask first!");
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      const contractAddress = "0x93efa469c0fe0F8dC635b8Ae152EF31bb92649DF"; // Replace with deployed address
      
      // Updated ABI to match the contract structure
      const abi = [
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
        .send({ from: account, gas: 3000000 });
        
      console.log("Transaction:", tx);
      alert("Vehicle registered successfully!");
    } catch (error) {
      console.error("Error registering vehicle:", error);
      alert("Error registering vehicle: " + error.message);
    }
  };

  // Improved UI with better styling
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Register Vehicle</h2>
      
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
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium transition duration-200"
        >
          Register Vehicle
        </button>
      </div>
    </div>
  );
};

export default VehicleRegistration;