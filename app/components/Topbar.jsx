// components/Topbar.jsx

import React from "react";
import { FaBell } from "react-icons/fa"; // <-- 1. FaSearch dihapus
import Link from 'next/link'; // <-- 2. Tambahkan import Link
import styles from "./Topbar.module.css";

const Topbar = ({ title, breadcrumbs = [] }) => {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.breadcrumb}>
          {breadcrumbs.join(" > ")}
        </span>
      </div>

      <div className={styles.right}>
        {/* 3. Ikon Search sudah dihapus dari sini */}
        <FaBell className={styles.icon} />
        
        {/* 4. Mengubah 'div' profile menjadi 'Link' agar bisa diklik */}
        <Link href="/account" className={styles.profile}>
          <img
            src="/images/default-avatar.png" // Nanti bisa diganti dengan data user
            alt="profile"
            className={styles.profileAvatar} // Ganti class agar lebih spesifik
          />
          <div>
            <p className={styles.name}>Michael</p>
            <p className={styles.role}>Stakeholder</p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;