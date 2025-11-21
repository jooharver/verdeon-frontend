// app/login/page.jsx

'use client';

import Image from 'next/image';
import styles from './Login.module.css';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
// 1. Import useAuth dan getDashboardByRole
import { useAuth } from '@/context/AuthContext'; 
import { getDashboardByRole } from '@/lib/utils'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const [isLoading, setIsLoading] = useState(false); <-- HAPUS state lokal ini
  
  const router = useRouter();

  // 2. Ambil fungsi 'login' dan state 'isLoading' dari context
  // Biar loading-nya sinkron dengan proses fetch profil
  const { login, isLoading } = useAuth(); 

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Tidak perlu setIsLoading(true) manual karena kita pakai isLoading dari context nanti
    // Tapi kalau mau pakai state lokal untuk visual button juga boleh.
    
    try {
      // --- STEP A: Login ke API untuk dapat Token ---
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        
        // --- STEP B: Panggil fungsi login dari Context ---
        // Fungsi ini akan: Simpan token, Fetch Profile, dan Return User Data
        // Kita 'await' agar kita dapat data role-nya sebelum redirect
        const user = await login(data.access_token); 

        if (user) {
          Swal.fire({
            title: 'Login Berhasil!',
            text: `Selamat datang, ${user.name}!`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });

          // --- STEP C: Tentukan Tujuan Berdasarkan Role ---
          const destination = getDashboardByRole(user.role);

          // --- STEP D: Redirect ---
          // Gunakan router.push agar lebih smooth (SPA feel)
          // atau window.location.href jika ingin full reload (untuk reset memory)
          setTimeout(() => {
             // Opsional: Animasi home (hanya jika ke home)
             if(destination === '/home') {
                sessionStorage.setItem('playHomeAnimation', 'true');
             }
             router.push(destination);
          }, 1500);

        } else {
           // Jaga-jaga jika token valid tapi gagal fetch profile
           throw new Error("Gagal mengambil data profil user");
        }

      } else {
        // Handle jika password salah
        Swal.fire({
          title: 'Login Gagal!',
          text: data.message || 'Email atau password salah.',
          icon: 'error',
          confirmButtonText: 'Coba Lagi',
        });
      }
    } catch (error) {
      console.error('Terjadi error:', error);
      Swal.fire({
        title: 'Oops...',
        text: 'Terjadi kesalahan sistem.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
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