'use client'; 

// 1. Import hook yang diperlukan
import React, { useState, useRef, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import Link from 'next/link';
import styles from "./Topbar.module.css";
// 2. Pastikan path ini benar (menurut file Anda, harusnya 2 level)
import { useAuth } from "../../context/AuthContext"; 

const capitalizeRole = (role) => {
  if (!role) return "User"; 
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const Topbar = ({ title, breadcrumbs = [] }) => {
  // 3. Ambil 'logout' dari useAuth
  const { user, isLoading, logout } = useAuth();
  
  // 4. State untuk mengontrol dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 5. Ref untuk deteksi "klik di luar"
  const dropdownRef = useRef(null);

  // 6. Logika untuk menutup dropdown jika klik di luar
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

  // 7. Handler untuk Logout (dan Ganti Akun)
  const handleLogout = () => {
    setIsDropdownOpen(false); // Tutup dropdown
    logout(); // Panggil fungsi logout dari context
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
        <FaBell className={styles.icon} />
        
        {isLoading || !user ? (
          // --- Placeholder saat loading (Tidak berubah) ---
          <div className={styles.profilePlaceholder}>
            <div className={styles.profileAvatar} style={{ background: '#eee' }} />
            <div>
              <p className={styles.name}>Loading...</p>
              <p className={styles.role}>...</p>
            </div>
          </div>
        ) : (
          // --- 8. Ini adalah Container baru untuk profile + dropdown ---
          <div className={styles.profileContainer} ref={dropdownRef}>
            {/* 9. Diubah dari <Link> menjadi <button> */}
            <button 
              className={styles.profileButton} 
              onClick={() => setIsDropdownOpen(prev => !prev)} // Toggle dropdown
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

            {/* 10. Dropdown Menu (Muncul kondisional) */}
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <Link 
                  href="/account" 
                  className={styles.dropdownItem}
                  onClick={() => setIsDropdownOpen(false)} // Tutup saat diklik
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