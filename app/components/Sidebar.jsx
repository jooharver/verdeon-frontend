'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MENU_ITEMS_BY_ROLE } from '@/lib/menuConfig';
import { useState } from 'react';
import styles from './Sidebar.module.css';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 1. Dapatkan role user
  const role = user?.role ?? 'default';

  // 2. Ambil menu sesuai role
  const navItems = MENU_ITEMS_BY_ROLE[role] ?? MENU_ITEMS_BY_ROLE.default;

  // 3. Fungsi untuk cek menu aktif
  const isActive = (path) => pathname.startsWith(path);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>

      {/* tombol collapse */}
      <button 
        className={styles.toggleButton}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <PanelRightClose /> : <PanelRightOpen />}
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
            <li key={item.path}>
              <Link
                href={item.path}
                className={`${styles.navLink} ${isActive(item.path) ? styles.active : ''}`}
              >
                {item.icon}
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
