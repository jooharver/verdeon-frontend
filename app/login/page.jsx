// app/login/page.jsx

'use client';

import Image from 'next/image';
import styles from './Login.module.css';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <div className={styles.loadingDot}></div>
            <div className={styles.loadingDot}></div>
            <div className={styles.loadingDot}></div>
            <div className={styles.loadingDot}></div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <Image src="/images/logo-verdeon.png" alt="Logo" className={styles.logo} width={150} height={150}/>
          </div>
          <h1 className={styles.title}>Sign in</h1>

          <button 
            className={styles.googleButton} 
            disabled={isLoading}
          >
            <Image src="/images/google-icon.png" alt="Google" className={styles.googleIcon} width={50} height={50}/>
            Continue with Google
          </button>

          <div className={styles.divider}>
            <span>Login</span>
          </div>

          <form className={styles.form}>
            <label className={styles.label}>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@example.com"
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
            <button type="submit" className={styles.button} disabled>
              Continue
            </button>
          </form>
          <p className={styles.footerText}>
            Don’t have an account? <a href="/register">Sign up</a>
          </p>
        </div>
      </div>
    </>
  );
}