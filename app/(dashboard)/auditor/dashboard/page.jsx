'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../admin/dashboard/Dashboard.module.css'; // Reuse CSS Admin
import Topbar from '../../../components/Topbar';
import Link from 'next/link';
import { 
  FaClipboardCheck, FaSearchLocation, FaCheckDouble, FaHistory, 
  FaMapMarkedAlt, FaCalendarAlt, FaArrowRight, FaFileContract,
  FaExclamationTriangle, FaSpinner, FaTools, FaLeaf
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
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchAuditorData = async () => {
      try {
        setIsLoading(true);
        // Mengambil proyek yang di-assign ke Auditor
        const response = await projectService.getAuditorProjects();
        
        // 👉 FIX PAGINATION
        if (response?.data && Array.isArray(response.data)) {
            setProjects(response.data);
            setTotalProjectsCount(response.total || response.data.length);
        } else {
            const arr = Array.isArray(response) ? response : [];
            setProjects(arr);
            setTotalProjectsCount(arr.length);
        }
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
    const pendingTasks = projects.filter(p => ['admin_approved', 'returned_to_auditor'].includes(p.active_version?.status)).length;
    const verifiedTasks = projects.filter(p => ['auditor_verified', 'listed'].includes(p.active_version?.status)).length;
    const revisionTasks = projects.filter(p => p.active_version?.status === 'returned_to_auditor').length;
    
    return [
      { icon: <FaClipboardCheck />, title: 'PENDING TASKS', value: pendingTasks, subtitle: 'Needs Verification', type: 'pending' },
      { icon: <FaSearchLocation />, title: 'REVISION REQUESTS', value: revisionTasks, subtitle: 'Needs Action', type: 'default' },
      { icon: <FaCheckDouble />, title: 'TOTAL VERIFIED', value: verifiedTasks, subtitle: 'Completed Audits', type: 'success' },
      { icon: <FaTools />, title: 'TOTAL PROJECTS', value: totalProjectsCount, subtitle: 'Assigned to You', type: 'default' }
    ];
  }, [projects, totalProjectsCount]);

  // 2. Data Chart: Verification Methods
  const methodData = useMemo(() => {
    const counts = { SystemEstimated: 0, ActualInverter: 0 };
    projects.forEach(p => {
      const method = p.active_version?.audit_report?.calculation_method || p.active_version?.auditReport?.calculation_method;
      if (method === 'system_estimated') counts.SystemEstimated++;
      else if (method === 'actual_inverter') counts.ActualInverter++;
    });

    return [
      { name: 'System Estimated', value: counts.SystemEstimated }, 
      { name: 'Actual Inverter', value: counts.ActualInverter },
    ].filter(item => item.value > 0);
  }, [projects]);

  const PIE_COLORS = ['#3b82f6', '#8b5cf6'];

  // 3. Tabel: My Priority Tasks
  const priorityTasks = useMemo(() => {
    return projects
      .filter(p => ['admin_approved', 'returned_to_auditor'].includes(p.active_version?.status))
      .slice(0, 5); 
  }, [projects]);

  // 4. Data Dummy: Upcoming Visits
  const upcomingVisits = useMemo(() => {
    return priorityTasks.map((p, index) => {
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

  // 5. Tabel: Aktivitas On-Chain
  const recentOnChainActivity = useMemo(() => {
    const activities = [];
    projects.forEach(p => {
      if (p.snapshots && Array.isArray(p.snapshots)) {
        p.snapshots.forEach(snap => {
          if (snap.tx_hash) {
            activities.push({
              id: `snap-${snap.id}`,
              date: snap.created_at || p.updated_at,
              projectName: p.active_version?.name || 'Unnamed',
              walletAddress: p.issuer?.wallet_address,
              statusText: snap.status_at_snapshot,
              txHash: snap.tx_hash
            });
          }
        });
      }
      if (p.blockchain_tx) {
        activities.push({
          id: `mint-${p.id}`,
          date: p.updated_at,
          projectName: p.active_version?.name || 'Unnamed',
          walletAddress: p.issuer?.wallet_address,
          statusText: 'vct_minted',
          txHash: p.blockchain_tx
        });
      }
    });
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [projects]);

  const auditActivityData = [
    { name: 'Week 1', Audits: 2 }, { name: 'Week 2', Audits: 4 }, 
    { name: 'Week 3', Audits: 1 }, { name: 'Week 4', Audits: Math.max(3, projects.length % 5) }, 
  ];

  const formatAddress = (address) => address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '-';

  return (
    <div> 
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <main className={styles.container} style={{ paddingBottom: '100px' }}>
        
        <section className={styles.kpiGrid}>
          {kpiStats.map((data, index) => (
            <KpiCard key={index} {...data} isLoading={isLoading} />
          ))}
        </section>

        <section className={styles.chartsSection}>
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

          <div className={styles.chartCard}>
            <h3 className={styles.chartHeader}>VERIFICATION METHODS USED</h3>
            <div className={styles.chartWrapper} style={{ height: '300px' }}>
              {isLoading ? <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center'}}><FaSpinner className="fa-spin"/></div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={60} paddingAngle={5}>
                      {methodData.map((entry, index) => (
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

        <section className={styles.actionSection}>
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
                      <Link href={`/auditor/projects`} className={styles.reviewButton}>Verify Now</Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>No pending tasks. Good job!</div>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={`${styles.chartHeader} ${styles.iconHeader}`}>
              <FaMapMarkedAlt />
              <span>UPCOMING SITE VISITS</span>
            </h3>
            <div className={styles.transactionTable}>
              {upcomingVisits.length > 0 ? upcomingVisits.map((visit) => (
                <div key={visit.id} className={styles.tableRow} style={{ gridTemplateColumns: '60px 1fr', alignItems:'start' }}>
                  <div style={{background: 'var(--nav-link-active-bg)', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid var(--brand-color)', color: 'var(--brand-color)'}}>
                    <FaCalendarAlt style={{ display:'block', margin:'0 auto 4px auto'}}/>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, display:'block', lineHeight:1.2 }}>
                      {visit.date.split(' ')[0]}<br/>{visit.date.split(' ')[1]}
                    </span>
                  </div>
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
                 <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>No upcoming visits.</div>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}