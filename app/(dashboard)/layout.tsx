// app/(dashboard)/layout.tsx
'use client'; 

import Sidebar from "../components/Sidebar"; 
import styles from './dashboard.module.css'; 
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2'; 

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // --- 🚀 PERUBAHAN DI SINI 🚀 ---
  // 1. Ambil 'isLoggingOut' dari context
  const { user, isLoading, isLoggingOut } = useAuth();
  // --- AKHIR PERUBAHAN ---
  
  const router = useRouter();

  // 2. EFEK UNTUK PROTEKSI RUTE (GUARD) - DIMODIFIKASI
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        
        // --- 🚀 PERUBAHAN DI SINI 🚀 ---
        // 2. Cek state 'isLoggingOut'
        if (isLoggingOut) {
          // Ini adalah logout yang disengaja.
          // JANGAN lakukan apa-apa. Biarkan fungsi logout
          // menyelesaikan redirect-nya.
          return; 
        }
        // --- AKHIR PERUBAHAN ---

        // Jika user tidak ada DAN BUKAN proses logout,
        // baru kita tampilkan alert akses ilegal.
        Swal.fire({
          title: 'Akses Ditolak',
          text: 'Anda harus login terlebih dahulu untuk mengakses halaman ini.',
          icon: 'warning',
          confirmButtonText: 'OK, Login',
          timer: 3000,
          timerProgressBar: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          router.push('/login');
        });
      }
    }
    // 3. Tambahkan 'isLoggingOut' ke dependency array
  }, [user, isLoading, router, isLoggingOut]); 

  // Efek untuk Tema (Ini sudah ada dari tugas kita sebelumnya)
  useEffect(() => {
    if (user && user.theme) {
      const root = document.documentElement; 
      root.classList.remove('light', 'dark');
      root.classList.add(user.theme);
    }
  }, [user]);

  // TAMPILKAN 'null' SELAMA LOADING
  // Ini untuk mencegah "flash" halaman dashboard
  // dan agar tidak ada teks "Loading..." di belakang modal.
  if (isLoading || !user) {
    return null; 
  }

  // JIKA LOADING SELESAI DAN USER ADA
  // Baru kita render layout dashboard yang sebenarnya
  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}