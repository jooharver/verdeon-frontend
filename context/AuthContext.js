// context/AuthContext.js

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(() => {
    setIsLoggingOut(true); 
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]); 

  // --- 🚀 PERUBAHAN DI SINI 🚀 ---
  // 1. fetchProfile dibuat 'async' dan MENGEMBALIKAN data user
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
        return userData; // <-- Kembalikan data user
      } else {
        console.error('Token tidak valid, melakukan logout.');
        logout(); 
        return null; // <-- Kembalikan null jika gagal
      }
    } catch (error) {
      console.error('Gagal mengambil profil:', error);
      logout(); 
      return null; // <-- Kembalikan null jika error
    } finally {
      setIsLoading(false);
    }
  }, [logout]); // Dibuat ulang hanya jika 'logout' berubah

  // Cek localStorage (useEffect ini sudah benar, tidak perlu diubah)
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]); // Tambahkan fetchProfile sebagai dependency

  // --- 🚀 PERUBAHAN DI SINI 🚀 ---
  // 2. 'login' dibuat 'async', MENGEMBALIKAN data user, dan MENGHAPUS redirectPath
  const login = useCallback(async (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setIsLoading(true); // Set loading true selama proses login
    
    // Panggil fetchProfile dan TUNGGU hasilnya
    const userData = await fetchProfile(newToken); 
    
    // Kembalikan data user agar callback bisa menanganinya
    return userData; 
    
 }, [fetchProfile]); // Dibuat ulang hanya jika fetchProfile berubah

  // 'updateTheme' (Tidak berubah, sudah benar)
  const updateTheme = useCallback(async (newTheme) => {
    if (!user || !token) {
      console.error('Tidak bisa update tema, user tidak login.');
      return;
    }
    const oldUser = user;
    setUser((prevUser) => ({
      ...prevUser,
      theme: newTheme,
    }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          theme: newTheme, 
        }),
      });
      if (!res.ok) {
        console.error('Gagal menyimpan tema ke database.');
        setUser(oldUser); 
      }
    } catch (error) {
      console.error('Error saat update tema:', error);
      setUser(oldUser); 
    }
  }, [user, token]); 

  // Sediakan value ke semua children
  const value = {
    user,
    token,
    login, // Sekarang async dan return user
    logout, 
    isLoading,
    updateTheme,
    isLoggingOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children} 
      {/*         Perubahan: Menghapus '!isLoading &&' di sini.
        Kita biarkan 'isLoading' dikelola di level halaman 
        (seperti di layout guard) agar halaman callback bisa 
        tampil meski isLoading=true.
      */}
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