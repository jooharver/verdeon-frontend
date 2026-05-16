import { ethers } from 'ethers';
import ProjectABI from './ProjectABI.json';
import TokenABI from './TokenABI.json';

// Contract Address di Polygon Amoy Testnet
export const PROJECT_ADDRESS = "0xEA9fa303E23A6A680D94723828a17CA69E143C58";
export const TOKEN_ADDRESS = "0x652B68a2F68F6cbb6F6e84A3dF056078E2fB60Db";

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
        // Max fee kita set 40 Gwei (Base + Priority)
        maxFeePerGas: ethers.parseUnits("35", "gwei")
    };
};

// ==============================================================
// HELPER TRANSAKSI MRV (Tinggal panggil dari komponen React)
// ==============================================================

/**
 * Mendaftarkan Proyek Baru ke Blockchain (Cetak NFT)
 */
export const submitProjectToBlockchain = async (issuerWallet, tokenURI, version, dataHash) => {
    const { signer } = await connectWallet();
    const contract = getProjectContract(signer);
    
    // 👉 Sisipkan getAmoyGasConfig() di argumen terakhir
    const tx = await contract.mintProject(issuerWallet, tokenURI, version, dataHash, getAmoyGasConfig());
    
    const receipt = await tx.wait();
    return receipt;
};

/**
 * Menambahkan Riwayat Audit / Perubahan Status
 */
export const addTrackingToBlockchain = async (tokenId, version, newStatus, dataHash) => {
    const { signer } = await connectWallet();
    const contract = getProjectContract(signer);
    
    // 👉 Sisipkan getAmoyGasConfig() di argumen terakhir
    const tx = await contract.addTrackingEvent(tokenId, version, newStatus, dataHash, getAmoyGasConfig());
    
    const receipt = await tx.wait();
    return receipt;
};

/**
 * Mencetak Token Karbon berdasarkan hasil Audit
 */
export const mintCarbonTokens = async (issuerWallet, projectId, carbonTons) => {
    const { signer } = await connectWallet();
    const contract = getTokenContract(signer);
    
    // 👉 Sisipkan getAmoyGasConfig() di argumen terakhir
    const tx = await contract.mintCarbonCredits(issuerWallet, projectId, carbonTons, getAmoyGasConfig());
    
    const receipt = await tx.wait();
    return receipt;
};