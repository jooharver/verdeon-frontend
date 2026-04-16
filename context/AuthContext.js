// context/AuthContext.js

'use client';

import React,
{
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/me`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) throw new Error('Token invalid');

      const userData = await res.json();

      setUser(userData);
      setToken(currentToken);

    } catch (err) {

      console.error('Session invalid:', err);
      localStorage.removeItem('authToken');
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

    const storedToken = localStorage.getItem('authToken');

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

    localStorage.setItem('authToken', newToken);

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

      const storedToken = localStorage.getItem('authToken');

      if (storedToken) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/logout`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${storedToken}`,
              Accept: 'application/json',
            },
          }
        );
      }

    } catch (error) {
      console.error('Logout API gagal:', error);
    }

    localStorage.removeItem('authToken');

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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error('Update gagal');

      const updatedUser = await res.json();

      setUser(updatedUser);

    } catch (err) {
      console.error(err);
    }

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