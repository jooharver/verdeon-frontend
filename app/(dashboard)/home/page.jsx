'use client';

import styles from './Home.module.css';
import Image from 'next/image';
import Topbar from '../../components/Topbar';

// 1. Impor 'useAuth'
// Path ini (../../) sudah benar untuk keluar dari app/(dashboard)/home/
import { useAuth } from '../../../context/AuthContext'; 

// Impor ikon
import { FiUser, FiTrendingUp, FiList, FiRss, FiCopy, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

export default function HomePage() {
  // Data untuk Topbar
  const pageTitle = "Home";
  const pageBreadcrumbs = ["Dashboard", "Home"]; 
  
  // 2. Panggil hook 'useAuth'
  const { user, isLoading } = useAuth();
  
  // --- DATA DUMMY (Hanya untuk data yang belum kita punya) ---
  const portfolioData = {
    // 'name' dan 'avatar' akan kita ambil dari 'user'
    tokenSupply: "******",
    walletID: "0x23457W7890J98032I987469286",
  };

  // ... (Data dummy trendingProjects, allProjects, newsArticles tidak perlu diubah) ...
  const trendingProjects = [
    { id: 1, logo: "/images/project-logo-1.png", name: "PT Green Renewable Energy", availableTokens: "2034.8" },
    { id: 2, logo: "/images/project-logo-2.png", name: "PT Energy Jaya Asri", availableTokens: "1702.3" },
    { id: 3, logo: "/images/project-logo-3.png", name: "Pusat Solar Panel Indonesia", availableTokens: "1434.5" },
  ];
  const allProjects = [
    { id: 1, logo: "/images/project-logo-1.png", name: "PT Green Renewable Energy", availableTokens: "2034.8" },
    { id: 2, logo: "/images/project-logo-2.png", name: "PT Energy Jaya Asri", availableTokens: "1702.3" },
    { id: 3, logo: "/images/project-logo-3.png", name: "Pusat Solar Panel Indonesia", availableTokens: "1434.5" },
    { id: 4, logo: "/images/project-logo-1.png", name: "PT Green Renewable Energy", availableTokens: "2034.8" },
    { id: 5, logo: "/images/project-logo-2.png", name: "PT Energy Jaya Asri", availableTokens: "1702.3" },
    { id: 6, logo: "/images/project-logo-3.png", name: "Pusat Solar Panel Indonesia", availableTokens: "1434.5" },
    { id: 7, logo: "/images/project-logo-1.png", name: "PT Green Renewable Energy", availableTokens: "2034.8" },
  ];
  const newsArticles = [
    { id: 1, image: "/images/news-1.jpg", title: "MAHASISWA & DOSEN BERSINERGI KEMBANGKAN RISET SAHAM" },
    { id: 2, image: "/images/news-2.jpg", title: "PEMERINTAH SIAP INVESTASI RP 16,5T, FOKUS KE SAHAM PENDANAAN" },
    { id: 3, image: "/images/news-3.jpg", title: "SAHAM BANK BUMN & SWASTA PANTAU INDAH KAPUK MILIK NELAYAN" },
    { id: 4, image: "/images/news-4.jpg", title: "KPK PERIKSA 3 SAKSI KASUS KORUPSI BERESKAN UTANG WHOOSH" },
  ];
  // --- AKHIR DATA DUMMY ---

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container}>
        {/* 1. Bagian Portfolio */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <FiUser />
              <h3>Portfolio</h3>
            </div>
          </div>

          {/* 3. Tambahkan cek isLoading || !user */}
          {isLoading || !user ? (
            // Tampilkan placeholder selagi loading
            <div className={styles.portfolioContent}>
              <div className={`${styles.portfolioInfo} ${styles.portfolioInfoWithAvatar}`}>
                <div className={styles.portfolioAvatar} style={{ background: '#eee' }} />
                <div>
                  <p className={styles.portfolioLabel}>Nama</p>
                  <h4 className={styles.portfolioValue}>Loading...</h4>
                </div>
              </div>
              <div className={styles.portfolioInfo}>
                <p className={styles.portfolioLabel}>Token Supply</p>
                <h4 className={styles.portfolioValue}>******</h4>
              </div>
              <div className={styles.portfolioInfo}>
                <p className={styles.portfolioLabel}>Wallet ID</p>
                <h4 className={styles.portfolioValue}>...</h4>
              </div>
            </div>
          ) : (
            // 4. Jika data user ada, tampilkan data asli
            <div className={styles.portfolioContent}>
              <div className={`${styles.portfolioInfo} ${styles.portfolioInfoWithAvatar}`}>
                <Image
                  // 5. Ganti 'src' jadi dinamis
                  src={user.avatarUrl ? user.avatarUrl : "/images/default-avatar.png"}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className={styles.portfolioAvatar}
                  // 6. Tambahkan ini untuk fix gambar Google
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.src = "/images/default-avatar.png"; }}
                />
                <div>
                  <p className={styles.portfolioLabel}>Nama</p>
                  {/* 7. Ganti 'name' jadi dinamis */}
                  <h4 className={styles.portfolioValue}>{user.name}</h4>
                </div>
              </div>
              
              {/* Data ini masih dummy, tapi Anda bisa mengisinya nanti */}
              <div className={styles.portfolioInfo}>
                <p className={styles.portfolioLabel}>Token Supply</p>
                <h4 className={styles.portfolioValue}>{portfolioData.tokenSupply}</h4>
              </div>
              <div className={styles.portfolioInfo}>
                <p className={styles.portfolioLabel}>Wallet ID</p>
                <div className={styles.walletIdContainer}>
                    <h4 className={styles.portfolioValue}>{portfolioData.walletID}</h4>
                    <FiCopy className={styles.copyIcon} />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. Bagian Trending (Tidak berubah) */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                  <FiTrendingUp />
                  <h3>Trending</h3>
              </div>
              <button className={styles.exploreButton}>Explore Market</button>
          </div>
          <div className={styles.projectList}>
              {trendingProjects.map((project) => (
                  <div key={project.id} className={styles.projectItem}>
                      <Image src={project.logo} alt={project.name} width={40} height={40} className={styles.projectLogo} />
                      <p className={styles.projectName}>{project.name}</p>
                      <div className={styles.tokenInfo}>
                          <p className={styles.tokenValue}>{project.availableTokens}</p>
                          <p className={styles.tokenLabel}>Tr offset</p>
                      </div>
                  </div>
              ))}
          </div>
        </section>

        {/* 3. Bagian All Project (Tidak berubah) */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                  <FiList />
                  <h3>All Project</h3>
              </div>
              <button className={styles.exploreButton}>See All</button>
          </div>
          <div className={styles.filterContainer}>
              <button className={`${styles.filterButton} ${styles.active}`}>Diterbitkan</button>
              <button className={styles.filterButton}>Diajukan</button>
              <button className={styles.filterButton}>Di audit</button>
              <button className={styles.filterButton}>Semua</button>
          </div>
          <div className={styles.projectList}>
              {allProjects.map((project, index) => (
                  <div key={project.id} className={styles.projectItem}>
                      <span className={styles.projectIndex}>{index + 1}</span>
                      <Image src={project.logo} alt={project.name} width={40} height={40} className={styles.projectLogo} />
                      <p className={styles.projectName}>{project.name}</p>
                      <div className={styles.tokenInfo}>
                          <p className={styles.tokenValue}>{project.availableTokens}</p>
                          <p className={styles.tokenLabel}>Token available</p>
                      </div>
                  </div>
              ))}
          </div>
          <div className={styles.pagination}>
              <button className={styles.paginationButton}><FiArrowLeft /></button>
              <span>1/6</span>
              <button className={styles.paginationButton}><FiArrowRight /></button>
          </div>
        </section>

        {/* 4. Bagian News (Tidak berubah) */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                  <FiRss />
                  <h3>News</h3>
              </div>
              <button className={styles.exploreButton}>Explore News</button>
          </div>
          <div className={styles.newsGrid}>
              {newsArticles.map((article) => (
                  <div key={article.id} className={styles.newsCard}>
                      <Image src={article.image} alt={article.title} width={300} height={150} className={styles.newsImage} />
                      <div className={styles.newsContent}>
                          <p className={styles.newsTitle}>{article.title}</p>
                          <button className={styles.newsButton}>Selengkapnya</button>
                      </div>
                  </div>
              ))}
          </div>
           <div className={styles.pagination}>
              <button className={styles.paginationButton}><FiArrowLeft /></button>
              <span>1/6</span>
              <button className={styles.paginationButton}><FiArrowRight /></button>
          </div>
        </section>
      </main>
    </div>
  );
}