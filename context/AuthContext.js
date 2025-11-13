'use client';

// 1. IMPORT 'useCallback'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 2. STABILKAN FUNGSI 'logout' DENGAN 'useCallback'
  // Fungsi ini sekarang tidak akan pernah berubah referensinya
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]); // Hanya dibuat ulang jika 'router' berubah

  // 3. STABILKAN FUNGSI 'fetchProfile' DENGAN 'useCallback'
  const fetchProfile = useCallback(async (currentToken) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        console.error('Token tidak valid, melakukan logout.');
        logout(); // 'logout' sekarang stabil
      }
    } catch (error) {
      console.error('Gagal mengambil profil:', error);
      logout(); // 'logout' sekarang stabil
    } finally {
      setIsLoading(false);
    }
  }, [logout]); // Dibuat ulang hanya jika 'logout' berubah

  // 4. Cek localStorage (useEffect ini sudah benar, tidak perlu diubah)
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]); // Tambahkan fetchProfile sebagai dependency

  // 5. STABILKAN FUNGSI 'login' DENGAN 'useCallback'
  const login = useCallback((newToken, redirectPath = '/home') => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    // Kita panggil fetchProfile, BUKAN router.push
    // fetchProfile akan menangani data user
    // dan router.push akan ditangani oleh useEffect di bawah
    fetchProfile(newToken); 
    router.push(redirectPath); // Pindahkan router.push ke sini
  }, [fetchProfile, router]); // Dibuat ulang jika fetchProfile/router berubah

  // 6. Sediakan value ke semua children
  const value = {
    user,
    token,
    login, // Sekarang stabil
    logout, // Sekarang stabil
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

// Hook kustom (tidak perlu diubah)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};