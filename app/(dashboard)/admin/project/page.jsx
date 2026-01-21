'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import styles from './AdminProject.module.css';
import Topbar from '../../../components/Topbar'; 
import { 
  FaSearch, FaEye, FaLayerGroup, FaCheckCircle, FaClock, FaBan, FaUserTie,
  FaChevronLeft, FaChevronRight, FaImage, FaEdit, FaSpinner, FaExchangeAlt
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Services
import { projectService } from '../../../../services/projectService';
import { userService } from '../../../../services/userService';

// Modals
import ModalProjectView from '../../my-project/CRUD/ModalProjectView'; 
import ModalVerifiedProject from './Modals/ModalVerifiedProject'; 

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#94a3b8'];

export default function AdminProject() {
  const pageTitle = "Project Verification";
  const pageBreadcrumbs = ["Dashboard", "Admin", "Projects"];

  // --- STATE ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View Modal State (Detail Read-Only)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  // --- STATE VERIFICATION MODAL ---
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [projectToVerify, setProjectToVerify] = useState(null);
  const [auditors, setAuditors] = useState([]); 

  // Pagination & Sort
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // --- 1. FETCH DATA ---
  
  // A. Fetch Projects
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getAllProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      Swal.fire('Error', 'Gagal memuat data project.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // B. Fetch Auditors
  const fetchAuditors = async () => {
    try {
      const data = await userService.getAuditors();
      setAuditors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching auditors:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchAuditors(); 
  }, []);

    // --- FUNGSI HELPER getFullUrl (Koreksi) ---
  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    
    let cleanPath = filePath.replace(/\\/g, '/');
    
    // Hapus semua leading slash agar tidak double slash saat digabung
    while (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Ambil BASE URL (http://localhost:3001)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    
    // Gabungkan: (http://localhost:3001) + / + (uploads/projects/...)
    return `${baseUrl}/${cleanPath}`; 
  };

  // --- 2. HELPER IMAGE ---
  const getProjectImage = (project) => {
    const imgDoc = project.documents?.find(doc => doc.type === 'image');
    if (imgDoc && imgDoc.file_path) {
      // Panggil getFullUrl yang sudah diperbaiki
      return getFullUrl(imgDoc.file_path); 
    }
    return null;
  };

  // --- 3. DATA PROCESSING ---
  const stats = useMemo(() => {
    const total = projects.length;
    // Update logic stats sesuai status baru
    const listed = projects.filter(p => p.status?.toLowerCase() === 'listed').length;
    const onReview = projects.filter(p => p.status?.toLowerCase() === 'on_review').length;
    const pending = projects.filter(p => p.status?.toLowerCase() === 'submitted').length;
    const rejected = projects.filter(p => p.status?.toLowerCase() === 'rejected').length;
    
    const chartData = [
      { name: 'Listed', value: listed },
      { name: 'On Review', value: onReview },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ].filter(item => item.value > 0);

    return { total, listed, onReview, pending, rejected, chartData };
  }, [projects]);

  const processedProjects = useMemo(() => {
    let result = projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.issuer?.name && project.issuer.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [projects, searchTerm, sortConfig]);

  const totalItems = processedProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProjects = processedProjects.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // --- 4. HANDLERS ---
  
  const handleView = (project) => {
    setProjectToView(project);
    setIsViewModalOpen(true);
  };

  const handleProcess = (project) => {
    setProjectToVerify(project);
    setIsVerifyModalOpen(true);
  };

  // [UPDATED] Simpan Hasil Verifikasi menggunakan Service Baru
  const handleSaveVerification = async (projectId, payload) => {
    try {
      // Panggil endpoint admin-process
      await projectService.processAdminVerification(projectId, payload);
      
      Swal.fire('Success', 'Project status updated successfully.', 'success');
      setIsVerifyModalOpen(false);
      fetchProjects(); // Refresh Data
    } catch (error) {
      console.error("Verification Error:", error);
      const msg = error.response?.data?.message || 'Failed to update project.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // --- RENDER HELPERS ---
  const renderStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'draft';
    
    // Mapping Status Baru
    const badges = {
      listed: { class: styles.badgeVerified, icon: <FaCheckCircle />, label: 'Listed' },
      on_review: { class: styles.badgePending, icon: <FaSpinner />, label: 'On Auditor Review' },
      submitted: { class: styles.badgePending, icon: <FaClock />, label: 'Need Admin Action' },
      revision: { class: styles.badgePending, icon: <FaExchangeAlt />, label: 'Revision Needed' },
      rejected: { class: styles.badgeRejected, icon: <FaBan />, label: 'Rejected' },
      draft: { class: styles.badgeDraft, icon: <FaLayerGroup />, label: 'Draft' }
    };

    // Fallback jika status tidak dikenali
    const conf = badges[s] || badges.draft;
    
    return <span className={`${styles.badge} ${conf.class}`}>{conf.icon} {conf.label}</span>;
  };

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        {/* GRID ATAS (KPI & Chart) */}
        <section className={styles.topGrid}>
          <div className={styles.statsGrid}>
            <StatCard icon={<FaLayerGroup/>} className={styles.iconTotal} label="Total Projects" value={stats.total} />
            <StatCard icon={<FaClock/>} className={styles.iconPending} label="Need Action" value={stats.pending} />
            <StatCard icon={<FaSpinner/>} className={styles.iconPending} label="On Review" value={stats.onReview} />
            <StatCard icon={<FaCheckCircle/>} className={styles.iconVerified} label="Listed" value={stats.listed} />
          </div>
          
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Status Distribution</h3>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80} paddingAngle={5}
                    dataKey="value" stroke="none"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* TABLE SECTION */}
        <section className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <h3 className={styles.cardTitle}>All Submissions</h3>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input 
                type="text" placeholder="Search project or issuer..." 
                className={styles.searchInput} 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
              />
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
                <div className={styles.tableCell} style={{justifyContent:'center'}}>Actions</div>
              </div>

              {/* BODY */}
              {isLoading ? (
                <div className={styles.emptyState}>Loading data...</div>
              ) : paginatedProjects.length > 0 ? paginatedProjects.map(project => (
                <div className={styles.tableRow} key={project.id}>
                  
                  {/* Img */}
                  <div className={styles.tableCell} style={{justifyContent:'center'}}>
                    {getProjectImage(project) ? (
                      <img src={getProjectImage(project)} alt="thumb" className={styles.thumbImg} onError={(e)=>{e.target.src="https://via.placeholder.com/40"}}/>
                    ) : (
                      <div className={styles.thumbPlaceholder}><FaImage /></div>
                    )}
                  </div>

                  {/* Name */}
                  <div className={styles.tableCell}>
                    <span className={styles.projectName}>{project.name}</span>
                  </div>

                  {/* Issuer */}
                  <div className={styles.tableCell}>
                    <div className={styles.issuerInfo}>
                      <FaUserTie /> {project.issuer?.name || 'Unknown'}
                    </div>
                  </div>

                  {/* Status */}
                  <div className={styles.tableCell}>{renderStatusBadge(project.status)}</div>

                  {/* Date */}
                  <div className={styles.tableCell}>
                    {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <div className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <button className={`${styles.actionBtn} ${styles.btnView}`} onClick={() => handleView(project)} title="View Detail">
                      <FaEye />
                    </button>
                    
                    {/* Munculkan tombol Process jika masih Submitted atau Revision */}
                    { ['submitted', 'revision'].includes(project.status?.toLowerCase()) && (
                      <button 
                        className={`${styles.actionBtn} ${styles.btnProcess}`} 
                        onClick={() => handleProcess(project)} 
                        title="Process Verification"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </div>

                </div>
              )) : (
                <div className={styles.emptyState}>No projects found.</div>
              )}
            </div>
          </div>

          {/* PAGINATION */}
          <div className={styles.cardFooter}>
            <span className={styles.footerInfo}>
              Showing {(currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, totalItems)} of {totalItems}
            </span>
            <div className={styles.paginationControls}>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}><FaChevronLeft /></button>
              <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)}><FaChevronRight /></button>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL VIEW DETAIL */}
      {isViewModalOpen && (
        <ModalProjectView 
          project={projectToView} 
          onClose={() => setIsViewModalOpen(false)} 
        />
      )}

      {/* MODAL VERIFICATION */}
      {isVerifyModalOpen && (
        <ModalVerifiedProject 
          project={projectToVerify}
          auditors={auditors} 
          onClose={() => setIsVerifyModalOpen(false)}
          onSave={handleSaveVerification}
        />
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