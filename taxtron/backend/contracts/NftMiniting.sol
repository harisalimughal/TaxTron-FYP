// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VehicleNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from inspection ID to token ID
    mapping(string => uint256) public inspectionToTokenId;
    
    // Mapping from token ID to inspection ID
    mapping(uint256 => string) public tokenIdToInspection;
    
    // Mapping to track if NFT was minted for inspection ID
    mapping(string => bool) public nftMinted;
    
    // Store vehicle data on-chain (optional, for reference)
    struct VehicleInfo {
        string make;
        string model;
        string year;
        string vehicleType;
        string registrationNumber;
        address mintedTo;
        uint256 mintTimestamp;
    }
    
    mapping(string => VehicleInfo) public vehicleInfo;
    
    // Events
    event VehicleNFTMinted(
        uint256 indexed tokenId, 
        string indexed inspectionId, 
        address indexed owner,
        string tokenURI,
        string make,
        string model,
        string registrationNumber
    );
    
    constructor(address initialOwner) ERC721("Vehicle Certificate NFT", "VCNFT") Ownable(initialOwner) {
        _tokenIdCounter = 1; // Start from 1
    }
    
    /**
     * @dev Mint NFT for a vehicle (independent version)
     * @param inspectionId The vehicle inspection ID
     * @param to Address to mint NFT to
     * @param _tokenURI Metadata URI for the NFT
     * @param make Vehicle make (optional, for on-chain storage)
     * @param model Vehicle model (optional, for on-chain storage)
     * @param year Vehicle year (optional, for on-chain storage)
     * @param vehicleType Vehicle type (optional, for on-chain storage)
     * @param registrationNumber Registration number (optional, for on-chain storage)
     */
    function mintVehicleNFT(
        string memory inspectionId,
        address to,
        string memory _tokenURI,
        string memory make,
        string memory model,
        string memory year,
        string memory vehicleType,
        string memory registrationNumber
    ) public returns (uint256) {
        // Basic validation
        require(bytes(inspectionId).length > 0, "Inspection ID cannot be empty");
        require(to != address(0), "Invalid address");
        
        // Check if NFT already minted
        require(!nftMinted[inspectionId], "NFT already minted for this vehicle");
        
        // Mint the NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Update mappings
        inspectionToTokenId[inspectionId] = tokenId;
        tokenIdToInspection[tokenId] = inspectionId;
        nftMinted[inspectionId] = true;
        
        // Store vehicle info on-chain (optional)
        vehicleInfo[inspectionId] = VehicleInfo({
            make: make,
            model: model,
            year: year,
            vehicleType: vehicleType,
            registrationNumber: registrationNumber,
            mintedTo: to,
            mintTimestamp: block.timestamp
        });
        
        emit VehicleNFTMinted(tokenId, inspectionId, to, _tokenURI, make, model, registrationNumber);
        
        return tokenId;
    }
    
    /**
     * @dev Simplified mint function (backward compatibility)
     */
    function mintVehicleNFT(
        string memory inspectionId,
        address to,
        string memory _tokenURI
    ) public returns (uint256) {
        return mintVehicleNFT(inspectionId, to, _tokenURI, "", "", "", "", "");
    }
    
    /**
     * @dev Get token ID for a given inspection ID
     */
    function getTokenIdByInspection(string memory inspectionId) 
        public 
        view 
        returns (uint256) 
    {
        require(nftMinted[inspectionId], "NFT not minted for this inspection");
        return inspectionToTokenId[inspectionId];
    }
    
    /**
     * @dev Get inspection ID for a given token ID
     */
    function getInspectionByTokenId(uint256 tokenId) 
        public 
        view 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenIdToInspection[tokenId];
    }
    
    /**
     * @dev Check if NFT exists for inspection ID
     */
    function nftExistsForInspection(string memory inspectionId) 
        public 
        view 
        returns (bool) 
    {
        return nftMinted[inspectionId];
    }
    
    /**
     * @dev Get vehicle info stored on-chain
     */
    function getVehicleInfo(string memory inspectionId) 
        public 
        view 
        returns (
            string memory make,
            string memory model,
            string memory year,
            string memory vehicleType,
            string memory registrationNumber,
            address mintedTo,
            uint256 mintTimestamp
        ) 
    {
        require(nftMinted[inspectionId], "NFT not minted for this inspection");
        
        VehicleInfo memory info = vehicleInfo[inspectionId];
        return (
            info.make,
            info.model, 
            info.year,
            info.vehicleType,
            info.registrationNumber,
            info.mintedTo,
            info.mintTimestamp
        );
    }
    
    /**
     * @dev Get vehicle details by token ID
     */
    function getVehicleDetailsByTokenId(uint256 tokenId) 
        public 
        view 
        returns (
            string memory make,
            string memory model,
            string memory year,
            string memory vehicleType,
            string memory registrationNumber,
            string memory inspectionId,
            address mintedTo,
            uint256 mintTimestamp
        ) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory inspection = tokenIdToInspection[tokenId];
        VehicleInfo memory info = vehicleInfo[inspection];
        
        return (
            info.make,
            info.model,
            info.year,
            info.vehicleType,
            info.registrationNumber,
            inspection,
            info.mintedTo,
            info.mintTimestamp
        );
    }
    
    /**
     * @dev Get total number of minted NFTs
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1; // Subtract 1 since we start from 1
    }
    
    /**
     * @dev Owner can mint NFT for any vehicle (admin function)
     */
    function adminMintNFT(
        string memory inspectionId,
        address to,
        string memory _tokenURI,
        string memory make,
        string memory model,
        string memory year,
        string memory vehicleType,
        string memory registrationNumber
    ) public onlyOwner returns (uint256) {
        return mintVehicleNFT(inspectionId, to, _tokenURI, make, model, year, vehicleType, registrationNumber);
    }
    
    /**
     * @dev Burn NFT and clean up mappings
     */
    function burnNFT(uint256 tokenId) public {
        require(_ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized to burn");
        
        // Clean up mappings before burning
        string memory inspectionId = tokenIdToInspection[tokenId];
        delete inspectionToTokenId[inspectionId];
        delete tokenIdToInspection[tokenId];
        delete nftMinted[inspectionId];
        delete vehicleInfo[inspectionId];
        
        _burn(tokenId);
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}