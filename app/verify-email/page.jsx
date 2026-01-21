'use client';

// Impor useRef
import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
// Pastikan path CSS ini benar
import styles from './VerifyEmail.module.css'; 

// 1. Komponen inti yang akan membaca token
function VerifyEmailComponent() {
  const [message, setMessage] = useState('Sedang memverifikasi email Anda...');
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'

  // Gunakan useRef untuk 'gate' agar useEffect tidak berjalan dua kali
  // useRef tidak memicu re-render saat diubah.
  const hasAttempted = useRef(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    // Cek 'gate' .current. 
    // Jika true, berarti sudah pernah dijalankan, JANGAN LANJUT.
    if (hasAttempted.current) {
      return; 
    }

    if (!token) {
      setMessage('Token tidak ditemukan. Link tidak valid.');
      setStatus('error');
      hasAttempted.current = true; // Tandai sudah attempt
      return;
    }

    const verifyToken = async () => {
      // Tutup 'gate' SEGERA. 
      // Panggilan useEffect kedua (jika ada) akan gagal di 'if' di atas.
      hasAttempted.current = true;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await res.json();

        if (res.ok) {
          // Logika Sukses (Ini yang seharusnya berjalan)
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
            router.push('/login');
          });

        } else {
          // Logika Error (Ini yang sebelumnya salah tampil)
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

    // Panggil fungsi verifikasi
    verifyToken();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]); // Hapus 'hasAttempted' dari dependency array

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