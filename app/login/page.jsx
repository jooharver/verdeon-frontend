// app/login/page.jsx

'use client';

import Image from 'next/image';
import styles from './Login.module.css';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation'; // Untuk redirect

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Inisialisasi router

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Fungsi untuk handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          title: 'Login Berhasil!',
          text: 'Anda akan diarahkan ke home.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        // <-- PERBAIKAN BUG: Diubah dari data.token menjadi data.access_token
        if (data.access_token) { 
          localStorage.setItem('authToken', data.access_token);
        }
        
        setTimeout(() => {
          sessionStorage.setItem('playHomeAnimation', 'true');
          window.location.replace('/home');
        }, 2000);

      } else {
        Swal.fire({
          title: 'Login Gagal!',
          text: data.message || 'Email atau password yang Anda masukkan salah.',
          icon: 'error',
          confirmButtonText: 'Coba Lagi',
        });
      }
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
          {/* ... (loading dots) ... */}
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <Image src="/images/logo-verdeon.png" alt="Logo" className={styles.logo} width={150} height={150}/>
          </div>
          <h1 className={styles.title}>Sign in</h1>

          {/* ====================================================== */}
          {/* 🚀 PERBAIKAN UTAMA DI SINI 🚀 */}
          {/* Diubah dari <button> menjadi <a> (link) */}
          {/* ====================================================== */}
          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className={styles.googleButton} 
            // Tambahkan style ini untuk 'menonaktifkan' link saat loading
            style={{ pointerEvents: isLoading ? 'none' : 'auto', opacity: isLoading ? 0.7 : 1 }}
          >
            <Image src="/images/google-icon.png" alt="Google" className={styles.googleIcon} width={50} height={50}/>
            Continue with Google
          </a>
          {/* ====================================================== */}

          <div className={styles.divider}>
            <span>Login</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {/* ... (sisa form-mu sudah benar) ... */}
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
            Don’t have an account? <a href="/register">Register</a>
          </p>
        </div>
      </div>
    </>
  );
}