// app/(dashboard)/layout.tsx
// PERHATIKAN: TIDAK ADA <Topbar /> DI SINI!

import Sidebar from "../components/Sidebar"; 
import styles from './dashboard.module.css'; 

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        {/* 'children' adalah tempat halaman (page.jsx) Anda akan dirender */}
        {children}
      </main>
    </div>
  );
}