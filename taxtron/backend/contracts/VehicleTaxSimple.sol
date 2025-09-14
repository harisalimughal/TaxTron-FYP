// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VehicleTaxSimple {
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
    
    // Simple mappings
    mapping(string => mapping(uint256 => TaxPayment)) public taxPayments; // inspectionId => year => payment
    mapping(string => uint256[]) public paidYears; // inspectionId => paid years array
    
    // Events
    event TaxPaid(
        string indexed inspectionId,
        address indexed payer,
        uint256 amount,
        uint256 year,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(address _treasury) {
        require(_treasury != address(0), "Treasury address cannot be zero");
        owner = msg.sender;
        treasury = _treasury;
    }
    
    // Pay annual tax
    function payAnnualTax(
        string memory _inspectionId,
        uint256 _taxAmount,
        uint256 _year
    ) external payable {
        require(bytes(_inspectionId).length > 0, "Invalid inspection ID");
        require(_taxAmount > 0, "Tax amount must be greater than 0");
        require(msg.value >= _taxAmount, "Insufficient payment amount");
        require(_year >= 2025, "Cannot pay tax for years before 2025");
        
        // Check if already paid
        require(!taxPayments[_inspectionId][_year].isPaid, "Tax already paid for this year");
        
        // Record payment
        taxPayments[_inspectionId][_year] = TaxPayment({
            inspectionId: _inspectionId,
            payer: msg.sender,
            amount: _taxAmount,
            year: _year,
            timestamp: block.timestamp,
            transactionHash: "",
            isPaid: true
        });
        
        // Add year to paid years array
        paidYears[_inspectionId].push(_year);
        
        // Transfer to treasury
        payable(treasury).transfer(_taxAmount);
        
        // Refund excess if any
        if (msg.value > _taxAmount) {
            payable(msg.sender).transfer(msg.value - _taxAmount);
        }
        
        emit TaxPaid(_inspectionId, msg.sender, _taxAmount, _year, block.timestamp);
    }
    
    // Update transaction hash
    function updateTransactionHash(
        string memory _inspectionId,
        uint256 _year,
        string memory _txHash
    ) external onlyOwner {
        require(taxPayments[_inspectionId][_year].isPaid, "Tax not paid for this year");
        taxPayments[_inspectionId][_year].transactionHash = _txHash;
    }
    
    // Check if tax is paid for a specific year
    function isTaxPaid(string memory _inspectionId, uint256 _year) 
        external 
        view 
        returns (bool) 
    {
        return taxPayments[_inspectionId][_year].isPaid;
    }
    
    // Get tax payment details
    function getTaxPayment(string memory _inspectionId, uint256 _year) 
        external 
        view 
        returns (
            address payer,
            uint256 amount,
            uint256 timestamp,
            string memory transactionHash,
            bool isPaid
        ) 
    {
        TaxPayment memory payment = taxPayments[_inspectionId][_year];
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
        returns (uint256[] memory) 
    {
        return paidYears[_inspectionId];
    }
    
    // Owner functions
    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Treasury address cannot be zero");
        treasury = _newTreasury;
    }
    
    // Emergency withdraw
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Transfer ownership
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}
