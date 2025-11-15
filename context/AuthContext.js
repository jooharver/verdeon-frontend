// context/AuthContext.js

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
  
  // --- 🚀 PERUBAHAN DI SINI 🚀 ---
  // 1. Tambahkan state baru untuk menandai proses logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // --- AKHIR PERUBAHAN ---

  // 2. STABILKAN FUNGSI 'logout' DENGAN 'useCallback'
  const logout = useCallback(() => {
    // --- 🚀 PERUBAHAN DI SINI 🚀 ---
    // 2. Set state 'isLoggingOut' jadi true
    setIsLoggingOut(true); 
    // --- AKHIR PERUBAHAN ---

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

  // 6. BUAT FUNGSI BARU 'updateTheme'
  const updateTheme = useCallback(async (newTheme) => {
    // Cek apakah user ada
    if (!user || !token) {
      console.error('Tidak bisa update tema, user tidak login.');
      return;
    }

    const oldUser = user;

    // Optimistic Update: Update state lokal dulu agar UI instan
    setUser((prevUser) => ({
      ...prevUser,
      theme: newTheme,
    }));

    try {
      // Kirim request PATCH ke backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          theme: newTheme, // DTO-mu sudah siap menerima ini
        }),
      });

      // Jika gagal, kembalikan ke state lama (rollback)
      if (!res.ok) {
        console.error('Gagal menyimpan tema ke database.');
        setUser(oldUser); // Rollback
      }
      
    } catch (error) {
      console.error('Error saat update tema:', error);
      setUser(oldUser); // Rollback
    }
  }, [user, token]); // Dependensi: user dan token

  // 7. Sediakan value ke semua children
  const value = {
    user,
    token,
    login, // Sekarang stabil
    logout, // Sekarang stabil
    isLoading,
    updateTheme, // <-- Tambahkan fungsi baru ke 'value'
    // --- 🚀 PERUBAHAN DI SINI 🚀 ---
    // 3. Sediakan state 'isLoggingOut' ke provider
    isLoggingOut,
    // --- AKHIR PERUBAHAN ---
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