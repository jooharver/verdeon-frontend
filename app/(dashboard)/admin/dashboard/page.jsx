'use client';

import React from 'react';
import styles from './Dashboard.module.css';
import { 
  // ... (ikon-ikon)
  FaUsers, FaProjectDiagram, FaCheckCircle, FaChartBar, 
  FaClipboardList, FaBolt, FaUsersCog, FaTasks, FaBullhorn,
  FaReceipt
} from 'react-icons/fa';
import Topbar from '../../../components/Topbar';
import Link from 'next/link';

// 1. GANTI LineChart & Line dengan AreaChart & Area
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

/* --- Komponen KpiCard (Tidak Berubah) --- */
const KpiCard = ({ icon, title, value, subtitle, type = 'default' }) => {
  // ... (kode KpiCard)
  return (
    <div className={`${styles.kpiCard} ${styles[type]}`}>
      <div className={`${styles.cardIconWrapper} ${styles[type]}`}>
        {icon}
      </div>
      <div className={styles.cardInfo}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardValue}>{value}</span>
        {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
      </div>
      {type === 'pending' && <span className={styles.pendingIndicator}></span>}
    </div>
  );
};
/* --- Akhir Komponen KpiCard --- */


/**
 * Halaman Utama Dashboard Admin
 */
export default function AdminDashboardPage() {
  
  const pageTitle = "Admin Dashboard";
  const pageBreadcrumbs = ["Admin", "Dashboard"];

  // ... (Data kpiData tidak berubah)
  const kpiData = [
    { icon: <FaUsers />, title: 'TOTAL USERS', value: '1,845', type: 'default' },
    { icon: <FaProjectDiagram />, title: 'PENDING VERIFICATION', value: '48', type: 'pending' },
    { icon: <FaCheckCircle />, title: 'TOTAL PROJECTS', value: '731', type: 'success' },
    { icon: <FaChartBar />, title: 'TOTAL TRANSACTIONS (MONTH)', value: '12,900 VDN', subtitle: 'CHAR WID', type: 'default' }
  ];
  
  // ... (Data userRegistrationData tidak berubah)
  const userRegistrationData = [
    { name: 'Okt 15', Users: 12 }, { name: 'Okt 20', Users: 19 }, { name: 'Okt 25', Users: 25 },
    { name: 'Okt 30', Users: 22 }, { name: 'Nov 05', Users: 30 }, { name: 'Nov 10', Users: 38 },
    { name: 'Nov 15', Users: 45 },
  ];
  
  // ... (Data projectStatusData tidak berubah)
  const projectStatusData = [
    { name: 'Approved', value: 430 }, { name: 'Pending', value: 215 }, { name: 'Rejected', value: 72 },
  ];
  const PIE_COLORS = ['var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];

  // ... (Data pendingProjectsData tidak berubah)
  const pendingProjectsData = [
    { id: 1, name: 'Agri-Forestry Bali', submittedBy: 'User A' },
    { id: 3, name: 'Mangrove Rehab Papua', submittedBy: 'User B' },
    { id: 4, name: 'Community Solar Java', submittedBy: 'User C' },
  ];
  
  // ... (Data recentTransactionsData tidak berubah)
  const recentTransactionsData = [
    { id: 'tx1', time: '10m ago', buyer: '0x6...H3J2', seller: 'Agri-Forestry Bali', amount: 150, amountVdn: 150, value: 'Rp 2,250,000' },
    { id: 'tx2', time: '12m ago', buyer: 'Mangrove@email.com', seller: 'Agri-Forestry Bali', amount: 120, amountVdn: 120, value: 'Rp 1,800,000' },
    { id: 'tx3', time: '15m ago', buyer: 'Community Solar Java', seller: '0x0...F9B7', amount: 150, amountVdn: 150, value: 'Rp 2,250,000' },
    { id: 'tx4', time: '20m ago', buyer: '0x4...G7K1', seller: 'Mangrove Rehab Papua', amount: 50, amountVdn: 50, value: 'Rp 750,000' },
  ];

  return (
    <div> 
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container}>
        
        {/* --- Section KPI (Tidak Berubah) --- */}
        <section className={styles.kpiGrid}>
          {kpiData.map((data, index) => (
            <KpiCard key={index} {...data} />
          ))}
        </section>

        {/* --- Section Charts (Telah Diperbarui) --- */}
        <section className={styles.chartsSection}>

          {/* Kartu untuk Area Chart (Sebelumnya Line Chart) */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartHeader}>NEW USER REGISTRATIONS (LAST 30 DAYS)</h3>
            {/* 2. UBAH TINGGI DARI 350px -> 300px */}
            <div className={styles.chartWrapper} style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {/* 3. Ganti LineChart -> AreaChart */}
                <AreaChart data={userRegistrationData}>
                  
                  {/* 4. Tambahkan Definisi Gradien */}
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-color)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--brand-color)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-secondary)" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }} 
                  />
                  <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                  
                  {/* 5. Ganti Line -> Area, tambahkan fill="url(#...)" */}
                  <Area 
                    type="monotone" 
                    dataKey="Users" 
                    stroke="var(--brand-color)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" // <-- Ini untuk blok warnanya
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, stroke: 'var(--bg-card)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Kartu untuk Pie Chart */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartHeader}>PROJECT STATUS BREAKDOWN</h3>
            {/* 2. UBAH TINGGI DARI 350px -> 300px */}
            <div className={styles.chartWrapper} style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* ... (kode PieChart tidak berubah) ... */}
                  <Pie data={projectStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} /* Sedikit lebih kecil */ innerRadius={70} paddingAngle={3}>
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}} />
                  <Legend wrapperStyle={{ color: 'var(--text-secondary)', marginTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* --- Section Action (Tidak Berubah) --- */}
        <section className={styles.actionSection}>
          {/* ... (Kode Kartu "Projects Needing Verification") ... */}
          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaClipboardList />
              <span>PROJECTS NEEDING VERIFICATION</span>
            </h3>
            <div className={styles.projectTable}>
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <span>Project Name</span>
                <span>Submitted By</span>
                <span style={{ textAlign: 'right' }}>Action</span>
              </div>
              {pendingProjectsData.map((project) => (
                <div key={project.id} className={styles.tableRow}>
                  <div className={styles.projectName}>
                    <span className={styles.projectIndex}>{project.id}</span>
                    <span>{project.name}</span>
                  </div>
                  <span>{project.submittedBy}</span>
                  <div className={styles.actionCell}>
                    <Link href={`/admin/project/${project.id}`} className={styles.reviewButton}>
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ... (Kode Kartu "Quick Actions") ... */}
          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaBolt />
              <span>QUICK ACTIONS</span>
            </h3>
            <div className={styles.quickActions}>
              <Link href="/admin/user" className={`${styles.quickButton} ${styles.blue}`}>
                <FaUsersCog />
                <span>Manage Users</span>
              </Link>
              <Link href="/admin/project" className={`${styles.quickButton} ${styles.green}`}>
                <FaTasks />
                <span>Manage Projects</span>
              </Link>
              <Link href="#" className={`${styles.quickButton} ${styles.orange}`}>
                <FaBullhorn />
                <span>Broadcast Announcement</span>
              </Link>
            </div>
          </div>
        </section>

        {/* --- Section Recent Transactions (Tidak Berubah) --- */}
        <section className={styles.chartCard}>
          <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
            <FaReceipt />
            <span>RECENT TRANSACTIONS</span>
          </h3>
          <div className={styles.transactionTable}>
            {/* ... (Kode Tabel Transaksi) ... */}
            <div className={`${styles.tableRow} ${styles.tableHeader} ${styles.transactionRow}`}>
              <span>Time</span>
              <span>Buyer</span>
              <span>Seller</span>
              <span>Amount</span>
              <span>Amount (VDN)</span>
              <span style={{ textAlign: 'right' }}>Value (IDR)</span>
            </div>
            {recentTransactionsData.map((tx) => (
              <div key={tx.id} className={`${styles.tableRow} ${styles.transactionRow}`}>
                <span className={styles.txTime}>{tx.time}</span>
                <span className={styles.txParty}>{tx.buyer}</span>
                <span className={styles.txParty}>{tx.seller}</span>
                <span>{tx.amount}</span>
                <span>{tx.amountVdn}</span>
                <span className={styles.txValue}>{tx.value}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}