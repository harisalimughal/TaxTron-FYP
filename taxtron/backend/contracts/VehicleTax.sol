// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VehicleTax {
    address public owner;
    address public treasury;
    
    struct TaxPayment {
        string inspectionId;
        address payer;
        uint256 amount;
        uint256 year;
        uint256 timestamp;
        string transactionHash;
        bool isPaid;
    }
    
    struct VehicleTaxInfo {
        string inspectionId;
        string make;
        string model;
        string vehicleType;
        uint256 engineCapacity;
        uint256 manufacturingYear;
        mapping(uint256 => TaxPayment) yearlyPayments; // year => payment
        uint256[] paidYears;
    }
    
    // Mappings
    mapping(string => VehicleTaxInfo) public vehicleTaxInfo;
    mapping(address => string[]) public ownerVehicles;
    mapping(uint256 => uint256) public yearlyTaxRates; // year => base rate
    
    // Events
    event TaxPaid(
        string indexed inspectionId,
        address indexed payer,
        uint256 amount,
        uint256 year,
        uint256 timestamp
    );
    
    event TaxRateSet(uint256 year, uint256 rate);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier vehicleExists(string memory _inspectionId) {
        require(bytes(vehicleTaxInfo[_inspectionId].inspectionId).length > 0, "Vehicle not registered for tax");
        _;
    }
    
    constructor(address _treasury) {
        require(_treasury != address(0), "Treasury address cannot be zero");
        owner = msg.sender;
        treasury = _treasury;
        
        // Set default tax rates for 2025 (avoid complex calculations in constructor)
        yearlyTaxRates[2025] = 1000; // Base rate in PKR equivalent
    }
    
    // Register vehicle for tax (called when vehicle is first registered)
    function registerVehicleForTax(
        string memory _inspectionId,
        string memory _make,
        string memory _model,
        string memory _vehicleType,
        uint256 _engineCapacity,
        uint256 _manufacturingYear,
        address _vehicleOwner
    ) external onlyOwner {
        require(bytes(vehicleTaxInfo[_inspectionId].inspectionId).length == 0, "Vehicle already registered for tax");
        
        VehicleTaxInfo storage taxInfo = vehicleTaxInfo[_inspectionId];
        taxInfo.inspectionId = _inspectionId;
        taxInfo.make = _make;
        taxInfo.model = _model;
        taxInfo.vehicleType = _vehicleType;
        taxInfo.engineCapacity = _engineCapacity;
        taxInfo.manufacturingYear = _manufacturingYear;
        
        // Add to owner's vehicles
        ownerVehicles[_vehicleOwner].push(_inspectionId);
    }
    
    // Pay annual tax
    function payAnnualTax(
        string memory _inspectionId,
        uint256 _taxAmount,
        uint256 _year
    ) external payable vehicleExists(_inspectionId) {
        require(_year >= getCurrentYear(), "Cannot pay tax for past years");
        require(_taxAmount > 0, "Tax amount must be greater than 0");
        require(msg.value >= _taxAmount, "Insufficient payment amount");
        
        VehicleTaxInfo storage taxInfo = vehicleTaxInfo[_inspectionId];
        TaxPayment storage payment = taxInfo.yearlyPayments[_year];
        
        require(!payment.isPaid, "Tax already paid for this year");
        
        // Record payment
        payment.inspectionId = _inspectionId;
        payment.payer = msg.sender;
        payment.amount = _taxAmount;
        payment.year = _year;
        payment.timestamp = block.timestamp;
        payment.isPaid = true;
        
        // Add year to paid years if not already present
        bool yearExists = false;
        for (uint i = 0; i < taxInfo.paidYears.length; i++) {
            if (taxInfo.paidYears[i] == _year) {
                yearExists = true;
                break;
            }
        }
        if (!yearExists) {
            taxInfo.paidYears.push(_year);
        }
        
        // Transfer to treasury
        payable(treasury).transfer(_taxAmount);
        
        // Refund excess if any
        if (msg.value > _taxAmount) {
            payable(msg.sender).transfer(msg.value - _taxAmount);
        }
        
        emit TaxPaid(_inspectionId, msg.sender, _taxAmount, _year, block.timestamp);
    }
    
    // Update transaction hash (called after payment confirmation)
    function updateTransactionHash(
        string memory _inspectionId,
        uint256 _year,
        string memory _txHash
    ) external onlyOwner vehicleExists(_inspectionId) {
        TaxPayment storage payment = vehicleTaxInfo[_inspectionId].yearlyPayments[_year];
        require(payment.isPaid, "Tax not paid for this year");
        payment.transactionHash = _txHash;
    }
    
    // Check if tax is paid for a specific year
    function isTaxPaid(string memory _inspectionId, uint256 _year) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (bool) 
    {
        return vehicleTaxInfo[_inspectionId].yearlyPayments[_year].isPaid;
    }
    
    // Get tax payment details for a specific year
    function getTaxPayment(string memory _inspectionId, uint256 _year) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (
            address payer,
            uint256 amount,
            uint256 timestamp,
            string memory transactionHash,
            bool isPaid
        ) 
    {
        TaxPayment memory payment = vehicleTaxInfo[_inspectionId].yearlyPayments[_year];
        return (
            payment.payer,
            payment.amount,
            payment.timestamp,
            payment.transactionHash,
            payment.isPaid
        );
    }
    
    // Get all paid years for a vehicle
    function getPaidYears(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (uint256[] memory) 
    {
        return vehicleTaxInfo[_inspectionId].paidYears;
    }
    
    // Get current year
    function getCurrentYear() public view returns (uint256) {
        return (block.timestamp / 365 days) + 1970;
    }
    
    // Owner functions
    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    function setYearlyTaxRate(uint256 _year, uint256 _rate) external onlyOwner {
        yearlyTaxRates[_year] = _rate;
        emit TaxRateSet(_year, _rate);
    }
    
    // Get vehicle tax info
    function getVehicleTaxInfo(string memory _inspectionId) 
        external 
        view 
        vehicleExists(_inspectionId) 
        returns (
            string memory make,
            string memory model,
            string memory vehicleType,
            uint256 engineCapacity,
            uint256 manufacturingYear,
            uint256[] memory paidYears
        ) 
    {
        VehicleTaxInfo storage taxInfo = vehicleTaxInfo[_inspectionId];
        return (
            taxInfo.make,
            taxInfo.model,
            taxInfo.vehicleType,
            taxInfo.engineCapacity,
            taxInfo.manufacturingYear,
            taxInfo.paidYears
        );
    }
    
    // Get all vehicles owned by an address
    function getOwnerVehicles(address _owner) 
        external 
        view 
        returns (string[] memory) 
    {
        return ownerVehicles[_owner];
    }
    
    // Emergency functions
    function withdrawEmergency() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}
