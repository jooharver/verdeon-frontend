// app/(dashboard)/layout.tsx

'use client'; // <-- 1. JADIKAN CLIENT COMPONENT

import Sidebar from "../components/Sidebar"; 
import styles from './dashboard.module.css'; 
import { useAuth } from "../../context/AuthContext"; // <-- 2. IMPORT useAuth (sesuaikan path jika perlu)
import { useEffect } from "react"; // <-- 3. IMPORT useEffect

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // 4. AMBIL USER DARI CONTEXT
  const { user } = useAuth();

  // 5. BUAT EFEK UNTUK MENERAPKAN TEMA
  useEffect(() => {
    // Cek jika user ada dan punya properti theme
    if (user && user.theme) {
      const root = document.documentElement; // Ambil tag <html>
      // Hapus tema lama
      root.classList.remove('light', 'dark');
      // Tambahkan tema baru dari database user
      root.classList.add(user.theme);
    }
    // Jika user logout (user=null), efek ini tidak akan menambahkan class
    // dan <html> akan kembali ke default (ditangani oleh CSS-mu)
  }, [user]); // Efek ini berjalan setiap kali 'user' berubah

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        {/* 'children' adalah tempat halaman (page.jsx) Anda akan dirender */}
        {children}
      </main>
    </div>
  );
}