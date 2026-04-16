'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import styles from './MyProject.module.css';
import Topbar from '../../components/Topbar';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFileAlt, 
  FaCheckCircle, FaClock, FaLayerGroup,
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

  // --- FETCH DATA ---
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

  // --- DATA PROCESSING (Fixed for Laravel active_version) ---
  const stats = useMemo(() => ({
    total: projects.length,
    listed: projects.filter(p => p.active_version?.status === 'listed').length,
    onProcess: projects.filter(p => 
      ['submitted', 'admin_approved', 'auditor_verified'].includes(p.active_version?.status)
    ).length,
  }), [projects]);

  const searchedProjects = useMemo(() => {
    return projects.filter(project => {
      const name = project.active_version?.name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [projects, searchTerm]);

  const sortedProjects = useMemo(() => {
    let sortableProjects = [...searchedProjects];
    if (sortConfig.key) {
      sortableProjects.sort((a, b) => {
        let valA, valB;
        
        // Mapping untuk key yang ada di dalam active_version
        if (['name', 'status', 'admin_verification_status', 'auditor_verification_status'].includes(sortConfig.key)) {
          valA = a.active_version?.[sortConfig.key] || '';
          valB = b.active_version?.[sortConfig.key] || '';
        } else {
          valA = a[sortConfig.key] || '';
          valB = b[sortConfig.key] || '';
        }

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

  // --- RENDER BADGE ---
  const renderStatusBadge = (status) => {
    if (!status) return <span className={`${styles.badge} ${styles.badgeDraft}`}>-</span>;
    
    const s = status.toLowerCase();
    let config = {};

    switch (s) {
      case 'listed':
      case 'approved':
      case 'auditor_verified':
        config = { class: styles.badgePublished, icon: <FaCheckCircle />, label: status };
        break;
      case 'submitted':
      case 'pending':
      case 'admin_approved':
        config = { class: styles.badgePending, icon: <FaClock />, label: status };
        break;
      case 'rejected':
        config = { class: styles.badgeFailed, icon: <FaBan />, label: status };
        break;
      default:
        config = { class: styles.badgeDraft, icon: <FaFileAlt />, label: status };
    }

    return <span className={`${styles.badge} ${config.class}`}>{config.icon} {config.label}</span>;
  };

  // --- HANDLERS ---
  const handleSave = () => {
      setIsModalOpen(false); // Tutup modal
      fetchProjects();       // Tarik ulang data terbaru dari database
    };

  const handleEdit = (project) => { 
    const status = project.active_version?.status?.toLowerCase();
    if (['draft', 'rejected'].includes(status)) {
      setCurrentProject(project); 
      setIsModalOpen(true); 
    } else {
      Swal.fire('Locked', 'Project is currently locked for review.', 'info');
    }
  };

  const handleView = (project) => {
    setProjectToView(project);
    setIsViewModalOpen(true);
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
            </div>
          </div>
          <div className={`${styles.infoCard} ${styles.performanceCard}`}>
            <h3>Token Sale Performance</h3>
            <div className={styles.chartContainer}>
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#16a34a" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* --- TABLE SECTION --- */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>All Projects</h3>
            <button className={styles.primaryButton} onClick={() => { setCurrentProject(null); setIsModalOpen(true); }}>
              <FaPlus /> <span>Create Project</span>
            </button>
          </div>

          <div className={styles.cardToolbar}>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Search project name..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.table}>
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={styles.tableCell} style={{ justifyContent: 'center' }}>Img</div>
                <div className={`${styles.tableCell} ${styles.cellName}`}>
                  {/* Hapus button lama, ganti dengan struktur ini */}
                  <div 
                    className={styles.sortableHeader} 
                    onClick={() => handleSort('name')}
                  >
                    <span>Project Name</span>
                    <SortIcon columnKey="name" />
                  </div>
                </div>
                <div className={styles.tableCell}>Status</div>
                <div className={styles.tableCell}><FaUserShield /> Admin</div>
                <div className={styles.tableCell}><FaUserTie /> Auditor</div>
                <div className={styles.tableCell}>Date</div>
                <div className={styles.tableCell} style={{ justifyContent: 'center' }}>Actions</div>
              </div>

              {isLoading ? (
                <div className={styles.emptyState}>Loading projects...</div>
              ) : paginatedProjects.length > 0 ? paginatedProjects.map(project => (
                <div className={styles.tableRow} key={project.id}>
                  <div className={styles.tableCell} style={{ justifyContent: 'center' }}>
                    <div className={styles.thumbPlaceholder}><FaImage /></div>
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellName}`}>
                    <span className={styles.projectName}>{project.active_version?.name || 'Unnamed'}</span>
                  </div>
                  <div className={styles.tableCell}>{renderStatusBadge(project.active_version?.status)}</div>
                  <div className={styles.tableCell}>{renderStatusBadge(project.active_version?.admin_verification_status)}</div>
                  <div className={styles.tableCell}>{renderStatusBadge(project.active_version?.auditor_verification_status)}</div>
                  <div className={styles.tableCell}>
                    {new Date(project.created_at).toLocaleDateString('id-ID')}
                  </div>
                  <div className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <button className={styles.iconButton} onClick={() => handleView(project)}><FaEye /></button>
                    <button 
                      className={`${styles.iconButton} ${!['draft', 'rejected'].includes(project.active_version?.status) ? styles.iconDisabled : ''}`} 
                      onClick={() => handleEdit(project)}
                      disabled={!['draft', 'rejected'].includes(project.active_version?.status)}
                    >
                      <FaEdit />
                    </button>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>No projects found.</div>
              )}
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && <ModalProjectForm project={currentProject} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
      {isViewModalOpen && <ModalProjectView project={projectToView} onClose={() => setIsViewModalOpen(false)} />}
    </div>
  );
}