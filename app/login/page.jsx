'use client';

import Image from 'next/image';
import styles from './Login.module.css';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { getDashboardByRole } from '@/lib/utils'; 
import { AuthService } from '@/services/auth.service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  // Mengambil fungsi login dan state isLoading dari Context
  const { login, isLoading } = useAuth(); 

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Panggil AuthService untuk hit API Laravel
      const data = await AuthService.login(email, password);

      // 2. Jika sukses dan mendapatkan token
      if (data.token) {
        // Update state user di AuthContext global
        await login(data.token, data.user); 

        Swal.fire({
          title: 'Login Berhasil!',
          text: `Selamat datang kembali, ${data.user.name}!`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });

        // 3. Tentukan arah redirect berdasarkan role user
        const destination = getDashboardByRole(data.user.role);
        
        setTimeout(() => {
          // Logic khusus jika redirect ke home (opsional)
          if (destination === '/home') {
            sessionStorage.setItem('playHomeAnimation', 'true');
          }
          router.push(destination);
        }, 1500);
      }
    } catch (error) {
      console.error('Login Error:', error);
      Swal.fire({
        title: 'Login Gagal!',
        text: error.message || 'Email atau password salah.',
        icon: 'error',
      });
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
            <Image 
              src="/images/logo-verdeon.png" 
              alt="Logo" 
              className={styles.logo} 
              width={150} 
              height={150}
              priority
            />
          </div>
          <h1 className={styles.title}>Sign in</h1>

          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className={styles.googleButton} 
            style={{ 
              pointerEvents: isLoading ? 'none' : 'auto', 
              opacity: isLoading ? 0.7 : 1 
            }}
          >
            <Image 
              src="/images/google-icon.png" 
              alt="Google" 
              className={styles.googleIcon} 
              width={20} 
              height={20}
            />
            Continue with Google
          </a>

          <div className={styles.divider}>
            <span>atau login manual</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
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
                    width={20} 
                    height={20}
                    src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                    alt={showPassword ? 'Hide password' : 'Show password'}
                    className={styles.eyeIcon}
                  />
                </button>
              </div>
            </label>
            
            <button 
              type="submit" 
              className={styles.button} 
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Continue'}
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