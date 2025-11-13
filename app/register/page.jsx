'use client';

import Image from 'next/image';
import styles from './Register.module.css'; // Tetap menggunakan CSS Modules Anda
import { useState } from 'react';
import Swal from 'sweetalert2'; // Tetap menggunakan SweetAlert2
import { useRouter } from 'next/navigation'; // Tetap menggunakan Next Navigation

export default function RegisterPage() {
  // --- PENAMBAHAN STATE BARU ---
  const [name, setName] = useState('');
  // -----------------------------
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Fungsi untuk handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // --- PENAMBAHAN 'name' PADA BODY ---
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      // ======================================================
      // 🚀 LOGIKA SUCCESS YANG DIPERBAIKI (Sesuai Alur Verifikasi Email) 🚀
      // ======================================================
      if (res.ok) {
        // Alur yang benar: Tampilkan pesan sukses, lalu arahkan ke Login.
        Swal.fire({
          title: 'Registrasi Berhasil!',
          text: data.message, // "Registration successful. Please check your email..."
          icon: 'success',
          // Menampilkan link Ethereal di footer modal (sangat berguna saat dev)
          footer: data.etherealPreviewUrl
            ? `<a href="${data.etherealPreviewUrl}" target="window" style="color: #007bff; text-decoration: underline;">Lihat Email (Ethereal)</a>`
            : 'Silakan periksa kotak masuk email Anda.',
          confirmButtonText: 'Mengerti, Lanjut Login',
          allowOutsideClick: false,
        }).then((result) => {
          // Arahkan ke /login setelah user menekan tombol "OK"
          if (result.isConfirmed) {
            router.push('/login');
          }
        });

      } else {
        // Logika error sudah benar, menggunakan SweetAlert2
        Swal.fire({
          title: 'Register Gagal!',
          text: data.message || 'Data yang Anda masukkan tidak valid.',
          icon: 'error',
          confirmButtonText: 'Coba Lagi',
        });
      }
      // ======================================================
      //           AKHIR DARI LOGIKA YANG DIPERBAIKI
      // ======================================================

    } catch (error) {
      console.error('Terjadi error:', error);
      Swal.fire({
        title: 'Oops...',
        text: 'Tidak dapat terhubung ke server. Coba beberapa saat lagi.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          {/* Anda bisa tambahkan spinner di sini jika mau, misal: */}
           <div className={styles.loadingSpinner}>
             <div className={styles.loadingDot}></div>
             <div className={styles.loadingDot}></div>
             <div className={styles.loadingDot}></div>
           </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <Image src="/images/logo-verdeon.png" alt="Logo" className={styles.logo} width={150} height={150} />
          </div>
          <h1 className={styles.title}>Register</h1>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className={styles.googleButton}
            style={{ pointerEvents: isLoading ? 'none' : 'auto', opacity: isLoading ? 0.7 : 1 }}
          >
            <Image src="/images/google-icon.png" alt="Google" className={styles.googleIcon} width={50} height={50} />
            Continue with Google
          </a>

          <div className={styles.divider}>
            <span>Register</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            
            {/* ====================================================== */}
            {/* 🚀 FIELD 'NAME' BARU DITAMBAHKAN DI SINI 🚀 */}
            {/* ====================================================== */}
            <label className={styles.label}>
              Full Name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Your full name"
                disabled={isLoading}
              />
            </label>
            {/* ====================================================== */}


            <label className={styles.label}>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </label>

            <label className={styles.label}>
              Password
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                >
                  <Image
                    width={50} height={50}
                    src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                    alt={showPassword ? 'Hide password' : 'Show password'}
                    className={styles.eyeIcon}
                  />
                </button>
              </div>
            </label>

            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Continue'}
            </button>
          </form>
          <p className={styles.footerText}>
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </>
  );
}