'use client';

// Kita butuh Suspense untuk menangani useSearchParams di App Router
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2'; // Menggunakan library yang sudah Anda pakai
import styles from './VerifyEmail.module.css'; // Buat file CSS baru untuk ini

// 1. Komponen inti yang akan membaca token
function VerifyEmailComponent() {
  // State untuk menampilkan pesan ke user
  const [message, setMessage] = useState('Sedang memverifikasi email Anda...');
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'

  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Ambil token dari URL (/?token=...)
  const token = searchParams.get('token');

  useEffect(() => {
    // Jalankan hanya sekali saat komponen dimuat
    if (!token) {
      setMessage('Token tidak ditemukan. Link tidak valid.');
      setStatus('error');
      return;
    }

    const verifyToken = async () => {
      try {
        // 3b. Kirim token ke BACKEND (port 3001)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`, {
          method: 'GET', // Asumsi kita pakai GET
        });

        const data = await res.json();

        if (res.ok) {
          // 4. Backend bilang sukses
          setMessage(data.message || 'Email Anda berhasil diverifikasi!');
          setStatus('success');

          Swal.fire({
            title: 'Verifikasi Berhasil!',
            text: 'Anda sekarang akan diarahkan ke halaman login.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
          }).then(() => {
            // 5. Arahkan ke login
            router.push('/login');
          });

        } else {
          // 4. Backend bilang gagal
          const errorMessage = data.message || 'Verifikasi gagal. Token tidak valid atau kedaluwarsa.';
          setMessage(errorMessage);
          setStatus('error');
          Swal.fire({
            title: 'Verifikasi Gagal',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Kembali',
          });
        }

      } catch (error) {
        console.error('Error verifying email:', error);
        setMessage('Terjadi kesalahan koneksi ke server.');
        setStatus('error');
        Swal.fire('Error', 'Tidak dapat terhubung ke server.', 'error');
      }
    };

    verifyToken();
    
    // Kita nonaktifkan warning lint di bawah ini karena kita HANYA ingin
    // hook ini berjalan SEKALI saat halaman dimuat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]); // Dependency array memastikan ini berjalan saat token berubah

  // Tampilkan UI berdasarkan status
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Status Verifikasi</h1>
        {status === 'loading' && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>{message}</p>
          </div>
        )}
        {status === 'success' && <p className={styles.success}>{message}</p>}
        {status === 'error' && <p className={styles.error}>{message}</p>}
      </div>
    </div>
  );
}

// 2. Halaman utama yang wajib menggunakan <Suspense>
export default function VerifyEmailPage() {
  return (
    // Suspense diperlukan agar useSearchParams() dapat bekerja di App Router
    <Suspense fallback={<div className={styles.container}><div className={styles.spinner}></div></div>}>
      <VerifyEmailComponent />
    </Suspense>
  );
}