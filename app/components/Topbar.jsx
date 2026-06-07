'use client'; 

import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaSun, FaMoon, FaWallet } from "react-icons/fa"; 
import Link from 'next/link';
import styles from "./Topbar.module.css";
import { useAuth } from "../../context/AuthContext"; 
import { ethers } from "ethers";
import Swal from 'sweetalert2'; // 👉 NEW: Tambahkan SweetAlert untuk notifikasi error

const capitalizeRole = (role) => {
  if (!role) return "User"; 
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const Topbar = ({ title, breadcrumbs = [] }) => {
  const { user, isLoading, logout, updateTheme } = useAuth();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- STATE WEB3 ---
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // 👉 FIX 1: SYNC DOMPET DARI DATABASE
  // Jadikan user.wallet_address sebagai "Single Source of Truth"
  useEffect(() => {
    if (user?.wallet_address) {
      setWalletAddress(user.wallet_address);
    }
  }, [user]);

  // 👉 FIX 2: PANTAU PERUBAHAN AKUN DI METAMASK SECARA REAL-TIME
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          const activeAcc = accounts[0];
          // Jika user ganti akun MetaMask dan tidak cocok dengan database, beri peringatan!
          if (user?.wallet_address && activeAcc.toLowerCase() !== user.wallet_address.toLowerCase()) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'warning',
              title: 'Dompet Tidak Sesuai!',
              text: `Harap ganti dompet MetaMask kembali ke ${formatAddress(user.wallet_address)}`,
              showConfirmButton: false,
              timer: 5000
            });
          }
        }
      };

      // Daftarkan listener
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Cleanup listener saat komponen unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Helper untuk mempersingkat alamat dompet
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  };

  // --- FUNGSI CONNECT WALLET (DIPERKETAT) ---
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const activeAccount = accounts[0];

        // 👉 FIX 3: VALIDASI SILANG WEB2 vs WEB3
        if (user?.wallet_address && activeAccount.toLowerCase() !== user.wallet_address.toLowerCase()) {
          Swal.fire(
            'Akses Ditolak', 
            `Dompet MetaMask yang sedang aktif (${formatAddress(activeAccount)}) berbeda dengan data profil Admin Anda (${formatAddress(user.wallet_address)}). Silakan buka ekstensi MetaMask dan ganti akun!`, 
            'error'
          );
          return; // Hentikan proses jika dompet salah
        }

        setWalletAddress(activeAccount);
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Wallet tersinkron dengan Blockchain!',
          showConfirmButton: false,
          timer: 2000
        });

      } catch (error) {
        console.error("Gagal koneksi ke MetaMask:", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      Swal.fire('Error', 'Tolong install ekstensi MetaMask di browser kamu untuk menggunakan fitur Web3!', 'error');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false); 
    setWalletAddress("");
    logout(); 
  };

  const handleThemeToggle = () => {
    if (!user) return; 
    const newTheme = user.theme === 'dark' ? 'light' : 'dark';
    updateTheme(newTheme);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.breadcrumb}>
          {breadcrumbs.join(" > ")}
        </span>
      </div>

      <div className={styles.right}>

        {/* --- TOMBOL CONNECT WALLET (HANYA UNTUK ADMIN) --- */}
        {!isLoading && user && user.role === 'admin' && (
          <button 
            className={`${styles.walletButton} ${walletAddress ? styles.walletConnected : ''}`} 
            onClick={connectWallet}
            disabled={isConnecting}
          >
            <FaWallet />
            <span>
              {isConnecting ? "Connecting..." : (walletAddress ? formatAddress(walletAddress) : "Connect Wallet")}
            </span>
          </button>
        )}

        {/* Switch Tema */}
        {!isLoading && user && user.theme && (
          <label className={styles.themeSwitch}>
            <input 
              type="checkbox"
              className={styles.switchInput}
              onChange={handleThemeToggle}
              checked={user.theme === 'dark'} 
            />
            <span className={styles.switchSlider}>
              <span className={styles.switchIcon}>
                {user.theme === 'dark' ? <FaMoon /> : <FaSun />}
              </span>
            </span>
          </label>
        )}
      
        <FaBell className={styles.icon} />
        
        {isLoading || !user ? (
          <div className={styles.profilePlaceholder}>
            <div className={styles.profileAvatar} style={{ background: '#eee' }} />
            <div>
              <p className={styles.name}>Loading...</p>
              <p className={styles.role}>...</p>
            </div>
          </div>
        ) : (
          <div className={styles.profileContainer} ref={dropdownRef}>
            <button 
              className={styles.profileButton} 
              onClick={() => setIsDropdownOpen(prev => !prev)}
            >
              <img
                src={user.avatarUrl ? user.avatarUrl : "/images/default-avatar.png"} 
                alt={user.name} 
                className={styles.profileAvatar}
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = "/images/default-avatar.png"; }}
              />
              <div>
                <p className={styles.name}>{user.name}</p>
                <p className={styles.role}>{capitalizeRole(user.role)}</p>
              </div>
            </button>

            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <Link 
                  href="/account" 
                  className={styles.dropdownItem}
                  onClick={() => setIsDropdownOpen(false)} 
                >
                  Akun Saya
                </Link>
                <button 
                  onClick={handleLogout} 
                  className={styles.dropdownItem}
                >
                  Ganti Akun
                </button>
                <button 
                  onClick={handleLogout} 
                  className={`${styles.dropdownItem} ${styles.logoutButton}`}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;