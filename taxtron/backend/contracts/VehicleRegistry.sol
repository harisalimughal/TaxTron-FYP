// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VehicleRegistry {
    struct Vehicle {
        string ownerName;
        address ownerWallet; // Linked to MetaMask (MetaLogin.jsx)
        string fatherName;
        string cnic;
        string addressDetails;
        string registrationNumber;
        string engineNumber;
        string chassisNumber;
        string make;
        string model;
        string variant;
        string color;
        uint256 manufacturingYear;
        uint256 registrationYear;
        string seatingCapacity;
        string vehicleType;
        string vehicleCategory;
        string fuelType;
        string tokenTaxPaid; // Yes/No (For later tax payment)
        bool isRegistered;
    }

    mapping(string => Vehicle) public vehicles; // registrationNumber -> Vehicle Data

    event VehicleRegistered(string registrationNumber, address ownerWallet);

    function registerVehicle(
        string memory _ownerName,
        string memory _fatherName,
        string memory _cnic,
        string memory _addressDetails,
        string memory _registrationNumber,
        string memory _engineNumber,
        string memory _chassisNumber,
        string memory _make,
        string memory _model,
        string memory _variant,
        string memory _color,
        uint256 _manufacturingYear,
        uint256 _registrationYear,
        string memory _seatingCapacity,
        string memory _vehicleType,
        string memory _vehicleCategory,
        string memory _fuelType
    ) public {
        require(!vehicles[_registrationNumber].isRegistered, "Vehicle already registered");

        vehicles[_registrationNumber] = Vehicle(
            _ownerName,
            msg.sender, // Links the wallet address of the user
            _fatherName,
            _cnic,
            _addressDetails,
            _registrationNumber,
            _engineNumber,
            _chassisNumber,
            _make,
            _model,
            _variant,
            _color,
            _manufacturingYear,
            _registrationYear,
            _seatingCapacity,
            _vehicleType,
            _vehicleCategory,
            _fuelType,
            "No", // Token tax will be paid later
            true
        );

        emit VehicleRegistered(_registrationNumber, msg.sender);
    }

    function getVehicle(string memory _registrationNumber) public view returns (Vehicle memory) {
        require(vehicles[_registrationNumber].isRegistered, "Vehicle not found");
        return vehicles[_registrationNumber];
    }
}
