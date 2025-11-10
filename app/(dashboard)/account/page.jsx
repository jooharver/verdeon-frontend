'use client';

import React, { useState, useEffect } from 'react';
import styles from './Account.module.css';
import Image from 'next/image';
import { FaUser, FaCog, FaCopy, FaSignOutAlt } from 'react-icons/fa';
import Topbar from '../../components/Topbar'; // <-- 1. Impor Topbar

export default function AccountPage() {
  // --- 2. Data untuk Topbar ---
  const pageTitle = "Account";
  const pageBreadcrumbs = ["Dashboard", "Account"];
  // --------------------------

  // State untuk mengelola tema
  const [theme, setTheme] = useState('light');

  // Efek untuk menerapkan tema ke tag <html>
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.className = storedTheme; 
  }, []);

  // Fungsi untuk mengganti tema
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };
  
  // Data dummy
  const userData = {
    avatar: '/images/default-avatar.png',
    name: 'Adi Sucipto',
    username: '@adisucipto',
    walletID: '0x23457W7890J98032I987469286',
  };

  // Daftar item settings
  const settingsItems = [
    { label: 'Language' },
    { label: 'Date time' },
    { label: 'Phone' },
    { label: 'Bank Account' },
    { label: 'Call Center' },
    { label: 'Privacy & Policy' },
    { label: 'Information' },
    { label: 'Request Account Deletion' },
    { label: 'Reporting' },
  ];

  return (
    // --- 3. Tambahkan wrapper <div> ---
    <div> 
      
      {/* --- 4. Panggil komponen Topbar --- */}
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container}>
        
        {/* --- KARTU PROFIL AKUN --- */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <FaUser />
            <h3>Account</h3>
          </div>

          <div className={styles.accountContent}>
            <div className={styles.userInfo}>
              <Image 
                src={userData.avatar} 
                alt="Avatar" 
                width={50} 
                height={50} 
                className={styles.avatar}
              />
              <div className={styles.userText}>
                <span className={styles.name}>{userData.name}</span>
                <span className={styles.username}>{userData.username}</span>
              </div>
            </div>

            <div className={styles.walletInfo}>
              <span className={styles.label}>Wallet ID</span>
              <div className={styles.walletIdContainer}>
                <span className={styles.walletId}>{userData.walletID}</span>
                <FaCopy className={styles.copyIcon} />
              </div>
            </div>

            <button className={styles.logoutButton}>
              <span>Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </section>

        {/* --- KARTU PENGATURAN --- */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <FaCog />
            <h3>Settings</h3>
          </div>

          <div className={styles.settingsList}>
            {/* Item Tema (Paling Penting) */}
            <div className={styles.settingsItem}>
              <label htmlFor="theme-select">Theme</label>
              <select 
                id="theme-select" 
                className={styles.themeSelect}
                value={theme}
                onChange={handleThemeChange}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Daftar item settings lainnya */}
            {settingsItems.map((item) => (
              <div key={item.label} className={styles.settingsItem}>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

    </div> // --- 5. Tutup wrapper <div> ---
  );
}