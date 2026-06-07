import { ethers } from 'ethers';
import ProjectABI from './ProjectABI.json';
import TokenABI from './TokenABI.json';

// Contract Address di Polygon Amoy Testnet (Sudah pakai address terbarumu)
export const PROJECT_ADDRESS = "0xa47948F8731Febdf0e9E5309D1fbda7841F4E00D";
export const TOKEN_ADDRESS = "0x7364502992B4DbB729A2d5dcf960BdBd71BBEA99";

// Tambahkan parameter expectedAddress (dompet dari database)
export const connectWallet = async (expectedAddress = null) => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // 1. Minta akses akun standar
            await provider.send("eth_requestAccounts", []);
            let signer = await provider.getSigner(); 
            let activeAddress = await signer.getAddress();

            // 2. FIX UX: Jika dompet MetaMask yang aktif BEDA dengan database, paksa buka pilihan akun
            if (expectedAddress && activeAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
                console.log("Dompet tidak sesuai terdeteksi! Memaksa MetaMask membuka pop-up pemilihan akun...");
                
                // Paksa MetaMask memunculkan kembali jendela pemilihan akun wallet
                await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
                
                // Tarik ulang signer dan address terbaru setelah user memilih akun
                signer = await provider.getSigner();
                activeAddress = await signer.getAddress();
                
                // Validasi akhir jika setelah dipaksa user tetap memilih dompet yang salah
                if (activeAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
                    throw new Error(`MISMATCH_WALLET|Dompet MetaMask Anda saat ini (${activeAddress.substring(0,6)}...) tidak sesuai dengan akun profil Anda (${expectedAddress.substring(0,6)}...). Proses transaksi diblokir.`);
                }
            }

            return { provider, signer, activeAddress };
        } catch (error) {
            console.error("Koneksi MetaMask gagal:", error);
            throw error;
        }
    } else {
        alert("MetaMask belum terinstal!");
        throw new Error("MetaMask tidak ditemukan.");
    }
};

export const forceConnectWallet = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Perintah untuk memaksa pop-up pemilihan akun muncul lagi
            await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
            
            const signer = await provider.getSigner(); 
            return { provider, signer };
        } catch (error) {
            console.error("Koneksi MetaMask dibatalkan:", error);
            throw error;
        }
    } else {
        alert("MetaMask belum terinstal!");
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
        // Minimal Amoy adalah 25 Gwei, kita set 25 Gwei untuk Priority
        maxPriorityFeePerGas: ethers.parseUnits("25", "gwei"),
        // Max fee kita set 35 Gwei (Base + Priority)
        maxFeePerGas: ethers.parseUnits("35", "gwei")
    };
};

// ==============================================================
// 🛠️ NEW: VIEW HELPERS (UNTUK VALIDASI RESUME FRONTEND)
// ==============================================================

/**
 * Mengecek apakah Proyek (NFT) sudah dicetak di Blockchain (Fungsi View - Gratis Gas)
 */
export const checkProjectIsMinted = async (projectId) => {
    if (typeof window === 'undefined' || !window.ethereum) return false;
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = getProjectContract(provider);
        return await contract.isProjectMinted(projectId);
    } catch (error) {
        console.error("Gagal mengecek status minting di blockchain:", error);
        return false;
    }
};

/**
 * Mengambil status tracking terakhir proyek dari Blockchain (Fungsi View - Gratis Gas)
 */
export const checkLatestProjectStatus = async (projectId) => {
    if (typeof window === 'undefined' || !window.ethereum) return "";
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = getProjectContract(provider);
        return await contract.getLatestStatus(projectId);
    } catch (error) {
        console.error("Gagal mengecek status terakhir di blockchain:", error);
        return "";
    }
};

// ==============================================================
// HELPER TRANSAKSI MRV
// ==============================================================

/**
 * Mendaftarkan Proyek Baru ke Blockchain (Cetak NFT)
 */
export const submitProjectToBlockchain = async (
    executorWallet, // Dompet yang mengeksekusi (Admin)
    issuerWallet, 
    projectId, 
    versionNumber, 
    eventName, 
    initialDataHash, 
    initialUri
) => {
    const { signer } = await connectWallet(executorWallet);
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
    executorWallet, // Dompet yang mengeksekusi (Admin / Auditor)
    tokenId, 
    projectId, 
    versionNumber, 
    eventName, 
    newStatus, 
    dataHash, 
    metadataUri
) => {
    const { signer } = await connectWallet(executorWallet);
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
export const mintCarbonTokens = async (
    executorWallet, // Dompet yang mengeksekusi (Admin)
    issuerWallet, 
    projectId, 
    projectName, 
    amountInWei
) => {
    const { signer } = await connectWallet(executorWallet);
    const contract = getTokenContract(signer);
    
    // Sesuai dengan urutan parameter di fungsi mintCarbonTokens VerdeonToken.sol terbaru
    const tx = await contract.mintCarbonTokens(
        issuerWallet, 
        projectId, 
        projectName,
        amountInWei, 
        getAmoyGasConfig()
    );
    
    const receipt = await tx.wait();
    return receipt;
};