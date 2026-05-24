'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Home.module.css';
import Topbar from '../../components/Topbar';
import Swal from 'sweetalert2';

// Context & Services
import { useAuth } from '../../../context/AuthContext'; 
import { projectService } from '../../../services/projectService';
import { forceConnectWallet } from '../../utils/web3Config';

// Icons
import { 
  FaUserCircle, FaWallet, FaCopy, FaLeaf, FaProjectDiagram, 
  FaCheckCircle, FaArrowRight, FaPlus, FaClock 
} from 'react-icons/fa';

export default function HomePage() {
  const pageTitle = "Home";
  const pageBreadcrumbs = ["Dashboard", "Home"]; 
  
  const { user, isLoading: isUserLoading, updateWallet } = useAuth();
  
  const [walletAddress, setWalletAddress] = useState('');
  const [myProjects, setMyProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  // Sync wallet address dari user data
  useEffect(() => {
    if (user?.wallet_address) {
      setWalletAddress(user.wallet_address);
    }
  }, [user]);

  // Fetch data proyek asli dari database
  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        const data = await projectService.getMyProjects();
        setMyProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gagal memuat proyek:", error);
      } finally {
        setIsProjectsLoading(false);
      }
    };
    fetchMyProjects();
  }, []);

  // Kalkulasi KPI
  const stats = React.useMemo(() => {
    const total = myProjects.length;
    const listed = myProjects.filter(p => p.active_version?.status === 'listed').length;
    
    // Hitung total VCT dari proyek yang sudah listed/auditor_verified
    const totalTokens = myProjects.reduce((sum, p) => {
      const v = p.active_version;
      if (['auditor_verified', 'listed'].includes(v?.status)) {
        return sum + (parseFloat(v.audit_report?.carbon_reduction_amount_ton) || 0);
      }
      return sum;
    }, 0);

    return { total, listed, totalTokens };
  }, [myProjects]);

  // Handler Wallet dengan Force Request & Context Update
  const handleConnectWallet = async () => {
    try {
      // 1. Panggil fungsi force connect untuk memunculkan pop-up MetaMask
      const { signer } = await forceConnectWallet();
      const address = await signer.getAddress();
      
      // 2. Minta konfirmasi user agar tidak salah sambung dompet
      const confirm = await Swal.fire({
        title: 'Konfirmasi Dompet',
        html: `Apakah Anda yakin ingin mengaitkan dompet <b>${address.substring(0, 6)}...${address.substring(address.length - 4)}</b> ke akun ini?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0ea5e9',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Kaitkan!',
        cancelButtonText: 'Batal'
      });

      if (confirm.isConfirmed) {
        Swal.fire({
          title: 'Menyimpan...',
          text: 'Mengamankan wallet address ke database.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => { Swal.showLoading(); }
        });

        // 3. Simpan ke backend via fungsi di AuthContext
        await updateWallet(address);
        
        Swal.fire({
          icon: 'success',
          title: 'Wallet Terhubung!',
          text: 'Dompet MetaMask berhasil dikaitkan dan disimpan secara permanen.',
          confirmButtonColor: '#0ea5e9'
        });
      }

    } catch (error) {
      console.error(error);
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        Swal.fire('Batal', 'Anda membatalkan permintaan koneksi MetaMask.', 'info');
      } else {
        Swal.fire('Error', 'Gagal menghubungkan dompet: ' + error.message, 'error');
      }
    }
  };

  const handleCopyWallet = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Wallet Address disalin!',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Render Status
  const renderStatus = (status) => {
    const s = status?.toLowerCase() || 'draft';
    const badges = {
      listed: { class: styles.badgeSuccess, label: 'Listed Market' },
      auditor_verified: { class: styles.badgeSuccess, label: 'Verified' },
      admin_approved: { class: styles.badgeWarning, label: 'Auditing' },
      submitted: { class: styles.badgeWarning, label: 'Pending Admin' },
      rejected: { class: styles.badgeDanger, label: 'Rejected' },
      draft: { class: styles.badgeNeutral, label: 'Draft' }
    };
    const conf = badges[s] || badges.draft;
    return <span className={`${styles.badge} ${conf.class}`}>{conf.label}</span>;
  };

  if (isUserLoading) {
    return <div className={styles.loadingScreen}>Memuat Dashboard...</div>;
  }

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container}>
        
        {/* 1. HERO SECTION: Profile & Wallet */}
        <section className={styles.heroCard}>
          <div className={styles.heroProfile}>
            {/* 👉 FIX: Pakai tag img HTML standar dan fallback kuat ke default-avatar.png */}
            <img 
              src={user?.avatarUrl || "/images/default-avatar.png"} 
              alt="Avatar" 
              className={styles.avatar} 
              referrerPolicy="no-referrer"
              onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = "/images/default-avatar.png"; 
              }}
            />
            
            <div className={styles.userInfo}>
              <h2 className={styles.greeting}>Welcome back, {user?.name || 'Issuer'}!</h2>
              <p className={styles.userEmail}>{user?.email || 'issuer@verdeon.com'}</p>
              <span className={styles.roleTag}>Verified Issuer</span>
            </div>
          </div>

          <div className={styles.heroWallet}>
            <div className={styles.walletHeader}>
              <FaWallet className={styles.walletIcon} />
              <span>Web3 Identity</span>
            </div>
            
            {walletAddress ? (
              <div className={styles.walletConnected}>
                <div className={styles.walletAddressBox}>
                  <code>{walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 6)}</code>
                  <button onClick={handleCopyWallet} className={styles.btnCopy} title="Copy Address">
                    <FaCopy />
                  </button>
                </div>
                <div className={styles.walletNetwork}>
                  <div className={styles.networkDot}></div> Polygon Amoy
                </div>
              </div>
            ) : (
              <div className={styles.walletDisconnected}>
                <p>Dompet digital belum terhubung.</p>
                <button onClick={handleConnectWallet} className={styles.btnConnect}>
                  Connect MetaMask
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 2. KPI STATS */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
              <FaProjectDiagram />
            </div>
            <div className={styles.statData}>
              <p className={styles.statLabel}>Total Proyek</p>
              <h3 className={styles.statValue}>{stats.total}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
              <FaCheckCircle />
            </div>
            <div className={styles.statData}>
              <p className={styles.statLabel}>Proyek Listed</p>
              <h3 className={styles.statValue}>{stats.listed}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.iconTeal}`}>
              <FaLeaf />
            </div>
            <div className={styles.statData}>
              <p className={styles.statLabel}>Total VCT Minted</p>
              <h3 className={styles.statValue}>{stats.totalTokens.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </section>

        {/* 3. RECENT ACTIVITY & QUICK ACTIONS */}
        <div className={styles.bottomGrid}>
          
          <section className={styles.recentProjectsCard}>
            <div className={styles.cardHeader}>
              <h3>Aktivitas Proyek Terakhir</h3>
              <Link href="/my-project" className={styles.linkViewAll}>
                Lihat Semua <FaArrowRight />
              </Link>
            </div>
            
            <div className={styles.recentList}>
              {isProjectsLoading ? (
                <div className={styles.loadingText}>Memuat proyek...</div>
              ) : myProjects.length > 0 ? (
                // Ambil 4 proyek terbaru
                myProjects.slice(0, 4).map((proj) => (
                  <div key={proj.id} className={styles.recentItem}>
                    <div className={styles.recentIcon}>
                      <FaLeaf />
                    </div>
                    <div className={styles.recentInfo}>
                      <h4>{proj.active_version?.name || 'Unnamed Project'}</h4>
                      <p><FaClock /> {new Date(proj.updated_at).toLocaleDateString('id-ID')} • Kapasitas: {proj.active_version?.total_system_capacity_kwp || 0} kWp</p>
                    </div>
                    <div className={styles.recentStatus}>
                      {renderStatus(proj.active_version?.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <img src="https://placehold.co/100x100/f1f5f9/94a3b8?text=Empty" alt="Empty" />
                  <p>Anda belum memiliki proyek pengajuan karbon.</p>
                </div>
              )}
            </div>
          </section>

          <section className={styles.actionCard}>
            <h3>Aksi Cepat</h3>
            <p>Mulai registrasi fasilitas energi hijau Anda untuk divalidasi dan diubah menjadi aset token karbon.</p>
            <Link href="/my-project" className={styles.btnPrimaryLg}>
              <FaPlus /> Buat Proyek Baru
            </Link>
            
            <div className={styles.infoBox}>
              <h4>Butuh Bantuan?</h4>
              <p>Pastikan Anda telah menyiapkan dokumen PDD (Project Design Document) dan foto bukti lapangan sebelum membuat pengajuan.</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}