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
  
  const { user, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (isLoggingOut) {
          return; 
        }

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
  }, [user, isLoading, router, isLoggingOut]); 

  // --- 🚀 PERBAIKAN TYPESCRIPT DI SINI 🚀 ---
  useEffect(() => {
    // Kita "paksa" TypeScript mengenali currentUser memiliki properti bebas
    // untuk menghindari error 'never' saat proses build di Vercel.
    const currentUser = user as any;

    if (currentUser && currentUser.theme) {
      const root = document.documentElement; 
      root.classList.remove('light', 'dark');
      root.classList.add(currentUser.theme);
    }
  }, [user]);
  // --- AKHIR PERBAIKAN ---

  if (isLoading || !user) {
    return null; 
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}