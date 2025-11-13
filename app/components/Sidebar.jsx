// components/Sidebar.jsx
'use client'; 

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react'; 
import { PanelRightOpen, PanelRightClose } from 'lucide-react'; // <-- Ikon ini akan kita pakai
import styles from './Sidebar.module.css';
import { 
  FaHome, FaBriefcase, FaListAlt, FaLeaf, FaChartPie, FaUser 
  // <-- FaChevronLeft & FaChevronRight sudah dihapus
} from 'react-icons/fa';

// Map ikon
const iconMap = {
  '/home': <FaHome />,
  '/my-project': <FaBriefcase />,
  '/list-project': <FaListAlt />,
  '/carbon-market': <FaLeaf />,
  '/portfolio': <FaChartPie />,
  '/account': <FaUser />,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false); 

  // navItems
  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/my-project', label: 'My Project' },
    { href: '/list-project', label: 'List Project' },
    { href: '/carbon-market', label: 'Carbon Market' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/account', label: 'Account' },
  ];

  // Logika 'isActive'
  const isActive = (href) => {
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      
      {/* =========================================== */}
      {/* 🚀 PERUBAHAN UTAMA ADA DI TOMBOL INI 🚀 */}
      {/* =========================================== */}
      <button 
        className={styles.toggleButton} 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <PanelRightOpen /> : <PanelRightClose />}
      </button>

      <div className={styles.logoContainer}>
        <Image
          src="/images/verdeon-white.png"
          alt="Verdeon Logo"
          width={32}
          height={32}
          className={styles.logo}
          priority
        />
        {!isCollapsed && (
          <div className={styles.logoText}>
            <h1 className={styles.logoTitle}>Verdeon</h1>
          </div>
        )}
      </div>

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
                {iconMap[item.href]}
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}