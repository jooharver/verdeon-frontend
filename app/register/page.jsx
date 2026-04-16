'use client';

import Image from 'next/image';
import styles from './Register.module.css';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi Client-side sederhana
    if (password !== passwordConfirmation) {
      return Swal.fire({
        title: 'Error!',
        text: 'Password dan Konfirmasi Password tidak cocok.',
        icon: 'error',
      });
    }

    setIsLoading(true);

    try {
      const data = await AuthService.register(
        name, 
        email, 
        password, 
        passwordConfirmation
      );

      Swal.fire({
        title: 'Registrasi Berhasil!',
        text: data.message || 'Akun Anda telah berhasil dibuat.',
        icon: 'success',
        confirmButtonText: 'Lanjut Login',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/login');
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      Swal.fire({
        title: 'Register Gagal!',
        text: error.message || 'Terjadi kesalahan saat mendaftar.',
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className={styles.loadingOverlay}>
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
                    width={20} height={20}
                    src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                    alt={showPassword ? 'Hide password' : 'Show password'}
                    className={styles.eyeIcon}
                  />
                </button>
              </div>
            </label>

            <label className={styles.label}>
              Confirm Password
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className={styles.input}
                  placeholder="Repeat your password"
                  disabled={isLoading}
                />
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