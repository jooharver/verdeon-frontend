'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import styles from './Callback.module.css'; 
import { useAuth } from '../../../../context/AuthContext'; 
// 1. IMPORT HELPER REDIRECT KITA
import { getDashboardByRole } from '../../../../lib/utils'; // (Sesuaikan path jika perlu)

// 2. Buat komponen terpisah untuk logika
function GoogleCallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); 

  useEffect(() => {
    // 3. Buat fungsi async di dalam useEffect
    const processLogin = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (token) {
        // --- 🚀 INI PERUBAHAN UTAMA 🚀 ---
        try {
          // 4. Panggil 'login' dan TUNGGU data user
          const user = await login(token);

          if (user && user.role) {
            // 5. Tentukan path berdasarkan role
            const redirectPath = getDashboardByRole(user.role);
            // 6. Arahkan ke dashboard yang benar
            router.push(redirectPath);
          } else {
            // Handle jika login berhasil tapi data user/role tidak ada
            throw new Error('Gagal mengambil data profil atau role tidak ditemukan.');
          }

        } catch (err) {
          // Tangani error dari proses login atau fetch profile
          Swal.fire({
            title: 'Login Gagal',
            text: err.message || 'Gagal memverifikasi profil Anda.',
            icon: 'error',
          }).then(() => {
            router.push('/login');
          });
        }
        // --- AKHIR PERUBAHAN ---

      } else if (error) {
        // (Logika error ini sudah benar, tidak berubah)
        Swal.fire({
          title: 'Login Gagal',
          text: error || 'Terjadi kesalahan saat login dengan Google.',
          icon: 'error',
        }).then(() => {
          router.push('/login');
        });
      } else {
        router.push('/login');
      }
    };
    
    // 7. Panggil fungsi async
    processLogin();
    
  // Pastikan 'login', 'router', 'searchParams' ada di dependency array
  }, [router, searchParams, login]); 

  // Tampilan loading ini sudah benar
  return (
    <div className={styles.container}>
      <div className={styles.loadingSpinner}>
        <div className={styles.loadingDot}></div>
        <div className={styles.loadingDot}></div>
        <div className={styles.loadingDot}></div>
        <div className={styles.loadingDot}></div>
        <div className={styles.loadingDot}></div>
      </div>
      <h2 className={styles.text}>Memproses login Anda...</h2>
    </div>
  );
}

// (Wrapper Suspense tidak berubah)
export default function GoogleCallback() {
  return (
    <Suspense fallback={<div className={styles.container}><h2 className={styles.text}>Loading...</h2></div>}>
      <GoogleCallbackLogic />
    </Suspense>
  );
}