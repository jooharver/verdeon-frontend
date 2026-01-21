'use client';

import React from 'react';
import styles from '../../admin/dashboard/Dashboard.module.css'; // Reuse CSS Admin biar konsisten
import Topbar from '../../../components/Topbar';
import Link from 'next/link';
import { 
  FaClipboardCheck, FaSearchLocation, FaCheckDouble, FaHistory, 
  FaMapMarkedAlt, FaCalendarAlt, FaArrowRight, FaFileContract,
  FaExclamationTriangle
} from 'react-icons/fa';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

/* --- Komponen KpiCard (Reuse) --- */
const KpiCard = ({ icon, title, value, subtitle, type = 'default' }) => {
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

export default function AuditorDashboardPage() {
  
  const pageTitle = "Auditor Workspace";
  const pageBreadcrumbs = ["Auditor", "Dashboard"];

  // --- 1. KPI DATA (Khusus Auditor) ---
  const kpiData = [
    { 
      icon: <FaClipboardCheck />, 
      title: 'ASSIGNED TO ME', 
      value: '12', 
      subtitle: 'Projects',
      type: 'pending' // Kuning (Perlu perhatian)
    },
    { 
      icon: <FaSearchLocation />, 
      title: 'SITE VISITS', 
      value: '3', 
      subtitle: 'Upcoming this week',
      type: 'default' 
    },
    { 
      icon: <FaCheckDouble />, 
      title: 'AUDITED THIS MONTH', 
      value: '28', 
      subtitle: '+12% from last month',
      type: 'success' // Hijau
    },
    { 
      icon: <FaHistory />, 
      title: 'AVG. REVIEW TIME', 
      value: '2.4 Days', 
      subtitle: 'Efficiency Rate',
      type: 'default' 
    }
  ];
  
  // --- 2. CHART: Audit Activity (Productivity) ---
  const auditActivityData = [
    { name: 'Week 1', Audits: 5 }, 
    { name: 'Week 2', Audits: 8 }, 
    { name: 'Week 3', Audits: 12 },
    { name: 'Week 4', Audits: 7 }, 
    { name: 'Week 5', Audits: 10 }
  ];
  
  // --- 3. CHART: Decision Distribution ---
  const decisionData = [
    { name: 'Verified', value: 65 }, 
    { name: 'Revision Needed', value: 25 }, 
    { name: 'Rejected', value: 10 },
  ];
  const PIE_COLORS = ['var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];

  // --- 4. TABLE: My Priority Tasks ---
  const priorityTasks = [
    { id: 'PRJ-091', name: 'Solar Farm Banyuwangi', location: 'Jawa Timur', deadline: '2 Days left', status: 'In Review' },
    { id: 'PRJ-092', name: 'Rooftop Sekolah Alam', location: 'Bandung', deadline: '5 Days left', status: 'Submitted' },
    { id: 'PRJ-095', name: 'Microhydro Desa Penari', location: 'Banyuwangi', deadline: '1 Week left', status: 'Revision' },
  ];
  
  // --- 5. LIST: Upcoming Site Visits (Pengganti Recent Transaction) ---
  const upcomingVisits = [
    { id: 1, date: '24 Nov', project: 'Solar Farm Banyuwangi', location: 'Genteng, Banyuwangi', contact: 'Pak Budi (Issuer)' },
    { id: 2, date: '28 Nov', project: 'Biomass Plant Riau', location: 'Pekanbaru, Riau', contact: 'Bu Siti (Admin)' },
    { id: 3, date: '02 Dec', project: 'Wind Farm Sidrap', location: 'Sidrap, Sulsel', contact: 'Office' },
  ];

  return (
    <div> 
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container}>
        
        {/* --- Section KPI --- */}
        <section className={styles.kpiGrid}>
          {kpiData.map((data, index) => (
            <KpiCard key={index} {...data} />
          ))}
        </section>

        {/* --- Section Charts --- */}
        <section className={styles.chartsSection}>

          {/* Chart 1: Productivity */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartHeader}>WEEKLY AUDIT PERFORMANCE</h3>
            <div className={styles.chartWrapper} style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={auditActivityData}>
                  <defs>
                    <linearGradient id="colorAudit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-color)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--brand-color)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <Area type="monotone" dataKey="Audits" stroke="var(--brand-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorAudit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Decision Ratio */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartHeader}>MY DECISION RATIO</h3>
            <div className={styles.chartWrapper} style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={decisionData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" cy="50%" 
                    outerRadius={90} 
                    innerRadius={60} 
                    paddingAngle={5}
                  >
                    {decisionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* --- Section Actions & Visits --- */}
        <section className={styles.actionSection}>
          
          {/* LEFT: My Priority Tasks */}
          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaFileContract />
              <span>MY PENDING AUDITS</span>
            </h3>
            <div className={styles.projectTable}>
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <span>Project Name</span>
                <span>Deadline</span>
                <span style={{ textAlign: 'right' }}>Action</span>
              </div>
              {priorityTasks.map((task) => (
                <div key={task.id} className={styles.tableRow}>
                  <div className={styles.projectName}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontWeight:600}}>{task.name}</span>
                      <span style={{fontSize:'0.75rem', color:'var(--text-secondary)'}}>{task.location}</span>
                    </div>
                  </div>
                  
                  {/* Deadline Indicator */}
                  <span style={{
                    color: task.deadline.includes('Day') ? 'var(--danger-color)' : 'var(--warning-color)',
                    fontWeight: 600, fontSize: '0.85rem'
                  }}>
                    {task.deadline}
                  </span>

                  <div className={styles.actionCell}>
                    <Link href={`/auditor/project/${task.id}`} className={styles.reviewButton}>
                      Verify Now
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* View All Link */}
              <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                <Link href="/auditor/project" style={{ color: 'var(--brand-color)', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  View All Assigned Projects <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Upcoming Site Visits (Pengganti Quick Actions/Transactions) */}
          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaMapMarkedAlt />
              <span>UPCOMING SITE VISITS</span>
            </h3>
            <div className={styles.transactionTable}>
              {upcomingVisits.map((visit) => (
                <div key={visit.id} className={styles.tableRow} style={{ gridTemplateColumns: '60px 1fr', alignItems:'start' }}>
                  
                  {/* Date Box */}
                  <div style={{
                    background: 'var(--nav-link-active-bg)', 
                    borderRadius: '8px', padding: '8px', 
                    textAlign: 'center', border: '1px solid var(--brand-color)',
                    color: 'var(--brand-color)'
                  }}>
                    <FaCalendarAlt style={{ display:'block', margin:'0 auto 4px auto'}}/>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, display:'block', lineHeight:1.2 }}>
                      {visit.date.split(' ')[0]}<br/>{visit.date.split(' ')[1]}
                    </span>
                  </div>

                  {/* Visit Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{visit.project}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaSearchLocation /> {visit.location}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Contact: {visit.contact}
                    </span>
                  </div>

                </div>
              ))}
              
              {/* Notice */}
              <div style={{ marginTop:'auto', padding:'16px', background:'var(--nav-link-hover-bg)', borderRadius:'8px', fontSize:'0.8rem', color:'var(--text-secondary)', display:'flex', gap:'8px', alignItems:'start' }}>
                <FaExclamationTriangle style={{ color:'var(--warning-color)', flexShrink:0, marginTop:'2px' }} />
                <span>Please ensure safety gear is prepared before visiting the site. Upload report within 24 hours after visit.</span>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}