import React, { useState } from 'react';
import Web3 from 'web3';

const VehicleRegistration = ({ account }) => {
  const [vehicleData, setVehicleData] = useState({
    ownerName: '',
    fatherName: '',
    cnic: '',
    addressDetails: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    variant: '',
    color: '',
    manufacturingYear: '',
    registrationYear: '',
    seatingCapacity: '',
    vehicleType: '',
    vehicleCategory: '',
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
      const contractAddress = "0x380e9638CA8f7406168dA81799fd6E915Ad95B3d"; // Replace with deployed address
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
              "internalType": "string",
              "name": "ownerName",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "ownerWallet",
              "type": "address"
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
              "name": "addressDetails",
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
              "internalType": "string",
              "name": "color",
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
              "name": "seatingCapacity",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "vehicleType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "vehicleCategory",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "fuelType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "tokenTaxPaid",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "isRegistered",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_ownerName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_fatherName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_cnic",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_addressDetails",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_registrationNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_engineNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_chassisNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_make",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_model",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_variant",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_color",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "_manufacturingYear",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_registrationYear",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "_seatingCapacity",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_vehicleType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_vehicleCategory",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_fuelType",
              "type": "string"
            }
          ],
          "name": "registerVehicle",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_registrationNumber",
              "type": "string"
            }
          ],
          "name": "getVehicle",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "ownerName",
                  "type": "string"
                },
                {
                  "internalType": "address",
                  "name": "ownerWallet",
                  "type": "address"
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
                  "name": "addressDetails",
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
                  "internalType": "string",
                  "name": "color",
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
                  "name": "seatingCapacity",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "vehicleType",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "vehicleCategory",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "fuelType",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "tokenTaxPaid",
                  "type": "string"
                },
                {
                  "internalType": "bool",
                  "name": "isRegistered",
                  "type": "bool"
                }
              ],
              "internalType": "struct VehicleRegistry.Vehicle",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        }
      ]; // Replace with contract ABI

      const contract = new web3.eth.Contract(abi, contractAddress);
      const tx = await contract.methods
        .registerVehicle(
          vehicleData.ownerName,
          vehicleData.fatherName,
          vehicleData.cnic,
          vehicleData.addressDetails,
          vehicleData.registrationNumber,
          vehicleData.engineNumber,
          vehicleData.chassisNumber,
          vehicleData.make,
          vehicleData.model,
          vehicleData.variant,
          vehicleData.color,
          vehicleData.manufacturingYear,
          vehicleData.registrationYear,
          vehicleData.seatingCapacity,
          vehicleData.vehicleType,
          vehicleData.vehicleCategory,
          vehicleData.fuelType
        )
        .send({ from: account });

      console.log("Transaction:", tx);
      alert("Vehicle registered successfully!");
    } catch (error) {
      console.error("Error registering vehicle:", error);
    }
  };

  return (
    <div>
      <h2>Register Vehicle</h2>
      {Object.keys(vehicleData).map((key) => (
        <div key={key}>
          <label>{key.replace(/([A-Z])/g, ' $1')}:</label>
          <input 
            type="text" 
            name={key} 
            value={vehicleData[key]} 
            onChange={handleChange} 
            required 
          />
        </div>
      ))}
      <button onClick={registerVehicle} className="bg-blue-500 text-white px-4 py-2">
        Register Vehicle
      </button>
    </div>
  );
};

export default VehicleRegistration;
