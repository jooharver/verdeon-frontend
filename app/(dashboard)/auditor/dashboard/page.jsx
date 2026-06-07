'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../admin/dashboard/Dashboard.module.css'; // Reuse CSS Admin
import Topbar from '../../../components/Topbar';
import Link from 'next/link';
import { 
  FaClipboardCheck, FaSearchLocation, FaCheckDouble, FaHistory, 
  FaMapMarkedAlt, FaCalendarAlt, FaArrowRight, FaFileContract,
  FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { projectService } from '../../../../services/projectService';

/* --- Komponen KpiCard (Reuse) --- */
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

export default function AuditorDashboardPage() {
  const pageTitle = "Auditor Workspace";
  const pageBreadcrumbs = ["Auditor", "Dashboard"];

  // --- STATE ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchAuditorData = async () => {
      try {
        setIsLoading(true);
        // Mengambil semua proyek yang di-assign ke Auditor ini
        const data = await projectService.getAuditorProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gagal menarik data auditor:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuditorData();
  }, []);

  // --- DATA PROCESSING (USE MEMO) ---

  // 1. Kalkulasi KPI
  const kpiStats = useMemo(() => {
    const pendingTasks = projects.filter(p => p.active_version?.status === 'admin_approved').length;
    const verifiedTasks = projects.filter(p => p.active_version?.status === 'auditor_verified' || p.active_version?.status === 'listed').length;
    
    // Hitung rata-rata hari review (dari admin_approved ke auditor_verified)
    let totalDays = 0;
    let countedReviews = 0;
    
    projects.forEach(p => {
      const v = p.active_version;
      if (v?.status === 'auditor_verified' && v?.updated_at && p.created_at) {
        const diffTime = Math.abs(new Date(v.updated_at) - new Date(p.created_at));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        countedReviews++;
      }
    });
    
    const avgReviewTime = countedReviews > 0 ? (totalDays / countedReviews).toFixed(1) : 'N/A';

    return [
      { 
        icon: <FaClipboardCheck />, 
        title: 'PENDING TASKS', 
        value: pendingTasks, 
        subtitle: 'Needs Verification',
        type: 'pending'
      },
      { 
        icon: <FaSearchLocation />, 
        title: 'SITE VISITS', 
        value: pendingTasks, // Dummy logic: 1 pending = 1 visit
        subtitle: 'Upcoming this month',
        type: 'default' 
      },
      { 
        icon: <FaCheckDouble />, 
        title: 'PROJECTS VERIFIED', 
        value: verifiedTasks, 
        subtitle: 'Total Completed',
        type: 'success'
      },
      { 
        icon: <FaHistory />, 
        title: 'AVG. REVIEW TIME', 
        value: `${avgReviewTime} Days`, 
        subtitle: 'Efficiency Rate',
        type: 'default' 
      }
    ];
  }, [projects]);

  // 2. Data Chart: Decision Distribution
  const decisionData = useMemo(() => {
    let verified = 0;
    let rejected = 0;

    projects.forEach(p => {
      const s = p.active_version?.status;
      if (s === 'auditor_verified' || s === 'listed') verified++;
      else if (s === 'rejected' || s === 'auditor_rejected') rejected++;
    });

    return [
      { name: 'Verified', value: verified }, 
      { name: 'Rejected', value: rejected },
    ].filter(item => item.value > 0);
  }, [projects]);

  const PIE_COLORS = ['#22c55e', '#ef4444'];

  // 3. Tabel: My Priority Tasks (Proyek dengan status 'admin_approved')
  const priorityTasks = useMemo(() => {
    return projects
      .filter(p => p.active_version?.status === 'admin_approved')
      .slice(0, 5); // Ambil 5 teratas
  }, [projects]);

  // 4. Data Dummy: Upcoming Visits (Karena tidak ada fitur penjadwalan di database)
  const upcomingVisits = useMemo(() => {
    return priorityTasks.map((p, index) => {
      // Bikin tanggal dummy (misal: 3, 5, 7 hari dari sekarang)
      const date = new Date();
      date.setDate(date.getDate() + (index + 1) * 2);
      
      return {
        id: p.id,
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        project: p.active_version?.name || 'Unnamed Project',
        location: p.active_version?.kota?.nama || 'Lokasi Belum Diatur',
        contact: p.issuer?.name || 'Issuer'
      };
    }).slice(0, 3);
  }, [priorityTasks]);

  // Data Dummy untuk Area Chart (Bisa dikembangkan nanti dengan data nyata)
  const auditActivityData = [
    { name: 'Week 1', Audits: 2 }, { name: 'Week 2', Audits: 4 }, 
    { name: 'Week 3', Audits: 1 }, { name: 'Week 4', Audits: Math.max(3, projects.length % 5) }, 
  ];

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
              {isLoading ? <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center'}}><FaSpinner className="fa-spin"/></div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={decisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={60} paddingAngle={5}>
                      {decisionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
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
              <div className={`${styles.tableRow} ${styles.tableHeader}`} style={{ gridTemplateColumns: '2fr 1fr' }}>
                <span>Project Name</span>
                <span style={{ textAlign: 'right' }}>Action</span>
              </div>
              
              {isLoading ? (
                <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}><FaSpinner className="fa-spin"/> Loading tasks...</div>
              ) : priorityTasks.length > 0 ? (
                priorityTasks.map((task) => (
                  <div key={task.id} className={styles.tableRow} style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className={styles.projectName}>
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontWeight:600}}>{task.active_version?.name || 'Unnamed Project'}</span>
                        <span style={{fontSize:'0.75rem', color:'var(--text-secondary)'}}>{task.active_version?.kota?.nama || '-'}</span>
                      </div>
                    </div>
                    
                    <div className={styles.actionCell}>
                      <Link href={`/auditor/projects`} className={styles.reviewButton}>
                        Verify Now
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>No pending tasks at the moment. Good job!</div>
              )}
              
              {/* View All Link */}
              <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                <Link href="/auditor/projects" style={{ color: 'var(--brand-color)', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  View All Assigned Projects <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Upcoming Site Visits */}
          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaMapMarkedAlt />
              <span>UPCOMING SITE VISITS</span>
            </h3>
            <div className={styles.transactionTable}>
              {upcomingVisits.length > 0 ? upcomingVisits.map((visit) => (
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
              )) : (
                 <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>No upcoming visits scheduled.</div>
              )}
              
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