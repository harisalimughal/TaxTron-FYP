// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VehicleRegistration {
    // Owner of the contract (government authority)
    address public owner;
    
    // Treasury address where fees are collected
    address public treasury;
    
    // Structure to store vehicle information
    struct Vehicle {
        string inspectionId;
        string make;
        string model;
        uint256 year;
        string engineNumber;
        string chassisNumber;
        string vehicleType;
        uint256 engineCapacity;
        string registrationNumber;
        address vehicleOwner;
        uint256 registrationFee;
        bool registrationFeePaid;
        uint256 registrationTimestamp;
        uint256 taxAmount;
        bool taxPaid;
        uint256 taxPaidTimestamp;
        string registrationTxHash;
        string taxTxHash;
        bool isActive;
    }
    
    // Mappings
    mapping(string => Vehicle) public vehicles; // inspectionId => Vehicle
    mapping(address => string[]) public ownerVehicles; // owner => inspectionIds[]
    mapping(string => bool) public registrationNumbers; // track used registration numbers
    
    // Arrays to keep track of all vehicles
    string[] public allInspectionIds;
    
    // Events
    event VehicleRegistered(
        string indexed inspectionId,
        address indexed owner,
        string registrationNumber,
        uint256 registrationFee,
        uint256 timestamp
    );
    
    event TaxPaid(
        string indexed inspectionId,
        address indexed owner,
        uint256 taxAmount,
        uint256 timestamp
    );
    
    event RegistrationNumberUpdated(
        string indexed inspectionId,
        string newRegistrationNumber
    );
    
    event TaxAmountSet(
        string indexed inspectionId,
        uint256 taxAmount
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    modifier vehicleExists(string memory _inspectionId) {
        require(bytes(vehicles[_inspectionId].inspectionId).length > 0, "Vehicle not found");
        _;
    }
    
    modifier onlyVehicleOwner(string memory _inspectionId) {
        require(vehicles[_inspectionId].vehicleOwner == msg.sender, "Only vehicle owner can call this function");
        _;
    }
    
    // Constructor
    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
    }
    
    // Register a new vehicle with registration fee payment
    function registerVehicle(
        string memory _inspectionId,
        string memory _make,
        string memory _model,
        uint256 _year,
        string memory _engineNumber,
        string memory _chassisNumber,
        string memory _vehicleType,
        uint256 _engineCapacity,
        string memory _registrationNumber,
        uint256 _registrationFee,
        string memory _registrationTxHash
    ) external payable {
        require(bytes(_inspectionId).length > 0, "Inspection ID cannot be empty");
        require(bytes(vehicles[_inspectionId].inspectionId).length == 0, "Vehicle already registered");
        require(msg.value >= _registrationFee, "Insufficient registration fee");
        require(!registrationNumbers[_registrationNumber], "Registration number already used");
        
        // Create new vehicle record
        Vehicle memory newVehicle = Vehicle({
            inspectionId: _inspectionId,
            make: _make,
            model: _model,
            year: _year,
            engineNumber: _engineNumber,
            chassisNumber: _chassisNumber,
            vehicleType: _vehicleType,
            engineCapacity: _engineCapacity,
            registrationNumber: _registrationNumber,
            vehicleOwner: msg.sender,
            registrationFee: _registrationFee,
            registrationFeePaid: true,
            registrationTimestamp: block.timestamp,
            taxAmount: 0, // Tax not set initially
            taxPaid: false,
            taxPaidTimestamp: 0,
            registrationTxHash: _registrationTxHash,
            taxTxHash: "",
            isActive: true
        });
        
        // Store vehicle data
        vehicles[_inspectionId] = newVehicle;
        ownerVehicles[msg.sender].push(_inspectionId);
        allInspectionIds.push(_inspectionId);
        registrationNumbers[_registrationNumber] = true;
        
        // Transfer registration fee to treasury
        payable(treasury).transfer(_registrationFee);
        
        // Refund excess payment if any
        if (msg.value > _registrationFee) {
            payable(msg.sender).transfer(msg.value - _registrationFee);
        }
        
        emit VehicleRegistered(_inspectionId, msg.sender, _registrationNumber, _registrationFee, block.timestamp);
    }
    
    // Set tax amount for a vehicle (only owner can set)
    function setTaxAmount(string memory _inspectionId, uint256 _taxAmount) 
        external 
        onlyOwner 
        vehicleExists(_inspectionId) 
    {
        vehicles[_inspectionId].taxAmount = _taxAmount;
        emit TaxAmountSet(_inspectionId, _taxAmount);
    }
    
    // Pay tax for a vehicle
    function payTax(string memory _inspectionId, string memory _taxTxHash) 
        external 
        payable 
        vehicleExists(_inspectionId) 
        onlyVehicleOwner(_inspectionId) 
    {
        Vehicle storage vehicle = vehicles[_inspectionId];
        require(vehicle.taxAmount > 0, "Tax amount not set");
        require(!vehicle.taxPaid, "Tax already paid");
        require(msg.value >= vehicle.taxAmount, "Insufficient tax amount");
        
        // Update tax payment status
        vehicle.taxPaid = true;
        vehicle.taxPaidTimestamp = block.timestamp;
        vehicle.taxTxHash = _taxTxHash;
        
        // Transfer tax to treasury
        payable(treasury).transfer(vehicle.taxAmount);
        
        // Refund excess payment if any
        if (msg.value > vehicle.taxAmount) {
            payable(msg.sender).transfer(msg.value - vehicle.taxAmount);
        }
        
        emit TaxPaid(_inspectionId, msg.sender, vehicle.taxAmount, block.timestamp);
    }
    
    // Get complete vehicle information
    function getVehicle(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (Vehicle memory) 
    {
        return vehicles[_inspectionId];
    }
    
    // Get vehicle by registration number
    function getVehicleByRegistration(string memory _registrationNumber) 
        external 
        view 
        returns (Vehicle memory) 
    {
        require(registrationNumbers[_registrationNumber], "Registration number not found");
        
        // Search through all vehicles to find by registration number
        for (uint i = 0; i < allInspectionIds.length; i++) {
            if (keccak256(bytes(vehicles[allInspectionIds[i]].registrationNumber)) == keccak256(bytes(_registrationNumber))) {
                return vehicles[allInspectionIds[i]];
            }
        }
        revert("Vehicle not found");
    }
    
    // Get all vehicles owned by an address
    function getVehiclesByOwner(address _owner) 
        external 
        view 
        returns (string[] memory) 
    {
        return ownerVehicles[_owner];
    }
    
    // Check if registration fee is paid
    function isRegistrationFeePaid(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (bool) 
    {
        return vehicles[_inspectionId].registrationFeePaid;
    }
    
    // Check if tax is paid
    function isTaxPaid(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (bool) 
    {
        return vehicles[_inspectionId].taxPaid;
    }
    
    // Get tax amount for a vehicle
    function getTaxAmount(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (uint256) 
    {
        return vehicles[_inspectionId].taxAmount;
    }
    
    // Get payment status for a vehicle
    function getPaymentStatus(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (bool registrationPaid, bool taxPaid, uint256 taxAmount) 
    {
        Vehicle memory vehicle = vehicles[_inspectionId];
        return (vehicle.registrationFeePaid, vehicle.taxPaid, vehicle.taxAmount);
    }
    
    // Update registration number (only owner)
    function updateRegistrationNumber(string memory _inspectionId, string memory _newRegistrationNumber) 
        external 
        onlyOwner 
        vehicleExists(_inspectionId) 
    {
        require(!registrationNumbers[_newRegistrationNumber], "Registration number already used");
        
        string memory oldRegistrationNumber = vehicles[_inspectionId].registrationNumber;
        
        // Update registration number
        vehicles[_inspectionId].registrationNumber = _newRegistrationNumber;
        
        // Update mappings
        registrationNumbers[oldRegistrationNumber] = false;
        registrationNumbers[_newRegistrationNumber] = true;
        
        emit RegistrationNumberUpdated(_inspectionId, _newRegistrationNumber);
    }
    
    // Transfer vehicle ownership
    function transferOwnership(string memory _inspectionId, address _newOwner) 
        external 
        vehicleExists(_inspectionId) 
        onlyVehicleOwner(_inspectionId) 
    {
        require(_newOwner != address(0), "Invalid new owner address");
        
        address oldOwner = vehicles[_inspectionId].vehicleOwner;
        vehicles[_inspectionId].vehicleOwner = _newOwner;
        
        // Update owner vehicles mapping
        ownerVehicles[_newOwner].push(_inspectionId);
        
        // Remove from old owner's list
        string[] storage oldOwnerVehicles = ownerVehicles[oldOwner];
        for (uint i = 0; i < oldOwnerVehicles.length; i++) {
            if (keccak256(bytes(oldOwnerVehicles[i])) == keccak256(bytes(_inspectionId))) {
                oldOwnerVehicles[i] = oldOwnerVehicles[oldOwnerVehicles.length - 1];
                oldOwnerVehicles.pop();
                break;
            }
        }
    }
    
    // Get total number of registered vehicles
    function getTotalVehicles() external view returns (uint256) {
        return allInspectionIds.length;
    }
    
    // Emergency functions (only owner)
    function updateTreasury(address _newTreasury) external onlyOwner {
        treasury = _newTreasury;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Deactivate a vehicle (in case of stolen/scrapped)
    function deactivateVehicle(string memory _inspectionId) 
        external 
        onlyOwner 
        vehicleExists(_inspectionId) 
    {
        vehicles[_inspectionId].isActive = false;
    }
    
    // Reactivate a vehicle
    function reactivateVehicle(string memory _inspectionId) 
        external 
        onlyOwner 
        vehicleExists(_inspectionId) 
    {
        vehicles[_inspectionId].isActive = true;
    }
    
    // Check if vehicle is active
    function isVehicleActive(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (bool) 
    {
        return vehicles[_inspectionId].isActive;
    }
  }