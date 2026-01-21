'use client'; 

// 1. Impor FaSun dan FaMoon
import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaSun, FaMoon } from "react-icons/fa"; 
import Link from 'next/link';
import styles from "./Topbar.module.css";
import { useAuth } from "../../context/AuthContext"; 

const capitalizeRole = (role) => {
  if (!role) return "User"; 
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const Topbar = ({ title, breadcrumbs = [] }) => {
  // 2. Ambil 'updateTheme' dari useAuth
  const { user, isLoading, logout, updateTheme } = useAuth();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Logika untuk menutup dropdown (Tidak berubah)
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

  // Handler untuk Logout (Tidak berubah)
  const handleLogout = () => {
    setIsDropdownOpen(false); 
    logout(); 
  };

  // 3. Buat fungsi untuk toggle tema
  const handleThemeToggle = () => {
    if (!user) return; // Guard clause jika user belum ada
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

        {/* 4. TAMBAHKAN TOMBOL TEMA BARU DI SINI */}
        {/* Tampil hanya jika user sudah loading & punya data tema */}
        {/*           --- ▼▼▼ INI PERUBAHAN UTAMANYA ▼▼▼ ---
          Kita ganti <button> menjadi <label> dengan <input> tersembunyi
        */}
        {!isLoading && user && user.theme && (
          <label className={styles.themeSwitch}>
            <input 
              type="checkbox"
              className={styles.switchInput}
              onChange={handleThemeToggle}
              // 'checked' berarti mode gelap aktif
              checked={user.theme === 'dark'} 
            />
            {/* Ini adalah "track" (rel) dari switch */}
            <span className={styles.switchSlider}>
              {/* Ini adalah "knob" (tombol geser) yang berisi ikon */}
              <span className={styles.switchIcon}>
                {user.theme === 'dark' ? (
                  <FaMoon /> // Saat gelap, ikon di knob adalah matahari
                ) : (
                  <FaSun /> // Saat terang, ikon di knob adalah bulan
                )}
              </span>
            </span>
          </label>
        )}
        {/* --- ▲▲▲ AKHIR DARI PERUBAHAN ▲▲▲ --- */}
      
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
          // --- Container profile + dropdown (Tidak berubah) ---
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

            {/* Dropdown Menu (Tidak berubah) */}
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