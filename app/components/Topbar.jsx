'use client'; 

import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaSun, FaMoon, FaWallet } from "react-icons/fa"; 
import Link from 'next/link';
import styles from "./Topbar.module.css";
import { useAuth } from "../../context/AuthContext"; 
// Impor ethers untuk koneksi Web3
import { ethers } from "ethers";

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

  // --- FUNGSI CONNECT WALLET ---
  const connectWallet = async () => {
    // Cek apakah ekstensi MetaMask terpasang di browser
    if (typeof window.ethereum !== "undefined") {
      try {
        setIsConnecting(true);
        // Meminta izin kepada MetaMask untuk connect
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        // Simpan alamat dompet pertama yang terpilih
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error("Gagal koneksi ke MetaMask:", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Tolong install ekstensi MetaMask di browser kamu untuk menggunakan fitur Web3!");
    }
  };

  // Helper untuk mempersingkat alamat dompet (misal: 0x123...ABCD)
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  };

  const handleLogout = () => {
    setIsDropdownOpen(false); 
    // Hapus koneksi wallet saat logout (hanya state lokal)
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