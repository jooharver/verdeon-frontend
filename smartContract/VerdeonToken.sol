// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VerdeonToken is ERC20, Ownable {
    
    // Mapping untuk melacak Project ID (Token ID dari NFT) yang sudah pernah mencairkan token
    // Ini krusial agar satu proyek tidak bisa melakukan klaim pencetakan token berkali-kali (Double-Minting Safeguard)
    mapping(uint256 => bool) public isProjectMinted;

    // Event diperbarui untuk menyertakan 'projectName' agar riwayat di Polygonscan lebih informatif
    event CarbonTokensMinted(address indexed issuerWallet, uint256 indexed projectId, string projectName, uint256 amount);

    // Nama Token dipastikan "Verdeon Carbon Token"
    constructor() ERC20("Verdeon Carbon Token", "VCT") Ownable(msg.sender) {}

    /**
     * @dev Mencetak token VCT ke dompet Issuer setelah proyek divalidasi dan di-listing oleh Admin.
     * @param issuerWallet Alamat dompet milik Issuer yang berhak menerima token karbon.
     * @param projectId ID Proyek (Token ID dari NFT ERC-721) sebagai basis pelacakan aset.
     * @param projectName Nama Proyek yang akan dicatat permanen dalam log riwayat Blockchain.
     * @param amount Jumlah token yang dicetak, dikirim dalam format basis Wei (18 desimal dari frontend).
     */
    function mintCarbonTokens(
        address issuerWallet, 
        uint256 projectId, 
        string memory projectName, 
        uint256 amount
    ) public onlyOwner {
        require(issuerWallet != address(0), "Error: Alamat dompet issuer tidak valid (address 0)");
        require(amount > 0, "Error: Jumlah token yang dicetak harus lebih besar dari 0");
        require(!isProjectMinted[projectId], "Error: Token VCT untuk Project ID ini sudah pernah dicetak sebelumnya!");

        // Kunci Project ID agar tidak bisa mengeksekusi fungsi ini lagi
        isProjectMinted[projectId] = true;

        // Eksekusi pencetakan token dari OpenZeppelin ERC20
        _mint(issuerWallet, amount);

        // Emit log transaksi ke dalam blockchain record beserta Nama Proyek
        emit CarbonTokensMinted(issuerWallet, projectId, projectName, amount);
    }

    /**
     * @dev Fungsi pembantu untuk memeriksa apakah suatu proyek sudah mencairkan token karbonnya atau belum
     */
    function checkProjectMintedStatus(uint256 projectId) public view returns (bool) {
        return isProjectMinted[projectId];
    }
}