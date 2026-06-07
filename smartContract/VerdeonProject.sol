// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VerdeonProject is ERC721URIStorage, Ownable {

    struct TrackingEvent {
        uint256 projectId;     
        uint256 versionNumber; 
        string eventName;      
        string status;         
        string dataHash;       
        string metadataUri;    
        address actor;         
        uint256 timestamp;     
    }

    mapping(uint256 => TrackingEvent[]) public projectHistory;
    mapping(address => bool) public authorizedTrackers;
    
    // Gembok Status Terakhir untuk mencegah pencatatan ganda
    mapping(uint256 => string) public latestStatus; 

    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorizedTrackers[msg.sender], "Error: Dompet Anda tidak memiliki akses!");
        _;
    }

    constructor() ERC721("Verdeon Carbon Project", "VCP") Ownable(msg.sender) {}

    function setAuthorizedTracker(address _tracker, bool _status) public onlyOwner {
        authorizedTrackers[_tracker] = _status;
    }

    // Fungsi Helper untuk dibaca oleh Frontend
    function isProjectMinted(uint256 projectId) public view returns (bool) {
        return _ownerOf(projectId) != address(0);
    }

    function getLatestStatus(uint256 projectId) public view returns (string memory) {
        return latestStatus[projectId];
    }

    // 1. FUNGSI MINTING (Tx 1 Initial)
    function mintProject(
        address issuerWallet, 
        uint256 projectId,
        uint256 versionNumber,
        string memory eventName,
        string memory initialDataHash,
        string memory initialUri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = projectId;
        
        // Safeguard Bawaan
        require(!isProjectMinted(tokenId), "Error: Project ID ini sudah dicetak di Blockchain!");
        
        _mint(issuerWallet, tokenId);
        _setTokenURI(tokenId, initialUri);

        _addTracking(tokenId, projectId, versionNumber, eventName, "submitted", initialDataHash, initialUri, msg.sender);
        
        // Kunci status terakhir
        latestStatus[projectId] = "submitted"; 

        return tokenId;
    }

    // 2. FUNGSI AUDIT TRAIL (Tx 2 Initial & Tx 1 Listing)
    function addTrackingEvent(
        uint256 tokenId,
        uint256 projectId,
        uint256 versionNumber,
        string memory eventName,
        string memory newStatus, 
        string memory dataHash,
        string memory metadataUri
    ) public onlyAuthorized {
        require(isProjectMinted(tokenId), "Error: Project NFT belum diterbitkan");
        
        // SAFEGUARD ANTI-DOUBLE TRACKING
        require(
            keccak256(abi.encodePacked(latestStatus[projectId])) != keccak256(abi.encodePacked(newStatus)),
            string(abi.encodePacked("Error: Proyek ini sudah berstatus ", newStatus))
        );
        
        _addTracking(tokenId, projectId, versionNumber, eventName, newStatus, dataHash, metadataUri, msg.sender);
        
        // Kunci status terakhir
        latestStatus[projectId] = newStatus;
    }

    function _addTracking(
        uint256 tokenId, uint256 projectId, uint256 versionNumber, string memory eventName,
        string memory status, string memory dataHash, string memory metadataUri, address actor
    ) internal {
        projectHistory[tokenId].push(TrackingEvent({
            projectId: projectId, versionNumber: versionNumber, eventName: eventName,
            status: status, dataHash: dataHash, metadataUri: metadataUri,
            actor: actor, timestamp: block.timestamp
        }));
    }

    function getProjectHistory(uint256 tokenId) public view returns (TrackingEvent[] memory) {
        return projectHistory[tokenId];
    }
}