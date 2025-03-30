// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract VehicleRegistry {
    struct Vehicle {
        address ownerWallet;
        string ownerName;
        string fatherName;
        string cnic;
        string registrationNumber;
        string engineNumber;
        string chassisNumber;
        string make;
        string model;
        string variant;
        uint256 manufacturingYear;
        uint256 registrationYear;
        string vehicleType;
        string fuelType;
        bool isRegistered;
    }
    
    // Input struct to avoid "stack too deep" error
    struct VehicleInput {
        string ownerName;
        string fatherName;
        string cnic;
        string registrationNumber;
        string engineNumber;
        string chassisNumber;
        string make;
        string model;
        string variant;
        uint256 manufacturingYear;
        uint256 registrationYear;
        string vehicleType;
        string fuelType;
    }
    
    mapping(string => Vehicle) public vehicles;
    
    event VehicleRegistered(string registrationNumber, address ownerWallet);
    event RegistrationAttempt(string registrationNumber, address sender);
    
    function registerVehicle(VehicleInput memory input) public {
        // Log attempt for debugging
        emit RegistrationAttempt(input.registrationNumber, msg.sender);
        
        // Only check if already registered
        require(!vehicles[input.registrationNumber].isRegistered, "Vehicle already registered");
        
        // Create vehicle without additional validations
        vehicles[input.registrationNumber] = Vehicle({
            ownerWallet: msg.sender,
            ownerName: input.ownerName,
            fatherName: input.fatherName,
            cnic: input.cnic,
            registrationNumber: input.registrationNumber,
            engineNumber: input.engineNumber,
            chassisNumber: input.chassisNumber,
            make: input.make,
            model: input.model,
            variant: input.variant,
            manufacturingYear: input.manufacturingYear,
            registrationYear: input.registrationYear,
            vehicleType: input.vehicleType,
            fuelType: input.fuelType,
            isRegistered: true
        });
        
        emit VehicleRegistered(input.registrationNumber, msg.sender);
    }
}