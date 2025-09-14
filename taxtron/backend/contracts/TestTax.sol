// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TestTax {
    address public owner;
    address public treasury;
    
    mapping(string => uint256) public taxAmounts;
    mapping(string => bool) public taxPaid;
    
    event TaxPaid(string inspectionId, uint256 amount, address payer);
    
    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
    }
    
    function payTax(string memory inspectionId, uint256 amount) external payable {
        require(msg.value >= amount, "Insufficient payment");
        require(!taxPaid[inspectionId], "Already paid");
        
        taxAmounts[inspectionId] = amount;
        taxPaid[inspectionId] = true;
        
        payable(treasury).transfer(amount);
        
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        }
        
        emit TaxPaid(inspectionId, amount, msg.sender);
    }
    
    function isTaxPaid(string memory inspectionId) external view returns (bool) {
        return taxPaid[inspectionId];
    }
}
