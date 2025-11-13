'use client';

import { useEffect, Suspense } from 'react'; // <-- TAMBAHKAN Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import styles from './Callback.module.css'; 
// 1. IMPORT "OTAK"-NYA
import { useAuth } from '../../../../context/AuthContext'; // (Sesuaikan path jika perlu)

// 2. Buat komponen terpisah untuk logika
function GoogleCallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 3. Panggil fungsi 'login' dari AuthContext
  const { login } = useAuth(); 

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // --- INI PERUBAHAN UTAMA ---
      // 4. HAPUS SEMUA LOGIKA LAMA (localStorage, Swal, setTimeout, router.push)
      // GANTI DENGAN SATU BARIS INI:
      login(token, '/home');
      //
      // Fungsi 'login' dari AuthContext akan otomatis:
      // 1. Menyimpan token ke localStorage
      // 2. Mengambil profil user (GET /auth/me)
      // 3. Menyimpan data user (nama, avatar) ke state global
      // 4. Mendorong Anda ke '/home'
      // --- AKHIR PERUBAHAN ---

    } else if (error) {
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
    
  // Pastikan 'login' ada di dependency array
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

// 5. Bungkus dengan Suspense (Wajib untuk useSearchParams)
export default function GoogleCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleCallbackLogic />
    </Suspense>
  );
}