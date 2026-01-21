'use client';

// Import React dan hooks
import React, { useState, useMemo } from 'react'; 
import Image from 'next/image';
import Topbar from '../../components/Topbar';
import styles from './Portfolio.module.css';

// --- Icon ---
import { 
  FiUser, 
  FiClock, 
  FiCopy, 
  FiArrowLeft, 
  FiArrowRight,
  FiEyeOff,
  FiEye,
  FiSearch,
  FiRefreshCw // Icon Refresh
} from 'react-icons/fi';

// --- DATA DUMMY ---
const portfolioData = {
  name: "Adi Sucipto",
  avatar: "/images/default-avatar.png", 
  tokenSupply: "123,456.78",
  walletID: "0x23457W7890J98032I987469286",
};

const myTokenSupplyProjects = [
  { id: 1, logo: "/images/project-logo-1.png", name: "PT Green Renewable Energy", availableTokens: "2034.8" },
  { id: 2, logo: "/images/project-logo-2.png", name: "PT Energy Jaya Asri", availableTokens: "1702.3" },
  { id: 3, logo: "/images/project-logo-3.png", name: "Pusat Solar Panel Indonesia", availableTokens: "1434.5" },
  { id: 4, logo: "/images/project-logo-1.png", name: "PT Green Renewable Energy", availableTokens: "1500.0" },
];

const allActivities = [
  { id: 1, date: "10 November 2025", dateObj: new Date("2025-11-10T16:40:00"), type: "BUY", projectName: "Solar Panel Green Renewable Energy", projectCode: "PT. GNE", amount: "130", tokenUnit: "Token", details: "Pembelian token carbon credit" },
  { id: 2, date: "10 November 2025", dateObj: new Date("2025-11-10T09:15:00"), type: "SELL", projectName: "Proyek Hijau Chandra Daya Adi Perkasa", projectCode: "CHND", amount: "200", tokenUnit: "Token", details: "Penjualan token kepada investor X" },
  { id: 3, date: "08 November 2025", dateObj: new Date("2025-11-08T12:00:00"), type: "BUY", projectName: "Solar Panel Energi Jaya Kusuma", projectCode: "SPJK", amount: "150", tokenUnit: "Token", details: "Akuisisi token dari pasar sekunder" },
  { id: 4, date: "15 Oktober 2025", dateObj: new Date("2025-10-15T12:30:00"), type: "SELL", projectName: "Solar Panel Energi Jaya Kusuma", projectCode: "SPJK", amount: "100", tokenUnit: "Token", details: "Penjualan parsial token" },
  { id: 5, date: "10 Oktober 2025", dateObj: new Date("2025-10-10T10:00:00"), type: "BUY", projectName: "PT Green Renewable Energy", projectCode: "PT. GNE", amount: "50", tokenUnit: "Token", details: "Pembelian tambahan" },
];
// --- AKHIR DATA DUMMY ---


export default function PortfolioPage() {
  // --- Data untuk Topbar ---
  const pageTitle = "Portfolio";
  const pageBreadcrumbs = ["Dashboard", "Portfolio"];

  // State untuk Portfolio Info
  const [showTokenSupply, setShowTokenSupply] = useState(false);
  const [showWalletID, setShowWalletID] = useState(false);

  // --- STATE UNTUK ACTIVITY ---
  const [activitySearch, setActivitySearch] = useState('');
  const [filterMode, setFilterMode] = useState('Bulan Ini');
  const [selectedMonthYear, setSelectedMonthYear] = useState(''); 
  const [isRefreshing, setIsRefreshing] = useState(false); // <-- STATE REFRESH

  // Fungsi untuk meng-copy Wallet ID
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Wallet ID berhasil disalin!');
    } catch (err) {
      alert('Gagal menyalin Wallet ID.');
    }
  };

  // --- LOGIKA LIST BULAN DI DROPDOWN ---
  const uniqueMonths = useMemo(() => {
    const dates = allActivities.map(act => new Date(act.dateObj.getFullYear(), act.dateObj.getMonth()));
    const uniqueDates = [...new Set(dates.map(d => d.getTime()))].map(time => new Date(time));
    uniqueDates.sort((a, b) => b - a); // Urutkan dari terbaru
    
    return uniqueDates.map(date => ({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, 
      label: date.toLocaleString('id-ID', { month: 'long', year: 'numeric' }) 
    }));
  }, []);

  // --- LOGIKA UTAMA (FILTER & GROUPING) ---
  const groupedActivities = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Filter berdasarkan Search Term
    const searchedActivities = allActivities.filter(act => {
      const searchTerm = activitySearch.toLowerCase();
      return (
        act.projectName.toLowerCase().includes(searchTerm) ||
        act.projectCode.toLowerCase().includes(searchTerm) ||
        act.details.toLowerCase().includes(searchTerm)
      );
    });

    // 2. Filter berdasarkan Waktu (FilterMode)
    const filteredActivities = searchedActivities.filter(act => {
      if (filterMode === 'Semua') return true;
      if (filterMode === 'Bulan Ini') {
        return act.dateObj.getFullYear() === currentYear && act.dateObj.getMonth() === currentMonth;
      }
      if (filterMode === 'Pilih Bulan' && selectedMonthYear) {
        const [year, month] = selectedMonthYear.split('-').map(Number);
        return act.dateObj.getFullYear() === year && act.dateObj.getMonth() === (month - 1);
      }
      if (filterMode === 'Bulan Ini') return false; 
      return true;
    });

    // 3. Grouping berdasarkan Tanggal (string 'date')
    const groups = filteredActivities.reduce((acc, activity) => {
      const dateKey = activity.date; 
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(activity);
      return acc;
    }, {}); 

    return groups;
  }, [activitySearch, filterMode, selectedMonthYear]);

  // Handler untuk <select>
  const handleMonthChange = (e) => {
    const value = e.target.value;
    if (value) {
      setSelectedMonthYear(value);
      setFilterMode('Pilih Bulan');
    } else {
      setFilterMode('Bulan Ini');
      setSelectedMonthYear('');
    }
  };

  // --- FUNGSI REFRESH ---
  const handleRefreshActivity = () => {
    console.log("Memulai refresh data aktivitas...");
    setIsRefreshing(true);
    
    setTimeout(() => {
      console.log("Refresh selesai.");
      setIsRefreshing(false);
    }, 1000);
  };


  // --- RENDER KOMPONEN ---
  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container}>
        {/* 1. Bagian Portfolio Info */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>
              <FiUser className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>Portfolio</h3>
            </div>
          </div>
          <div className={styles.portfolioContent}>
            
            <div className={styles.portfolioInfoItem}>
              <div className={styles.avatarNameGroup}>
                <Image
                  src={portfolioData.avatar}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className={styles.portfolioAvatar}
                />
                <div>
                  <p className={styles.portfolioLabel}>Nama</p>
                  <h4 className={styles.portfolioValue}>{portfolioData.name}</h4>
                </div>
              </div>
            </div>

            <div className={styles.portfolioInfoItem}>
              <p className={styles.portfolioLabel}>Token Supply</p>
              <div className={styles.valueWithToggleButton}>
                <h4 className={styles.portfolioValue}>
                  {showTokenSupply ? portfolioData.tokenSupply : "******"}
                </h4>
                <button 
                  className={styles.toggleVisibilityButton}
                  onClick={() => setShowTokenSupply(!showTokenSupply)}
                >
                  {showTokenSupply ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className={styles.portfolioInfoItem}>
              <p className={styles.portfolioLabel}>Wallet ID</p>
              <div className={styles.valueWithToggleButton}>
                <h4 className={styles.portfolioValue}>
                  {showWalletID ? portfolioData.walletID : "*********************"}
                </h4>
                <button 
                  className={styles.toggleVisibilityButton}
                  onClick={() => setShowWalletID(!showWalletID)}
                >
                  {showWalletID ? <FiEyeOff /> : <FiEye />}
                </button>
                <button 
                  className={styles.copyButton} 
                  onClick={() => copyToClipboard(portfolioData.walletID)}
                  aria-label="Salin Wallet ID"
                >
                  <FiCopy />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 2. Bagian My Token Supply */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>
              <FiClock className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>My Token Supply</h3>
            </div>
          </div>
          <div className={styles.myTokenList}>
            {myTokenSupplyProjects.map((project) => (
              <div key={project.id} className={styles.tokenItem}>
                <div className={styles.tokenItemInfo}>
                  <Image src={project.logo} alt={project.name} width={40} height={40} className={styles.tokenItemLogo} />
                  <span className={styles.tokenItemName}>{project.name}</span>
                </div>
                <div className={styles.tokenItemAmount}>
                  <span className={styles.tokenValue}>{project.availableTokens}</span>
                  <span className={styles.tokenUnit}>Token</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Bagian Activity */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>
              <FiClock className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>Activity</h3>
            </div>
            
            <button 
              className={styles.refreshButton} 
              onClick={handleRefreshActivity}
              disabled={isRefreshing}
              aria-label="Refresh aktivitas"
            >
              <FiRefreshCw className={isRefreshing ? styles.isRefreshing : ''} />
            </button>
          </div>

          <div className={styles.activityControls}>
            <div className={styles.activitySearchBar}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Cari aktivitas (misal: PT. GNE)"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
              />
            </div>
            <div className={styles.filterButtonGroup}>
              <button
                className={`${styles.filterButton} ${
                  filterMode === 'Semua' ? styles.activeFilter : ''
                }`}
                onClick={() => {
                  setFilterMode('Semua');
                  setSelectedMonthYear('');
                }}
              >
                Semua
              </button>
              <button
                className={`${styles.filterButton} ${
                  filterMode === 'Bulan Ini' ? styles.activeFilter : ''
                }`}
                onClick={() => {
                  setFilterMode('Bulan Ini');
                  setSelectedMonthYear('');
                }}
              >
                Bulan Ini
              </button>
              
              <select 
                className={`${styles.monthSelect} ${
                  filterMode === 'Pilih Bulan' ? styles.activeFilterSelect : ''
                }`}
                value={selectedMonthYear}
                onChange={handleMonthChange}
              >
                <option value="">Pilih Bulan...</option>
                {uniqueMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.activityList}>
            {Object.keys(groupedActivities).length > 0 ? (
              Object.entries(groupedActivities).map(([date, activities]) => (
                <div key={date} className={styles.activityCard}>
                  <h4 className={styles.activityCardDate}>{date}</h4>
                  
                  <div className={styles.activityCardContent}>
                    {activities.map((activity) => (
                      <div key={activity.id} className={styles.activityItem}>
                        
                        <div className={styles.activityTime}>
                          {activity.dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        <div className={styles.activityDetails}>
                          <span className={`${styles.activityType} ${styles[activity.type.toLowerCase()]}`}>{activity.type}</span>
                          <p className={styles.activityDescription}>
                            {activity.projectName} (<span className={styles.projectCode}>{activity.projectCode}</span>) - {activity.details}
                          </p>
                        </div>
                        
                        <div className={styles.activityRight}>
                          {/* --- PERUBAHAN DI SINI --- */}
                          <span className={`${styles.activityAmount} ${styles[activity.type.toLowerCase()]}`}>
                            {activity.amount}
                          </span>
                          {/* --- AKHIR PERUBAHAN --- */}
                          <span className={styles.activityTokenUnit}>{activity.tokenUnit}</span>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>Tidak ada aktivitas yang cocok dengan pencarian atau filter Anda.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}