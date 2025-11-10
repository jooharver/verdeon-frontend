// app/(dashboard)/page.tsx
// Ini contoh halaman dashboard utama Anda (di rute '/')

import Topbar from "../components/Topbar"; // Sesuaikan path import
import styles from './page.module.css'; // Buat file CSS untuk halaman ini

export default function DashboardHomePage() {
  
  // Data dinamis untuk Topbar
  const pageTitle = "Dashboard Utama";
  const pageBreadcrumbs = ["Home", "Dashboard"];

  return (
    <div className={styles.pageContainer}>
      
      {/* Topbar diletakkan DI SINI, di dalam layout */}
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs as any} />

      {/* Sisa konten halaman Anda */}
      <div className={styles.contentCard}>
        <h2>Selamat Datang!</h2>
        <p>Ini adalah konten halaman utama dashboard Anda.</p>
      </div>
      
    </div>
  );
}
