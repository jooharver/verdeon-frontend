'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import styles from './AuditorReview.module.css';
import Topbar from '../../../components/Topbar'; 
import { 
  FaSearch, FaEye, FaClipboardCheck, FaCheckCircle, FaClock, FaBan, FaUserTie,
  FaChevronLeft, FaChevronRight, FaImage, FaPlayCircle
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Services
import { projectService } from '../../../../services/projectService';

// Modals
import ModalProjectView from '../../my-project/CRUD/ModalProjectView'; 
import ModalAuditProject from './Modals/ModalAuditProject'; 

const COLORS = ['#3b82f6', '#eab308', '#22c55e', '#ef4444'];

export default function AuditorReviewPage() {
  const pageTitle = "Audit Tasks";
  const pageBreadcrumbs = ["Dashboard", "Auditor", "Review"];

  // --- STATE ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  // Audit Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [projectToAudit, setProjectToAudit] = useState(null);

  // Pagination & Sort
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // --- 1. FETCH DATA KHUSUS AUDITOR ---
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Backend (auditorList) sudah memfilter hanya status yang siap di-audit
      const data = await projectService.getAuditorProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      Swal.fire('Error', 'Gagal memuat daftar tugas audit.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- FUNGSI HELPER URL ---
  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    let cleanPath = filePath.replace(/\\/g, '/');
    while (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    return `${baseUrl}/${cleanPath}`; 
  };
  
  const getProjectImage = (project) => {
    const imgDoc = project.active_version?.documents?.find(doc => doc.type === 'image');
    if (imgDoc && imgDoc.file_path) return getFullUrl(imgDoc.file_path); 
    return null;
  };

  // --- 3. DATA PROCESSING ---
  const stats = useMemo(() => {
    const total = projects.length;
    // Auditor peduli dengan status 'admin_approved' (Pending) dan 'auditor_verified' (Completed)
    const pending = projects.filter(p => p.active_version?.status === 'admin_approved').length;
    const completed = projects.filter(p => ['auditor_verified', 'rejected', 'listed'].includes(p.active_version?.status)).length;
    const inProgress = total - pending - completed; // Jika ada status 'auditing'
    
    const chartData = [
      { name: 'Pending', value: pending },
      { name: 'In Progress', value: inProgress },
      { name: 'Completed', value: completed },
    ].filter(item => item.value > 0);

    return { total, pending, inProgress, completed, chartData };
  }, [projects]);

  const processedProjects = useMemo(() => {
    let result = projects.filter(project => {
      const name = project.active_version?.name || "";
      const issuerName = project.issuer?.name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             issuerName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = ['name', 'status'].includes(sortConfig.key) ? a.active_version?.[sortConfig.key] : a[sortConfig.key];
        let valB = ['name', 'status'].includes(sortConfig.key) ? b.active_version?.[sortConfig.key] : b[sortConfig.key];
        valA = valA || ''; valB = valB || '';

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [projects, searchTerm, sortConfig]);

  const totalItems = processedProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProjects = processedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- 4. HANDLERS ---
  const handleView = (project) => {
    setProjectToView(project);
    setIsViewModalOpen(true);
  };

  const handleStartAudit = (project) => {
    setProjectToAudit(project);
    setIsAuditModalOpen(true);
  };

  // ACTION: Save Audit ke Backend
  const handleSaveAudit = async (projectId, payload) => {
    try {
      // Deteksi apakah payload berupa FormData (Verify) atau Object biasa (Reject)
      const isFormData = payload instanceof FormData;
      const action = isFormData ? payload.get('action') : payload.action;

      if (action === 'verify') {
        // Panggil endpoint verify dan WAJIB sertakan payload FormData-nya
        await projectService.auditorVerify(projectId, payload);
      } else if (action === 'reject') {
        // Panggil endpoint reject
        await projectService.auditorReject(projectId, { note: payload.audit_notes });
      } else {
         throw new Error("Aksi tidak valid");
      }
      
      Swal.fire('Success', 'Audit decision submitted successfully!', 'success');
      
      setIsAuditModalOpen(false);
      fetchProjects(); // Refresh data di tabel
    } catch (error) {
      console.error("Audit Submit Error:", error);
      const msg = error.response?.data?.message || error.message || 'Failed to submit audit report.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const renderStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'draft';
    const badges = {
      listed: { class: styles.badgeVerified, icon: <FaCheckCircle />, label: 'Listed' },
      auditor_verified: { class: styles.badgeVerified, icon: <FaCheckCircle />, label: 'Verified' },
      admin_approved: { class: styles.badgePending, icon: <FaClock />, label: 'Ready to Audit' }, 
      rejected: { class: styles.badgeRejected, icon: <FaBan />, label: 'Rejected' },
    };
    const conf = badges[s] || { class: styles.badgeDraft, icon: <FaClock />, label: s };
    return <span className={`${styles.badge} ${conf.class}`}>{conf.icon} {conf.label}</span>;
  };

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        {/* KPI SECTION */}
        <section className={styles.topGrid}>
          <div className={styles.statsGrid}>
            <StatCard icon={<FaClipboardCheck/>} className={styles.iconTotal} label="Total Tasks" value={stats.total} />
            <StatCard icon={<FaClock/>} className={styles.iconPending} label="Pending Audit" value={stats.pending} />
            <StatCard icon={<FaPlayCircle/>} className={styles.iconProgress} label="In Progress" value={stats.inProgress} />
            <StatCard icon={<FaCheckCircle/>} className={styles.iconVerified} label="Completed" value={stats.completed} />
          </div>
          
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Workload Distribution</h3>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* TABLE SECTION */}
        <section className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <h3 className={styles.cardTitle}>Assigned Projects</h3>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Search project name..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.table}>
              {/* HEADER */}
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={styles.tableCell} style={{justifyContent:'center'}}>Img</div>
                <div className={`${styles.tableCell} ${styles.sortable}`} onClick={()=>handleSort('name')}>Project Name</div>
                <div className={styles.tableCell}>Issuer</div>
                <div className={`${styles.tableCell} ${styles.sortable}`} onClick={()=>handleSort('status')}>Status</div>
                <div className={`${styles.tableCell} ${styles.sortable}`} onClick={()=>handleSort('created_at')}>Date</div>
                <div className={styles.tableCell} style={{justifyContent:'center'}}>Action</div>
              </div>

              {/* BODY */}
              {isLoading ? (
                <div className={styles.emptyState}>Loading tasks...</div>
              ) : paginatedProjects.length > 0 ? paginatedProjects.map(project => (
                <div className={styles.tableRow} key={project.id}>
                  <div className={styles.tableCell} style={{justifyContent:'center'}}>
                    {getProjectImage(project) ? (
                      <img src={getProjectImage(project)} alt="thumb" className={styles.thumbImg} onError={(e)=>{e.target.src="https://via.placeholder.com/40"}}/>
                    ) : (
                      <div className={styles.thumbPlaceholder}><FaImage /></div>
                    )}
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.projectName}>{project.active_version?.name || 'Unnamed'}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.issuerInfo}>
                      <FaUserTie /> {project.issuer?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className={styles.tableCell}>{renderStatusBadge(project.active_version?.status)}</div>
                  <div className={styles.tableCell}>
                    {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <button className={`${styles.actionBtn} ${styles.btnView}`} onClick={() => handleView(project)} title="View Detail">
                      <FaEye />
                    </button>
                    
                    {/* BUTTON AUDIT: Muncul jika status admin_approved */}
                    { project.active_version?.status === 'admin_approved' && (
                      <button className={`${styles.actionBtn} ${styles.btnAudit}`} onClick={() => handleStartAudit(project)} title="Start Verification">
                        <FaClipboardCheck />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>No audit tasks available.</div>
              )}
            </div>
          </div>

          {/* PAGINATION */}
          <div className={styles.cardFooter}>
            <span className={styles.footerInfo}>
              Showing {totalItems === 0 ? 0 : (currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, totalItems)} of {totalItems}
            </span>
            <div className={styles.paginationControls}>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}><FaChevronLeft /></button>
              <button className={styles.pageBtn} disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p+1)}><FaChevronRight /></button>
            </div>
          </div>
        </section>
      </main>

      {/* MODALS */}
      {isViewModalOpen && <ModalProjectView project={projectToView} onClose={() => setIsViewModalOpen(false)} />}
      
      {isAuditModalOpen && (
        <ModalAuditProject project={projectToAudit} onClose={() => setIsAuditModalOpen(false)} onSave={handleSaveAudit} />
      )}
    </div>
  );
}

function StatCard({ icon, className, label, value }) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.iconBox} ${className}`}>{icon}</div>
      <div className={styles.statInfo}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}</span>
      </div>
    </div>
  );
}