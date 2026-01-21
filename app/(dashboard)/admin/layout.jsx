'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getDashboardByRole } from '@/lib/utils';

// Layout ini akan membungkus SEMUA halaman di dalam /admin/...
export default function AdminLayout({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. Tunggu data user selesai loading
    if (isLoading) {
      return; 
    }

    // 2. Jika tidak ada user (belum login)
    if (!user) {
      router.push('/auth/login'); // Lempar ke login
      return;
    }

    // 3. Jika user ADA tapi BUKAN admin
    if (user.role !== 'admin') {
      // Lempar dia ke dashboard-nya sendiri
      const safeDashboard = getDashboardByRole(user.role);
      router.push(safeDashboard);
    }
    
  }, [user, isLoading, router]);

  // Selama loading atau jika user BUKAN admin, jangan render apapun
  if (isLoading || !user || user.role !== 'admin') {
    return <div>Loading...</div>; // Tampilkan layar loading
  }

  // 4. Jika user ADA dan role-nya 'admin', tampilkan halamannya
  return <>{children}</>;
}