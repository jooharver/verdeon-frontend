// context/AuthContext.js

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /*
  =====================================================
  FETCH PROFILE (/me)
  =====================================================
  */
  const fetchProfile = useCallback(async (currentToken) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Token invalid');

      const userData = await res.json();

      // Ambil properti 'user' di dalam JSON-nya (jika ada), 
      // atau gunakan userData langsung sebagai fallback
      const finalUser = userData.user || userData; 

      setUser(finalUser); 
      setToken(currentToken);
    } catch (err) {
      console.error('Session invalid:', err);
      localStorage.removeItem('token'); 
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /*
  =====================================================
  AUTO LOGIN (PAGE REFRESH)
  =====================================================
  */
  useEffect(() => {
    const storedToken = localStorage.getItem('token'); 

    if (storedToken) {
      fetchProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  /*
  =====================================================
  LOGIN
  =====================================================
  */
  const login = useCallback(async (newToken, userData) => {
    localStorage.setItem('token', newToken); 

    setToken(newToken);
    setUser(userData);
    setIsLoading(false);

    return userData;
  }, []);

  /*
  =====================================================
  LOGOUT (SANCTUM SAFE)
  =====================================================
  */
  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      const storedToken = localStorage.getItem('token'); 

      if (storedToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${storedToken}`,
            Accept: 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API gagal:', error);
    }

    localStorage.removeItem('token'); 

    setUser(null);
    setToken(null);

    router.push('/login');
  }, [router]);

  /*
  =====================================================
  UPDATE PROFILE
  =====================================================
  */
  const updateProfile = useCallback(async (payload) => {
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Update gagal');

      const updatedUser = await res.json();
      setUser(updatedUser);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  /*
  =====================================================
  👉 NEW: UPDATE WALLET (KHUSUS WEB3)
  =====================================================
  */
  const updateWallet = useCallback(async (walletAddress) => {
    if (!token) throw new Error("No auth token");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ wallet_address: walletAddress }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Gagal menyimpan wallet address ke server.');
    }

    // Jika sukses, perbarui object 'user' di Context agar UI otomatis merender dompet baru
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, wallet_address: walletAddress };
    });

    return data;
  }, [token]);

  /*
  =====================================================
  CONTEXT VALUE
  =====================================================
  */
  const value = {
    user,
    token,
    login,
    logout,
    updateProfile,
    updateWallet, // 👉 Daftarkan fungsi baru di sini
    isLoading,
    isLoggingOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
=====================================================
HOOK
=====================================================
*/
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};