// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VerdeonToken is ERC20, Ownable {
    
    // Mapping untuk melacak Project ID (Token ID dari NFT) yang sudah pernah mencairkan token
    // Ini krusial agar satu proyek tidak bisa melakukan klaim pencetakan token berkali-kali (Double-Minting Safeguard)
    mapping(uint256 => bool) public isProjectMinted;

    // Event untuk memudahkan indexing riwayat pencetakan di blockchain explorer
    event CarbonTokensMinted(address indexed issuerWallet, uint256 indexed projectId, uint256 amount);

    constructor() ERC20("Voluntary Carbon Token", "VCT") Ownable(msg.sender) {}

    /**
     * @dev Mencetak token VCT ke dompet Issuer setelah proyek divalidasi dan di-listing oleh Admin.
     * @param issuerWallet Alamat dompet milik Issuer yang berhak menerima token karbon.
     * @param projectId ID Proyek (Token ID dari NFT ERC-721) sebagai basis pelacakan aset.
     * @param amount Jumlah token yang dicetak, dikirim dalam format basis Wei (18 desimal dari frontend).
     */
    function mintCarbonTokens(address issuerWallet, uint256 projectId, uint256 amount) public onlyOwner {
        require(issuerWallet != address(0), "Error: Alamat dompet issuer tidak valid (address 0)");
        require(amount > 0, "Error: Jumlah token yang dicetak harus lebih besar dari 0");
        require(!isProjectMinted[projectId], "Error: Token VCT untuk Project ID ini sudah pernah dicetak sebelumnya!");

        // Kunci Project ID agar tidak bisa mengeksekusi fungsi ini lagi
        isProjectMinted[projectId] = true;

        // Eksekusi pencetakan token dari OpenZeppelin ERC20
        _mint(issuerWallet, amount);

        // Emit log transaksi ke dalam blockchain record
        emit CarbonTokensMinted(issuerWallet, projectId, amount);
    }

    /**
     * @dev Fungsi pembantu untuk memeriksa apakah suatu proyek sudah mencairkan token karbonnya atau belum
     */
    function checkProjectMintedStatus(uint256 projectId) public view returns (bool) {
        return isProjectMinted[projectId];
    }
}