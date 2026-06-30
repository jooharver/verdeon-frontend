'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Dashboard.module.css';
import { 
  FaUsers, FaProjectDiagram, FaCheckCircle, 
  FaClipboardList, FaBolt, FaUsersCog, FaTasks, FaBullhorn,
  FaReceipt, FaSpinner, FaLeaf
} from 'react-icons/fa';
import Topbar from '../../../components/Topbar';
import Link from 'next/link';
import { ethers } from 'ethers';

// Impor Chart
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// Impor Service & Web3
import { api } from '../../../../services/api';
import { projectService } from '../../../../services/projectService';
import { getTokenContract } from '../../../utils/web3Config';

/* --- Komponen KpiCard --- */
const KpiCard = ({ icon, title, value, subtitle, type = 'default', isLoading }) => {
  return (
    <div className={`${styles.kpiCard} ${styles[type]}`}>
      <div className={`${styles.cardIconWrapper} ${styles[type]}`}>
        {icon}
      </div>
      <div className={styles.cardInfo}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardValue}>
          {isLoading ? <FaSpinner className="fa-spin" style={{ fontSize: '1.2rem' }} /> : value}
        </span>
        {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
      </div>
      {type === 'pending' && <span className={styles.pendingIndicator}></span>}
    </div>
  );
};

export default function AdminDashboardPage() {
  const pageTitle = "Admin Dashboard";
  const pageBreadcrumbs = ["Admin", "Dashboard"];

  // --- STATE DATA ASLI ---
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  const [totalVctMinted, setTotalVctMinted] = useState("0");
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA (WEB2 + WEB3) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // 1. Tarik Data User (Web2)
        const usersRes = await api('/admin/users');
        if (usersRes?.data && Array.isArray(usersRes.data)) {
          setUsers(usersRes.data);
          setTotalUsersCount(usersRes.total || usersRes.data.length);
        } else {
          const arr = Array.isArray(usersRes) ? usersRes : [];
          setUsers(arr);
          setTotalUsersCount(arr.length);
        }

        // 2. Tarik Data Project (Web2)
        const projectsRes = await projectService.getAllProjects();
        if (projectsRes?.data && Array.isArray(projectsRes.data)) {
          setProjects(projectsRes.data);
          setTotalProjectsCount(projectsRes.total || projectsRes.data.length);
        } else {
          const arr = Array.isArray(projectsRes) ? projectsRes : [];
          setProjects(arr);
          setTotalProjectsCount(arr.length);
        }

        // 3. Tarik Total Supply Token (Web3 Polygon)
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = getTokenContract(provider);
          const totalSupply = await contract.totalSupply();
          
          const formattedSupply = ethers.formatUnits(totalSupply, 18);
          setTotalVctMinted(parseFloat(formattedSupply).toLocaleString('id-ID', { maximumFractionDigits: 2 }));
        }

      } catch (error) {
        console.error("Gagal menarik data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- DATA PROCESSING (USE MEMO) ---

  // 1. Kalkulasi KPI
  const kpiStats = useMemo(() => {
    const pendingVerifications = projects.filter(p => p.active_version?.status === 'submitted').length;
    
    return [
      { icon: <FaUsers />, title: 'TOTAL USERS', value: totalUsersCount.toLocaleString(), type: 'default' },
      { icon: <FaProjectDiagram />, title: 'PENDING VERIFICATION', value: pendingVerifications, type: 'pending' },
      { icon: <FaCheckCircle />, title: 'TOTAL PROJECTS', value: totalProjectsCount.toLocaleString(), type: 'success' },
      { icon: <FaLeaf />, title: 'TOTAL VCT MINTED (ON-CHAIN)', value: `${totalVctMinted} VCT`, subtitle: 'Polygon Amoy', type: 'default' }
    ];
  }, [totalUsersCount, projects, totalProjectsCount, totalVctMinted]);

  // 2. Data Chart: Status Proyek
  const projectStatusData = useMemo(() => {
    const statusCount = { Listed: 0, Pending: 0, Rejected: 0, Verified: 0 };
    
    projects.forEach(p => {
      const s = p.active_version?.status;
      if (s === 'listed') statusCount.Listed += 1;
      else if (s === 'submitted' || s === 'admin_approved') statusCount.Pending += 1;
      else if (s === 'rejected' || s === 'auditor_rejected') statusCount.Rejected += 1;
      else if (s === 'auditor_verified') statusCount.Verified += 1;
    });

    return [
      { name: 'Listed', value: statusCount.Listed },
      { name: 'Verified', value: statusCount.Verified },
      { name: 'Pending', value: statusCount.Pending },
      { name: 'Rejected', value: statusCount.Rejected },
    ].filter(item => item.value > 0); 
  }, [projects]);

  const PIE_COLORS = ['#22c55e', '#0ea5e9', '#eab308', '#ef4444'];

  // 3. Data Chart: Pertumbuhan User
  const userRegistrationData = useMemo(() => {
    const base = Math.max(10, Math.floor(totalUsersCount / 5));
    return [
      { name: 'Week 1', Users: base }, { name: 'Week 2', Users: base + 5 }, 
      { name: 'Week 3', Users: base + 12 }, { name: 'Week 4', Users: totalUsersCount || 20 }
    ];
  }, [totalUsersCount]);

  // 4. Tabel: Menunggu Verifikasi Admin
  const pendingProjectsList = useMemo(() => {
    return projects
      .filter(p => p.active_version?.status === 'submitted')
      .slice(0, 5); 
  }, [projects]);

  // ==============================================================
  // 🔥 FIX 1: FLATTEN DAN PILIH HASH SECARA AKURAT (AUDIT TRAIL)
  // ==============================================================
  const recentOnChainActivity = useMemo(() => {
    const activities = [];

    projects.forEach(p => {
      // Skenario A: Ambil riwayat status tracking dari snapshots (VerideonProject Contract)
      if (p.snapshots && Array.isArray(p.snapshots)) {
        p.snapshots.forEach(snap => {
          if (snap.tx_hash) {
            activities.push({
              id: `snap-${snap.id}`,
              date: snap.created_at || p.updated_at,
              projectName: p.active_version?.name || 'Unnamed',
              walletAddress: p.issuer?.wallet_address,
              statusText: snap.status_at_snapshot,
              txHash: snap.tx_hash,
              isMinting: false
            });
          }
        });
      }

      // Skenario B: Ambil riwayat pencetakan token dari projects.blockchain_tx (VerideonToken Contract)
      if (p.blockchain_tx) {
        activities.push({
          id: `mint-${p.id}`,
          date: p.updated_at,
          projectName: p.active_version?.name || 'Unnamed',
          walletAddress: p.issuer?.wallet_address,
          statusText: 'vct_minted',
          txHash: p.blockchain_tx,
          isMinting: true
        });
      }
    });

    // Urutkan kronologi berdasarkan waktu eksekusi paling baru dan potong maksimal 5 item
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [projects]);

  const formatAddress = (address) => address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '-';

  return (
    <div> 
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container}>
        
        {/* --- Section KPI --- */}
        <section className={styles.kpiGrid}>
          {kpiStats.map((data, index) => (
            <KpiCard key={index} {...data} isLoading={isLoading} />
          ))}
        </section>

        {/* --- Section Charts --- */}
        <section className={styles.chartsSection}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartHeader}>NEW USER REGISTRATIONS</h3>
            <div className={styles.chartWrapper} style={{ height: '300px' }}>
              {isLoading ? <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center'}}><FaSpinner className="fa-spin"/></div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userRegistrationData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-color)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--brand-color)" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}} />
                    <Area type="monotone" dataKey="Users" stroke="var(--brand-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" dot={{ r: 4 }} activeDot={{ r: 6, stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartHeader}>PROJECT STATUS BREAKDOWN</h3>
            <div className={styles.chartWrapper} style={{ height: '300px' }}>
              {isLoading ? <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center'}}><FaSpinner className="fa-spin"/></div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={70} paddingAngle={3}>
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}} />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', marginTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* --- Section Action --- */}
        <section className={styles.actionSection}>
          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaClipboardList />
              <span>PROJECTS NEEDING VERIFICATION</span>
            </h3>
            <div className={styles.projectTable}>
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <span>Project Name</span>
                <span>Issuer</span>
                <span style={{ textAlign: 'right' }}>Action</span>
              </div>
              
              {isLoading ? (
                <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}><FaSpinner className="fa-spin"/> Loading...</div>
              ) : pendingProjectsList.length > 0 ? (
                pendingProjectsList.map((project) => (
                  <div key={project.id} className={styles.tableRow}>
                    <div className={styles.projectName}>
                      <span className={styles.projectIndex}>#{String(project.id).padStart(3, '0')}</span>
                      <span>{project.active_version?.name || 'Unnamed'}</span>
                    </div>
                    <span>{project.issuer?.name || 'Unknown'}</span>
                    <div className={styles.actionCell}>
                      <Link href={`/admin/projects`} className={styles.reviewButton}>
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>Tidak ada proyek yang menunggu verifikasi admin.</div>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaBolt />
              <span>QUICK ACTIONS</span>
            </h3>
            <div className={styles.quickActions}>
              <Link href="/admin/users" className={`${styles.quickButton} ${styles.blue}`}>
                <FaUsersCog />
                <span>Manage Users</span>
              </Link>
              <Link href="/admin/projects" className={`${styles.quickButton} ${styles.green}`}>
                <FaTasks />
                <span>Manage Projects</span>
              </Link>
              <Link href="#" className={`${styles.quickButton} ${styles.orange}`}>
                <FaBullhorn />
                <span>System Config</span>
              </Link>
            </div>
          </div>
        </section>

        {/* --- Section Recent On-Chain Activity --- */}
        <section className={styles.chartCard}>
          <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
            <FaReceipt />
            <span>RECENT ON-CHAIN ACTIVITY (POLYGON)</span>
          </h3>
          <div className={styles.transactionTable}>
            <div className={`${styles.tableRow} ${styles.tableHeader} ${styles.transactionRow}`}>
              <span>Date</span>
              <span>Project Name</span>
              <span>Issuer Wallet</span>
              <span>Status</span>
              <span>Tx Hash</span>
              <span style={{ textAlign: 'right' }}>View</span>
            </div>
            
            {isLoading ? (
              <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}><FaSpinner className="fa-spin"/> Syncing with Blockchain...</div>
            ) : recentOnChainActivity.length > 0 ? (
              // 👉 FIX 2: MAPPING DENGAN STRUKTUR VARIABEL BARU YANG FLAT DAN AKURAT
              recentOnChainActivity.map((act) => (
                <div key={act.id} className={`${styles.tableRow} ${styles.transactionRow}`}>
                  <span className={styles.txTime}>{new Date(act.date).toLocaleDateString('id-ID')}</span>
                  <span className={styles.txParty}>{act.projectName}</span>
                  <span className={styles.txParty}>{formatAddress(act.walletAddress)}</span>
                  
                  {/* Styling Label Status */}
                  <span style={{
                    textTransform: 'uppercase', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    color: act.isMinting ? '#b45309' : 'var(--brand-color)'
                  }}>
                    {act.statusText?.replace(/_/g, ' ')}
                  </span>

                  {/* Tampilkan Tx Hash */}
                  <span className={styles.txTime}>
                    <code style={{background: 'var(--bg-main)', padding:'4px', borderRadius:'4px'}}>
                      {formatAddress(act.txHash)}
                    </code>
                  </span>

                  {/* Navigasi Link Explorer */}
                  <span className={styles.txValue}>
                    <a 
                      href={`https://amoy.polygonscan.com/tx/${act.txHash}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{color: 'var(--success-color)', textDecoration:'none', fontWeight:'bold'}}
                    >
                      Explorer
                    </a>
                  </span>
                </div>
              ))
            ) : (
              <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>Belum ada aktivitas terekam di Blockchain.</div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}