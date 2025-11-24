// app/(dashboard)/my-project/page.jsx

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
  FaSort, FaSortUp, FaSortDown, FaImage, FaEye // Tambahkan FaEye
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Service
import { projectService } from '../../../services/projectService';

// Import Modals
import ModalProjectForm from './CRUD/ModalProjectForm';
import ModalProjectView from './CRUD/ModalProjectView'; // Import Modal View Baru

// Data Dummy Grafik (Biarkan statis dulu)
const salesData = [
  { month: 'Jan', sales: 400 },
  { month: 'Feb', sales: 300 },
  { month: 'Mar', sales: 600 },
  { month: 'Apr', sales: 800 },
  { month: 'May', sales: 700 },
  { month: 'Jun', sales: 900 },
  { month: 'Jul', sales: 1100 },
  { month: 'Aug', sales: 1000 },
  { month: 'Sep', sales: 1300 },
  { month: 'Oct', sales: 1500 },
  { month: 'Nov', sales: 1700 },
  { month: 'Dec', sales: 1900 },
];

export default function MyProjectPage() {
  const pageTitle = "My Project";
  const pageBreadcrumbs = ["Dashboard", "My Project"];

  // --- STATE MANAGEMENT ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk Modal Form (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  // State untuk Modal View (Read Only)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);
  
  // Pagination & Sorting
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // --- 1. HELPER FUNCTIONS ---
  
  // Get Image URL from Project Documents
  const getProjectImage = (project) => {
    const imgDoc = project.documents?.find(doc => doc.type === 'image');
    
    if (imgDoc) {
      // Replace backslash (Windows path) to forward slash
      const cleanPath = imgDoc.file_path.replace(/\\/g, '/');
      // Construct Full URL
      return `${process.env.NEXT_PUBLIC_API_URL}/${cleanPath}`;
    }
    return null; // No image found
  };

  const renderStatusBadge = (status) => {
    const s = status ? status.toLowerCase() : 'draft';
    const config = {
      'published': { class: styles.badgePublished, icon: <FaCheckCircle />, label: 'Published' },
      'verified': { class: styles.badgePublished, icon: <FaCheckCircle />, label: 'Verified' },
      'in review': { class: styles.badgeInReview, icon: <FaClock />, label: 'In Review' },
      'submitted': { class: styles.badgeInReview, icon: <FaClock />, label: 'Submitted' },
      'auditing': { class: styles.badgeInReview, icon: <FaClock />, label: 'Auditing' },
      'draft': { class: styles.badgeDraft, icon: <FaFileAlt />, label: 'Draft' },
      'failed': { class: styles.badgeFailed, icon: <FaExclamationCircle />, label: 'Failed' },
      'rejected': { class: styles.badgeFailed, icon: <FaExclamationCircle />, label: 'Rejected' },
    };
    const style = config[s] || config['draft'];
    return <span className={`${styles.badge} ${style.class}`}>{style.icon} {style.label}</span>;
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

  // --- 3. DATA PROCESSING (STATS, FILTER, SORT, PAGINATION) ---
  const stats = useMemo(() => ({
    total: projects.length,
    published: projects.filter(p => p.status === 'verified' || p.status === 'Published').length,
    inReview: projects.filter(p => p.status === 'submitted' || p.status === 'auditing' || p.status === 'In Review').length,
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

  // --- 4. ACTION HANDLERS ---
  
  // Handle Save (Create/Update)
  const handleSave = async (formData) => {
    try {
      if (currentProject) {
        // Update
        await projectService.updateProject(currentProject.id, formData);
        Swal.fire('Berhasil', 'Project berhasil diperbarui.', 'success');
      } else {
        // Create
        await projectService.createProject(formData);
        Swal.fire('Berhasil', 'Project baru berhasil dibuat.', 'success');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Save Error:", error);
      Swal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
    }
  };

  // Handle Delete
  const handleDelete = async (id) => { 
    const result = await Swal.fire({
      title: 'Hapus Project?',
      text: "Data tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
    });

    if (result.isConfirmed) {
      try {
        await projectService.deleteProject(id);
        Swal.fire('Terhapus!', 'Project telah dihapus.', 'success');
        fetchProjects();
      } catch (error) {
        Swal.fire('Gagal', 'Gagal menghapus project.', 'error');
      }
    }
  };

  // Handle View Detail
  const handleView = (project) => {
    setProjectToView(project);
    setIsViewModalOpen(true);
  };

  // UI Handlers
  const handleCreate = () => { setCurrentProject(null); setIsModalOpen(true); };
  const handleEdit = (project) => { setCurrentProject(project); setIsModalOpen(true); };
  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FaSort className={styles.sortIcon} />;
    if (sortConfig.direction === 'asc') return <FaSortUp className={styles.sortIconActive} />;
    return <FaSortDown className={styles.sortIconActive} />;
  };

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        {/* --- OVERVIEW SECTION --- */}
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
                  <span className={styles.statItemLabel}>Published</span>
                  <span className={styles.statItemValue}>{isLoading ? '...' : stats.published}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statItemIcon} ${styles.iconReview}`}><FaClock /></div>
                <div className={styles.statItemInfo}>
                  <span className={styles.statItemLabel}>In Review</span>
                  <span className={styles.statItemValue}>{isLoading ? '...' : stats.inReview}</span>
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
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={styles.tableCell} style={{ justifyContent: 'center' }}>Img</div>
                
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('name')}><span>Name</span> <SortIcon columnKey="name" /></button>
                </div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                   <button onClick={() => handleSort('status')}><span>Status</span> <SortIcon columnKey="status" /></button>
                </div>
                <div className={styles.tableCell}>Capacity (Wp)</div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                   <button onClick={() => handleSort('created_at')}><span>Created At</span> <SortIcon columnKey="created_at" /></button>
                </div>
                <div className={styles.tableCell} style={{ justifyContent: 'center' }}>Actions</div>
              </div>

              {isLoading ? (
                <div className={styles.emptyState}>Loading data...</div>
              ) : paginatedProjects.length > 0 ? paginatedProjects.map(project => (
                <div className={styles.tableRow} key={project.id}>
                  
                  {/* 1. Image Thumbnail */}
                  <div className={styles.tableCell}>
                    {getProjectImage(project) ? (
                      <img 
                        src={getProjectImage(project)} 
                        alt="thumb" 
                        style={{ 
                          width: '40px', height: '40px', objectFit: 'cover', 
                          borderRadius: '6px', border: '1px solid var(--border-color)' 
                        }} 
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/40?text=IMG"; }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaImage style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                      </div>
                    )}
                  </div>

                  {/* 2. Name */}
                  <div className={styles.tableCell}>
                    <span className={styles.projectName}>{project.name}</span>
                  </div>

                  {/* 3. Status */}
                  <div className={styles.tableCell}>{renderStatusBadge(project.status)}</div>

                  {/* 4. Capacity */}
                  <div className={styles.tableCell}>
                    {project.issuerDetail?.panel_capacity_wp 
                      ? (project.issuerDetail.panel_capacity_wp * project.issuerDetail.number_of_panels).toLocaleString() 
                      : 0}
                  </div>

                  {/* 5. Date */}
                  <div className={styles.tableCell}>
                    {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {/* 6. Actions */}
                  <div className={`${styles.tableCell} ${styles.actionsCell}`}>
                    {/* Tombol VIEW */}
                    <button className={styles.iconButton} onClick={() => handleView(project)} title="View Detail">
                      <FaEye />
                    </button>
                    {/* Tombol EDIT */}
                    <button className={styles.iconButton} onClick={() => handleEdit(project)} title="Edit">
                      <FaEdit />
                    </button>
                    {/* Tombol DELETE */}
                    <button className={`${styles.iconButton} ${styles.iconDelete}`} onClick={() => handleDelete(project.id)} title="Delete">
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
              <select className={styles.perPageSelect} value={itemsPerPage} onChange={handleItemsPerPageChange}>
                 <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
              </select>
              <div className={styles.pagination}>
                 <button className={styles.paginationButton} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><FaChevronLeft /></button>
                 <button className={styles.paginationButton} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><FaChevronRight /></button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL FORM (INPUT) */}
      {isModalOpen && (
        <ModalProjectForm 
          project={currentProject} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}

      {/* MODAL VIEW (READ ONLY) */}
      {isViewModalOpen && (
        <ModalProjectView 
          project={projectToView} 
          onClose={() => setIsViewModalOpen(false)} 
        />
      )}

    </div>
  );
}