// app/(dashboard)/account/page.jsx
'use client';

import React from 'react'; // Hapus useState dan useEffect
import styles from './Account.module.css';
import Image from 'next/image';
import { FaUser, FaCog, FaCopy, FaSignOutAlt } from 'react-icons/fa';
import Topbar from '../../components/Topbar'; // <-- 1. Impor Topbar
import { useAuth } from '../../../context/AuthContext'; // <-- 2. IMPORT useAuth

export default function AccountPage() {
  // --- Data untuk Topbar ---
  const pageTitle = "Account";
  const pageBreadcrumbs = ["Dashboard", "Account"];
  // --------------------------

  // 3. AMBIL DATA & FUNGSI DARI CONTEXT
  const { user, logout, updateTheme } = useAuth();

  // 4. Fungsi untuk mengganti tema (Sekarang memanggil context)
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    updateTheme(newTheme); // Panggil fungsi dari context
  };
  
  // 5. Hapus 'userData' dummy
  
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

  // 6. Tambahkan state loading jika user belum ada
  if (!user) {
    return (
      <div>
        <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
        <main className={styles.container}>
          <p>Loading account data...</p>
        </main>
      </div>
    );
  }

  return (
    <div> 
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
              // 7. Ganti data dummy dengan data 'user' asli
                src={user.avatarUrl || '/images/default-avatar.png'} 
                alt="Avatar" 
                width={50} 
                height={50} 
                className={styles.avatar}
              referrerPolicy="no-referrer" // Penting untuk avatar Google
              />
              <div className={styles.userText}>
                <span className={styles.name}>{user.name}</span>
                <span className={styles.username}>@{user.email.split('@')[0]}</span>
              </div>
            </div>

            <div className={styles.walletInfo}>
              <span className={styles.label}>Wallet ID</span>
              <div className={styles.walletIdContainer}>
              {/* TODO: Ganti ini jika sudah ada di backend */}
                <span className={styles.walletId}>{'0x23457W7890J98032I987469286'}</span>
                <FaCopy className={styles.copyIcon} />
              </div>
            </div>

            {/* 8. Hubungkan tombol Logout ke context */}
            <button className={styles.logoutButton} onClick={logout}>
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
                    // 9. Hubungkan value select ke 'user.theme'
                value={user.theme}
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

    </div> 
  );
}