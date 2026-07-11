'use client'; 

import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaSun, FaMoon, FaWallet } from "react-icons/fa"; 
import Link from 'next/link';
import styles from "./Topbar.module.css";
import { useAuth } from "../../context/AuthContext"; 
import { ethers } from "ethers";
import Swal from 'sweetalert2';
// 👉 IMPORT PROJECT SERVICE UNTUK MENGAMBIL DATA ASLI
import { projectService } from "../../services/projectService"; // Sesuaikan path jika letak foldernya berbeda

const capitalizeRole = (role) => {
  if (!role) return "User"; 
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

// Fungsi helper untuk menghitung selisih waktu menjadi teks
const timeAgo = (dateString) => {
  if (!dateString) return 'Baru saja';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `${seconds} detik yang lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
};

const Topbar = ({ title, breadcrumbs = [] }) => {
  const { user, isLoading, logout, updateTheme } = useAuth();
  
  // --- STATE DROPDOWN PROFILE ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- STATE & REF UNTUK NOTIFIKASI ---
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // --- STATE WEB3 ---
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // 👉 FETCH DATA NOTIFIKASI ASLI DARI DATABASE
  useEffect(() => {
    if (user && user.role) {
      const fetchNotif = async () => {
        try {
          let notifData = [];
          
          if (user.role === 'admin') {
            // Tarik data proyek untuk admin
            const res = await projectService.getAllProjects();
            const projects = res?.data || res || [];
            
            // Filter proyek yang menunggu verifikasi admin
            const pendingAdmin = projects.filter(p => p.active_version?.status === 'submitted');
            
            notifData = pendingAdmin.map(p => ({
              id: p.id,
              title: `Verifikasi Baru: ${p.active_version?.name || 'Unnamed Project'}`,
              time: timeAgo(p.updated_at),
              link: '/admin/project'
            }));
            
          } else if (user.role === 'auditor') {
            // Tarik data proyek untuk auditor
            const res = await projectService.getAuditorProjects();
            const projects = res?.data || res || [];
            
            // Filter proyek yang menunggu audit lapangan atau direvisi
            const pendingAuditor = projects.filter(p => ['admin_approved', 'returned_to_auditor'].includes(p.active_version?.status));
            
            notifData = pendingAuditor.map(p => ({
              id: p.id,
              title: p.active_version?.status === 'returned_to_auditor'
                ? `Revisi Laporan: ${p.active_version?.name || 'Unnamed Project'}`
                : `Menunggu Audit: ${p.active_version?.name || 'Unnamed Project'}`,
              time: timeAgo(p.updated_at),
              link: '/auditor/review'
            }));
          }
          
          // Urutkan dari yang paling baru dan batasi jumlahnya agar dropdown tidak terlalu berat
          notifData.sort((a, b) => new Date(b.time) - new Date(a.time));
          setNotifications(notifData.slice(0, 10)); // Tampilkan maksimal 10 notifikasi terbaru
          
        } catch (error) {
          console.error("Gagal menarik notifikasi:", error);
        }
      };

      fetchNotif();
      
      // Opsional: Polling setiap 30 detik agar notifikasi selalu update tanpa perlu refresh
      const interval = setInterval(fetchNotif, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sync Dompet
  useEffect(() => {
    if (user?.wallet_address) {
      setWalletAddress(user.wallet_address);
    }
  }, [user]);

  // Pantau Metamask
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          const activeAcc = accounts[0];
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
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [user]);

  // Global Click Outside Listener (Untuk Profile & Notifikasi)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const activeAccount = accounts[0];

        if (user?.wallet_address && activeAccount.toLowerCase() !== user.wallet_address.toLowerCase()) {
          Swal.fire(
            'Akses Ditolak', 
            `Dompet MetaMask yang sedang aktif (${formatAddress(activeAccount)}) berbeda dengan data profil Admin Anda (${formatAddress(user.wallet_address)}). Silakan buka ekstensi MetaMask dan ganti akun!`, 
            'error'
          );
          return; 
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
        {/* Tombol Wallet */}
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
        
        {/* WRAPPER NOTIFIKASI */}
        <div className={styles.notifContainer} ref={notifRef}>
          <div className={styles.bellWrapper} onClick={() => setIsNotifOpen(prev => !prev)}>
            <FaBell className={`${styles.icon} ${notifications.length > 0 ? styles.iconActive : ''}`} />
            {notifications.length > 0 && (
              <span className={styles.notifBadge}>{notifications.length}</span>
            )}
          </div>

          {/* DROPDOWN NOTIFIKASI */}
          {isNotifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>Notifikasi Proyek</div>
              {notifications.length === 0 ? (
                <div className={styles.notifEmpty}>Semua pekerjaan sudah terselesaikan!</div>
              ) : (
                <div className={styles.notifList}>
                  {notifications.map(notif => (
                    <Link 
                      href={notif.link} 
                      className={styles.notifItem} 
                      key={notif.id}
                      onClick={() => setIsNotifOpen(false)} 
                    >
                      <p className={styles.notifTitle}>{notif.title}</p>
                      <p className={styles.notifTime}>{notif.time}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Profile Dropdown */}
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