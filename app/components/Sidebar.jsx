// components/Sidebar.jsx
'use client'; 

import Link from 'next/link';
import Image from 'next/image'; // <-- 1. Import Image
import { usePathname } from 'next/navigation';
import { useState } from 'react'; 
import styles from './Sidebar.module.css';
// 2. Import ikon baru
import { 
  FaHome, FaBriefcase, FaListAlt, FaLeaf, FaChartPie, FaUser, 
  FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';

// 3. Map ikon baru
const iconMap = {
  '/': <FaHome />,
  '/my-project': <FaBriefcase />,
  '/list-project': <FaListAlt />,
  '/carbon-market': <FaLeaf />,
  '/portfolio': <FaChartPie />,
  '/account': <FaUser />,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false); 

  // 4. navItems baru
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/my-project', label: 'My Project' },
    { href: '/list-project', label: 'List Project' },
    { href: '/carbon-market', label: 'Carbon Market' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/account', label: 'Account' },
  ];

  // 5. Logika 'isActive' disesuaikan untuk 'Home'
  const isActive = (href) => {
    // Logika khusus untuk 'Home' agar tidak aktif di semua halaman
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      
      {/* Tombol Toggle (tidak berubah) */}
      <button 
        className={styles.toggleButton} 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {/* 6. Logo Container Diperbarui */}
      <div className={styles.logoContainer}>
        <Image
          src="/images/verdeon-white.png" // Pastikan file ini ada di public/images/
          alt="Verdeon Logo"
          width={32} // Ukuran dari desain baru
          height={32}
          className={styles.logo} // Kita pakai class .logo yang lama
          priority
        />
        {!isCollapsed && (
          <div className={styles.logoText}>
            {/* Judul disesuaikan, subtitle dihapus */}
            <h1 className={styles.logoTitle}>Verdeon</h1>
          </div>
        )}
      </div>

      {/* Container Navigasi */}
      <nav className={styles.navContainer}>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${
                  isActive(item.href) ? styles.active : ''
                }`}
                title={isCollapsed ? item.label : ''}
              >
                {/* 7. Ambil ikon dari map baru */}
                {iconMap[item.href]}
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {/* 8. Separator dan bottomItems (Print) sudah dihapus */}
      </nav>
    </aside>
  );
}