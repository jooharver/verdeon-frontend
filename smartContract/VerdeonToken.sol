// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract VerdeonToken is ERC20, Ownable {
    using ECDSA for bytes32;

    // Dompet publik server Laravel yang akan memvalidasi signature
    address public backendSigner;

    // Mencegah pencetakan ganda sekaligus menjadi pelindung Replay Attack
    mapping(uint256 => bool) public isProjectMinted;

    event CarbonTokensMinted(address indexed issuerWallet, uint256 indexed projectId, string projectName, uint256 amount);
    event BackendSignerUpdated(address oldSigner, address newSigner);

    // Tambahkan parameter backendSigner di constructor saat deploy
    constructor(address _backendSigner) ERC20("Verdeon Carbon Token", "VCT") Ownable(msg.sender) {
        require(_backendSigner != address(0), "Error: Signer tidak boleh address 0");
        backendSigner = _backendSigner;
    }

    // Fungsi darurat jika private key server bocor, Admin bisa mengganti alamat signer
    function setBackendSigner(address _newSigner) public onlyOwner {
        require(_newSigner != address(0), "Error: Signer tidak boleh address 0");
        address oldSigner = backendSigner;
        backendSigner = _newSigner;
        emit BackendSignerUpdated(oldSigner, _newSigner);
    }

    /**
     * @dev Mencetak token dengan lapisan keamanan ECDSA
     * Parameter 'signature' di-generate dari Laravel Backend
     */
    function mintCarbonTokens(
        address issuerWallet, 
        uint256 projectId, 
        string memory projectName, 
        uint256 amount,
        bytes memory signature
    ) public onlyOwner {
        require(issuerWallet != address(0), "Error: Alamat dompet issuer tidak valid");
        require(amount > 0, "Error: Jumlah token harus lebih besar dari 0");
        
        // Safeguard utama! Menolak eksekusi ulang (Replay) dari ID yang sama
        require(!isProjectMinted[projectId], "Error: Token VCT untuk Project ID ini sudah dicetak!");

        // ==========================================
        //  ECDSA VERIFICATION LOGIC 
        // ==========================================
        
        // 1. Rangkai ulang pesan (Hash) persis seperti yang dibuat di Laravel
        bytes32 messageHash = keccak256(abi.encodePacked(issuerWallet, projectId, amount));

        // 2. Ubah format menjadi "Ethereum Signed Message" untuk standar keamanan
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        // 3. Ekstrak public address dari signature
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);

        // 4. Validasi! Pastikan yang tanda tangan adalah server Laravel
        require(recoveredSigner == backendSigner, "Error: Digital Signature tidak valid! Data dimanipulasi.");

        // ==========================================

        // Kunci Project ID agar tidak bisa dicetak lagi
        isProjectMinted[projectId] = true;

        // Eksekusi pencetakan token
        _mint(issuerWallet, amount);
        emit CarbonTokensMinted(issuerWallet, projectId, projectName, amount);
    }

    function checkProjectMintedStatus(uint256 projectId) public view returns (bool) {
        return isProjectMinted[projectId];
    }
}