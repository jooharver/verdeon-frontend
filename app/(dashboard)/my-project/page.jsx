'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import styles from './MyProject.module.css';
import Topbar from '../../components/Topbar';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFileAlt, 
  FaCheckCircle, FaClock, FaLayerGroup, FaExclamationCircle,
  FaChevronLeft, FaChevronRight,
  FaSort, FaSortUp, FaSortDown, FaImage, FaEye, 
  FaSpinner, FaExchangeAlt, FaBan, FaUserShield, FaUserTie
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Service
import { projectService } from '../../../services/projectService';

// Import Modals
import ModalProjectForm from './CRUD/ModalProjectForm';
import ModalProjectView from './CRUD/ModalProjectView';

const salesData = [
  { month: 'Jan', sales: 400 }, { month: 'Feb', sales: 300 }, { month: 'Mar', sales: 600 },
  { month: 'Apr', sales: 800 }, { month: 'May', sales: 700 }, { month: 'Jun', sales: 900 },
  { month: 'Jul', sales: 1100 }, { month: 'Aug', sales: 1000 }, { month: 'Sep', sales: 1300 },
  { month: 'Oct', sales: 1500 }, { month: 'Nov', sales: 1700 }, { month: 'Dec', sales: 1900 },
];

export default function MyProjectPage() {
  const pageTitle = "My Project";
  const pageBreadcrumbs = ["Dashboard", "My Project"];

  // --- STATE ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);
  
  // Pagination & Sorting
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // --- 1. HELPER FUNCTIONS ---
  const getProjectImage = (project) => {
    const imgDoc = project.documents?.find(doc => doc.type === 'image');
    if (imgDoc) {
      // File path dari database sudah harusnya '/uploads/projects/...'
      const cleanPath = imgDoc.file_path.replace(/\\/g, '/');
      // Hasilnya akan menjadi: http://localhost:3000/uploads/projects/...
      return `${process.env.NEXT_PUBLIC_API_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
      // Catatan: Saya tambahkan pengecekan slash '/' agar tidak terjadi double slash
    }
    return null;
  };

  // RENDER BADGE (Support Global & Verification Status)
  const renderStatusBadge = (status, type = 'global') => {
    if (!status) return <span className={`${styles.badge} ${styles.badgeDraft}`}>-</span>;
    
    const s = status.toLowerCase();
    let config = {};

    // Config Icon & Warna berdasarkan Status
    switch (s) {
      // --- POSITIF ---
      case 'listed':
      case 'verified':
        config = { class: styles.badgePublished, icon: <FaCheckCircle />, label: status };
        break;
      
      // --- PROSES ---
      case 'submitted':
      case 'pending':
        config = { class: styles.badgePending, icon: <FaClock />, label: status };
        break;
      case 'on_review':
        config = { class: styles.badgeInReview, icon: <FaSpinner />, label: 'On Review' };
        break;
      
      // --- NEGATIF ---
      case 'rejected':
      case 'failed':
        config = { class: styles.badgeFailed, icon: <FaBan />, label: status };
        break;
      case 'revision':
        config = { class: styles.badgeRevision, icon: <FaExchangeAlt />, label: 'Revise' };
        break;

      // --- DEFAULT ---
      default:
        config = { class: styles.badgeDraft, icon: <FaFileAlt />, label: status };
    }

    return <span className={`${styles.badge} ${config.class}`}>{config.icon} {config.label}</span>;
  };

  // --- 2. FETCH DATA ---
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getMyProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching:", error);
      Swal.fire('Error', 'Gagal memuat data project.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- 3. DATA PROCESSING ---
  const stats = useMemo(() => ({
    total: projects.length,
    listed: projects.filter(p => p.status?.toLowerCase() === 'listed').length,
    onProcess: projects.filter(p => ['submitted', 'on_review', 'revision'].includes(p.status?.toLowerCase())).length,
  }), [projects]);

  const searchedProjects = useMemo(() => {
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const sortedProjects = useMemo(() => {
    let sortableProjects = [...searchedProjects];
    if (sortConfig.key) {
      sortableProjects.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableProjects;
  }, [searchedProjects, sortConfig]);

  const totalItems = sortedProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedProjects.slice(start, end);
  }, [sortedProjects, currentPage, itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // --- 4. HANDLERS ---
  const handleSave = async (formData) => {
    try {
      if (currentProject) {
        await projectService.updateProject(currentProject.id, formData);
        Swal.fire('Success', 'Project updated successfully.', 'success');
      } else {
        await projectService.createProject(formData);
        Swal.fire('Success', 'New project created.', 'success');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      Swal.fire('Failed', error.response?.data?.message || 'Operation failed.', 'error');
    }
  };

  const handleDelete = async (id) => { 
    const result = await Swal.fire({
      title: 'Delete Project?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete!',
    });

    if (result.isConfirmed) {
      try {
        await projectService.deleteProject(id);
        Swal.fire('Deleted!', 'Project has been deleted.', 'success');
        fetchProjects();
      } catch (error) {
        Swal.fire('Failed', 'Cannot delete project.', 'error');
      }
    }
  };

  const handleView = (project) => {
    setProjectToView(project);
    setIsViewModalOpen(true);
  };

  const handleCreate = () => { setCurrentProject(null); setIsModalOpen(true); };
  
  const handleEdit = (project) => { 
    const status = project.status?.toLowerCase();
    // Boleh edit jika Draft atau Revision
    if (['draft', 'revision'].includes(status)) {
      setCurrentProject(project); 
      setIsModalOpen(true); 
    } else {
      Swal.fire('Locked', 'Project is currently locked for review.', 'info');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FaSort className={styles.sortIcon} />;
    return sortConfig.direction === 'asc' ? <FaSortUp className={styles.sortIconActive} /> : <FaSortDown className={styles.sortIconActive} />;
  };

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        {/* --- OVERVIEW --- */}
        <section className={styles.topGrid}>
          <div className={styles.infoCard}>
            <h3>Project Overview</h3>
            <div className={styles.overviewStatsContainer}>
              <div className={styles.statItem}>
                <div className={`${styles.statItemIcon} ${styles.iconTotal}`}><FaLayerGroup /></div>
                <div className={styles.statItemInfo}>
                  <span className={styles.statItemLabel}>Total Projects</span>
                  <span className={styles.statItemValue}>{isLoading ? '...' : stats.total}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statItemIcon} ${styles.iconPublished}`}><FaCheckCircle /></div>
                <div className={styles.statItemInfo}>
                  <span className={styles.statItemLabel}>Listed</span>
                  <span className={styles.statItemValue}>{isLoading ? '...' : stats.listed}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statItemIcon} ${styles.iconReview}`}><FaClock /></div>
                <div className={styles.statItemInfo}>
                  <span className={styles.statItemLabel}>On Process</span>
                  <span className={styles.statItemValue}>{isLoading ? '...' : stats.onProcess}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`${styles.infoCard} ${styles.performanceCard}`}>
            <h3>Token Sale Performance</h3>
            <div className={styles.chartContainer}>
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* --- TABLE SECTION --- */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>All Projects</h3>
            <button className={styles.primaryButton} onClick={handleCreate}>
              <FaPlus /> <span>Create Project</span>
            </button>
          </div>

          <div className={styles.cardToolbar}>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Search..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.table}>
              
              {/* --- TABLE HEADER (UPDATED) --- */}
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={styles.tableCell} style={{ justifyContent: 'center' }}>Img</div>
                
                <div className={`${styles.tableCell} ${styles.tableCellSortable} ${styles.cellName}`}>
                  <button onClick={() => handleSort('name')}><span>Project Name</span> <SortIcon columnKey="name" /></button>
                </div>
                
                {/* 3 STATUS COLUMNS */}
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                   <button onClick={() => handleSort('status')}><span>Status</span> <SortIcon columnKey="status" /></button>
                </div>
                <div className={styles.tableCell}><FaUserShield /> Admin</div>
                <div className={styles.tableCell}><FaUserTie /> Auditor</div>

                <div className={styles.tableCell}>Capacity</div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                   <button onClick={() => handleSort('created_at')}><span>Date</span> <SortIcon columnKey="created_at" /></button>
                </div>
                <div className={styles.tableCell} style={{ justifyContent: 'center' }}>Actions</div>
              </div>

              {/* --- TABLE BODY --- */}
              {isLoading ? (
                <div className={styles.emptyState}>Loading data...</div>
              ) : paginatedProjects.length > 0 ? paginatedProjects.map(project => (
                <div className={styles.tableRow} key={project.id}>
                  
                  {/* Img */}
                  <div className={styles.tableCell} style={{ justifyContent: 'center' }}>
                    {getProjectImage(project) ? (
                      <img src={getProjectImage(project)} alt="thumb" className={styles.thumbImg} onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/40?text=IMG"; }} />
                    ) : (
                      <div className={styles.thumbPlaceholder}><FaImage /></div>
                    )}
                  </div>

                  {/* Name */}
                  <div className={`${styles.tableCell} ${styles.cellName}`}>
                    <span className={styles.projectName}>{project.name}</span>
                  </div>

                  {/* STATUS 1: GLOBAL */}
                  <div className={styles.tableCell}>
                    {renderStatusBadge(project.status)}
                  </div>

                  {/* STATUS 2: ADMIN */}
                  <div className={styles.tableCell}>
                    {renderStatusBadge(project.admin_verification_status)}
                  </div>

                  {/* STATUS 3: AUDITOR */}
                  <div className={styles.tableCell}>
                    {renderStatusBadge(project.auditor_verification_status)}
                  </div>

                  {/* Capacity */}
                  <div className={styles.tableCell}>
                    {project.issuerDetail?.panel_capacity_wp ? (project.issuerDetail.panel_capacity_wp * project.issuerDetail.number_of_panels).toLocaleString() : 0} Wp
                  </div>

                  {/* Date */}
                  <div className={styles.tableCell}>
                    {new Date(project.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <div className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <button className={styles.iconButton} onClick={() => handleView(project)} title="View">
                      <FaEye />
                    </button>
                    
                    {/* EDIT Disabled jika bukan Draft/Revision */}
                    <button 
                      className={`${styles.iconButton} ${!['draft', 'revision'].includes(project.status?.toLowerCase()) ? styles.iconDisabled : ''}`} 
                      onClick={() => handleEdit(project)}
                      disabled={!['draft', 'revision'].includes(project.status?.toLowerCase())}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    {/* DELETE Disabled jika sedang proses */}
                    <button 
                      className={`${styles.iconButton} ${['on_review', 'listed', 'auditing'].includes(project.status?.toLowerCase()) ? styles.iconDeleteDisabled : styles.iconDelete}`} 
                      onClick={() => handleDelete(project.id)}
                      disabled={['on_review', 'listed', 'auditing'].includes(project.status?.toLowerCase())}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}><p>No projects found.</p></div>
              )}
            </div>
          </div>

          {/* Footer Pagination */}
           <div className={styles.cardFooter}>
            <span className={styles.footerInfo}>Showing {startItem} - {endItem} of {totalItems} results</span>
            <div className={styles.footerControls}>
              <div className={styles.pagination}>
                 <button className={styles.paginationButton} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><FaChevronLeft /></button>
                 <button className={styles.paginationButton} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><FaChevronRight /></button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      {isModalOpen && <ModalProjectForm project={currentProject} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
      {isViewModalOpen && <ModalProjectView project={projectToView} onClose={() => setIsViewModalOpen(false)} />}
    </div>
  );
}