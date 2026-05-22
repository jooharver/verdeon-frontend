import { ethers } from 'ethers';
import ProjectABI from './ProjectABI.json';
import TokenABI from './TokenABI.json';

// Contract Address di Polygon Amoy Testnet (👉 PASTIKAN UPDATE DENGAN ADDRESS BARU)
export const PROJECT_ADDRESS = "0xDb6b2035295D0F4a18A88c6ae7f5882551f6b23E";
export const TOKEN_ADDRESS = "0x6FA3de9037C22dE5490e3eA575c00C903cA4a170";

// 1. Fungsi untuk konek ke MetaMask
export const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner(); 
            return { provider, signer };
        } catch (error) {
            console.error("Koneksi MetaMask dibatalkan atau gagal:", error);
            throw error;
        }
    } else {
        alert("MetaMask belum terinstal! Silakan install ekstensi MetaMask di browser Anda.");
        throw new Error("MetaMask tidak ditemukan.");
    }
};

// 2. Fungsi inisiasi Kontrak NFT (Buku Log)
export const getProjectContract = (signerOrProvider) => {
    return new ethers.Contract(PROJECT_ADDRESS, ProjectABI, signerOrProvider);
};

// 3. Fungsi inisiasi Kontrak ERC-20 (Token Karbon)
export const getTokenContract = (signerOrProvider) => {
    return new ethers.Contract(TOKEN_ADDRESS, TokenABI, signerOrProvider);
};

// ==============================================================
// 🔥 FIX GAS LIMIT POLYGON AMOY 🔥
// ==============================================================
// MetaMask sering salah hitung gas di Polygon. Kita set manual ke 30+ Gwei.
const getAmoyGasConfig = () => {
    return {
        // Minimal Amoy adalah 25 Gwei, kita set 30 Gwei agar cepat diproses
        maxPriorityFeePerGas: ethers.parseUnits("25", "gwei"),
        // Max fee kita set 35 Gwei (Base + Priority)
        maxFeePerGas: ethers.parseUnits("35", "gwei")
    };
};

// ==============================================================
// HELPER TRANSAKSI MRV
// ==============================================================

/**
 * Mendaftarkan Proyek Baru ke Blockchain (Cetak NFT)
 */
export const submitProjectToBlockchain = async (
    issuerWallet, 
    projectId, 
    versionNumber, 
    eventName, 
    initialDataHash, 
    initialUri
) => {
    const { signer } = await connectWallet();
    const contract = getProjectContract(signer);
    
    // Sesuai dengan urutan parameter di fungsi mintProject Solidity baru
    const tx = await contract.mintProject(
        issuerWallet, 
        projectId, 
        versionNumber, 
        eventName, 
        initialDataHash, 
        initialUri, 
        getAmoyGasConfig()
    );
    
    const receipt = await tx.wait();
    return receipt;
};

/**
 * Menambahkan Riwayat Audit / Perubahan Status
 */
export const addTrackingToBlockchain = async (
    tokenId, 
    projectId, 
    versionNumber, 
    eventName, 
    newStatus, 
    dataHash, 
    metadataUri
) => {
    const { signer } = await connectWallet();
    const contract = getProjectContract(signer);
    
    // Sesuai dengan urutan parameter di fungsi addTrackingEvent Solidity baru
    const tx = await contract.addTrackingEvent(
        tokenId, 
        projectId, 
        versionNumber, 
        eventName, 
        newStatus, 
        dataHash, 
        metadataUri, 
        getAmoyGasConfig()
    );
    
    const receipt = await tx.wait();
    return receipt;
};

/**
 * Mencetak Token Karbon berdasarkan hasil Audit
 */
export const mintCarbonTokens = async (issuerWallet, projectId, carbonTons) => {
    const { signer } = await connectWallet();
    const contract = getTokenContract(signer);
    
    // Fix: Memanggil fungsi mintCarbonTokens sesuai dengan nama fungsi di VoluntaryCarbonToken.sol
    const tx = await contract.mintCarbonTokens(
        issuerWallet, 
        projectId, 
        carbonTons, 
        getAmoyGasConfig()
    );
    
    const receipt = await tx.wait();
    return receipt;
};