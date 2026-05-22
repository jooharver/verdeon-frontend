// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VerdeonProject is ERC721URIStorage, Ownable {
    // VARIABEL AUTO-INCREMENT TELAH DIHAPUS TOTAL UNTUK MENCEGAH CRASH WEB2-WEB3

    // --- STRUKTUR DATA BUKU LOG YANG BERSIH & INFORMATIF ---
    struct TrackingEvent {
        uint256 projectId;     // ID Proyek dari Database Laravel
        uint256 versionNumber; // Nomor urut revisi (1, 2, 3, dst)
        string eventName;      // Deskripsi kejadian (contoh: "Issuer Initial Submission")
        string status;         // Status proyek ("submitted", "admin_approved", dll)
        string dataHash;       // Hash SHA256 dari snapshot data
        string metadataUri;    // URL link menuju snapshot data
        address actor;         // Dompet eksekutor transaksi
        uint256 timestamp;     // Waktu otomatis dari blockchain
    }

    // Mapping untuk menyimpan array riwayat per Token ID
    mapping(uint256 => TrackingEvent[]) public projectHistory;

    // 👉 FIX: Nama Platform menggunakan "Verdeon"
    constructor() ERC721("Verdeon Carbon Project", "VCP") Ownable(msg.sender) {}

    // 1. FUNGSI MINTING
    function mintProject(
        address issuerWallet, 
        uint256 projectId,
        uint256 versionNumber,
        string memory eventName,
        string memory initialDataHash,
        string memory initialUri
    ) public onlyOwner returns (uint256) {
        // Paksa Token ID sama persis dengan Project ID dari Laravel
        uint256 tokenId = projectId;
        
        // Pastikan ID ini belum pernah dicetak sebelumnya
        require(_ownerOf(tokenId) == address(0), "Error: Project ID ini sudah dicetak di Blockchain!");
        
        _mint(issuerWallet, tokenId);
        _setTokenURI(tokenId, initialUri);

        _addTracking(tokenId, projectId, versionNumber, eventName, "submitted", initialDataHash, initialUri, msg.sender);

        return tokenId;
    }

    // 2. FUNGSI AUDIT TRAIL
    function addTrackingEvent(
        uint256 tokenId,
        uint256 projectId,
        uint256 versionNumber,
        string memory eventName,
        string memory newStatus, 
        string memory dataHash,
        string memory metadataUri
    ) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Error: Project NFT belum diterbitkan");
        
        _addTracking(tokenId, projectId, versionNumber, eventName, newStatus, dataHash, metadataUri, msg.sender);
    }

    // Fungsi Internal
    function _addTracking(
        uint256 tokenId,
        uint256 projectId,
        uint256 versionNumber,
        string memory eventName,
        string memory status, 
        string memory dataHash, 
        string memory metadataUri, 
        address actor
    ) internal {
        projectHistory[tokenId].push(TrackingEvent({
            projectId: projectId,
            versionNumber: versionNumber,
            eventName: eventName,
            status: status,
            dataHash: dataHash,
            metadataUri: metadataUri,
            actor: actor,
            timestamp: block.timestamp
        }));
    }

    function getProjectHistory(uint256 tokenId) public view returns (TrackingEvent[] memory) {
        return projectHistory[tokenId];
    }
}