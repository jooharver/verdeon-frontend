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
  FaChevronLeft, FaChevronRight, FaChevronDown,
  FaSort, FaSortUp, FaSortDown, FaImage, FaEye, 
  FaBan, FaUserShield, FaUserTie, FaPaperPlane, FaExchangeAlt, FaHistory
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Service
import { projectService } from '../../../services/projectService';

// Import Modals
import ModalProjectForm from './CRUD/ModalProjectForm';
import ModalProjectView from './CRUD/ModalProjectView';
import ModalSubmitProject from './CRUD/ModalSubmitProject'; 
import ModalViewRevise from './CRUD/ModalViewRevise'; 

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
  
  // State untuk Melacak Baris Tabel yang di-Expand
  const [expandedRows, setExpandedRows] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [projectToSubmit, setProjectToSubmit] = useState(null);
  
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [projectToRevise, setProjectToRevise] = useState(null);

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

  // --- HELPER UNTUK MENGAMBIL GAMBAR DARI API ---
  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    let cleanPath = filePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('public/')) {
      cleanPath = cleanPath.replace('public/', '');
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const backendRoot = apiBaseUrl.replace(/\/api\/?$/, ''); 
    return `${backendRoot}/storage/${cleanPath}`;
  };

  const getProjectImage = (version) => {
    const imgDoc = version?.documents?.find(doc => doc.type === 'image');
    if (imgDoc && imgDoc.file_path) return getFullUrl(imgDoc.file_path); 
    return null;
  };

  // --- DATA PROCESSING ---
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
      case 'revision':
        config = { class: styles.badgeFailed, icon: <FaBan />, label: status };
        break;
      default:
        config = { class: styles.badgeDraft, icon: <FaFileAlt />, label: status };
    }
    return <span className={`${styles.badge} ${config.class}`}>{config.icon} {config.label}</span>;
  };

  // --- HANDLERS ---
  const handleSave = () => {
      setIsModalOpen(false); 
      fetchProjects();       
  };

  const handleEdit = (project) => { 
    const status = project.active_version?.status?.toLowerCase();
    if (status === 'draft') {
      setCurrentProject(project); 
      setIsModalOpen(true); 
    } else {
      Swal.fire('Locked', 'Hanya proyek berstatus Draft yang dapat diubah. Jika Rejected, buat Revision terlebih dahulu.', 'info');
    }
  };

  const handleView = (project, specificVersion = null) => {
    const projectDataToView = specificVersion ? { ...project, active_version: specificVersion } : project;
    setProjectToView(projectDataToView);
    setIsViewModalOpen(true);
  };

  const handleOpenSubmitModal = (project) => {
    setProjectToSubmit(project);
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmitToAPI = async (projectId) => {
    try {
      await projectService.submitProject(projectId);
      Swal.fire('Submitted!', 'Your project is now under Admin review.', 'success');
      setIsSubmitModalOpen(false);
      fetchProjects();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to submit project.', 'error');
    }
  };

  const handleOpenReviseModal = (project) => {
    setProjectToRevise(project);
    setIsReviseModalOpen(true);
  };

  const handleConfirmReviseToAPI = async (projectId) => {
    try {
      await projectService.reviseProject(projectId);
      Swal.fire('Berhasil!', 'Versi Draft baru telah dibuat. Silakan klik tombol Edit untuk memperbaiki data.', 'success');
      setIsReviseModalOpen(false);
      fetchProjects();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal membuat revisi.', 'error');
    }
  };

  const handleDelete = async (project) => {
    const status = project.active_version?.status?.toLowerCase();
    const versionNumber = project.active_version?.version_number;

    if (status !== 'draft' || versionNumber > 1) {
      Swal.fire('Locked', 'Hanya proyek Draft awal (Versi 1) yang belum pernah diajukan yang dapat dihapus.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Hapus Proyek?',
      text: `Anda yakin ingin menghapus proyek "${project.active_version?.name || 'Unnamed'}" secara permanen?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await projectService.deleteProject(project.id);
        Swal.fire('Terhapus!', 'Proyek berhasil dihapus.', 'success');
        fetchProjects(); 
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Gagal menghapus proyek.', 'error');
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const toggleRowExpansion = (projectId) => {
    setExpandedRows(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
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
              
              {/* TABLE HEADER (Murni Mengikuti CSS Grid) */}
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={styles.tableCell}>Project ID</div>
                <div className={styles.tableCell} style={{ justifyContent: 'center' }}>Img</div>
                <div className={`${styles.tableCell} ${styles.cellName}`}>
                  <div className={styles.sortableHeader} onClick={() => handleSort('name')}>
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
              ) : paginatedProjects.length > 0 ? paginatedProjects.map(project => {
                
                const status = project.active_version?.status?.toLowerCase();
                const versionNumber = project.active_version?.version_number;
                
                const canEdit = status === 'draft';
                const canSubmit = status === 'draft';
                const canRevise = status === 'rejected';
                const canDelete = status === 'draft' && versionNumber === 1;

                const isExpanded = expandedRows.includes(project.id);
                const projectIdString = String(project.id).padStart(4, '0');
                
                // Mengurutkan versi dari v1 (terkecil) ke terbaru (terbesar)
                const projectVersions = (project.versions || [project.active_version])
                  .slice()
                  .sort((a, b) => a.version_number - b.version_number);
                
                const projectImgUrl = getProjectImage(project.active_version);

                return (
                  <React.Fragment key={project.id}>
                    {/* BARIS UTAMA */}
                    <div className={`${styles.tableRow} ${styles.tableRowExpandable}`} onClick={() => toggleRowExpansion(project.id)}>
                      
                      {/* ID & Chevron */}
                      <div className={styles.tableCell} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaChevronDown className={`${styles.expandIcon} ${isExpanded ? styles.expandIconActive : ''}`} />
                        <span style={{ fontWeight: '700', color: '#6b7280', fontSize: '0.85rem' }}>#{projectIdString}</span>
                      </div>

                      {/* Image Thumbnail */}
                      <div className={styles.tableCell} style={{ justifyContent: 'center' }}>
                        {projectImgUrl ? (
                          <img 
                            src={projectImgUrl} 
                            alt="thumb" 
                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e5e7eb' }} 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={styles.thumbPlaceholder} style={{ width: '40px', height: '40px' }}><FaImage /></div>
                        )}
                      </div>

                      {/* Name Column */}
                      <div className={`${styles.tableCell} ${styles.cellName}`}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                          <span className={styles.projectName}>{project.active_version?.name || 'Unnamed'}</span>
                          <span style={{fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold'}}>Current: v{versionNumber}</span>
                        </div>
                      </div>

                      {/* Status Columns */}
                      <div className={styles.tableCell}>{renderStatusBadge(project.active_version?.status)}</div>
                      <div className={styles.tableCell}>{renderStatusBadge(project.active_version?.admin_verification_status)}</div>
                      <div className={styles.tableCell}>{renderStatusBadge(project.active_version?.auditor_verification_status)}</div>
                      
                      {/* Date Column */}
                      <div className={styles.tableCell}>
                        {new Date(project.created_at).toLocaleDateString('id-ID')}
                      </div>
                      
                      {/* ACTIONS */}
                      <div className={`${styles.tableCell} ${styles.actionsCell}`} onClick={e => e.stopPropagation()}>
                        <button className={styles.iconButton} onClick={() => handleView(project)} title="View Detail">
                          <FaEye />
                        </button>
                        
                        <button 
                          className={`${styles.iconButton} ${!canEdit ? styles.iconDisabled : ''}`} 
                          onClick={() => handleEdit(project)}
                          disabled={!canEdit}
                          title="Edit Project"
                        >
                          <FaEdit />
                        </button>

                        <button 
                          className={`${styles.iconButton} ${!canDelete ? styles.iconDisabled : ''}`} 
                          onClick={() => handleDelete(project)}
                          disabled={!canDelete}
                          title="Delete Project"
                          style={canDelete ? { color: '#ef4444' } : {}}
                        >
                          <FaTrash />
                        </button>

                        {canRevise ? (
                          <button 
                            className={styles.iconButton} 
                            onClick={() => handleOpenReviseModal(project)}
                            title="Review & Revise"
                            style={{ color: '#eab308' }}
                          >
                            <FaExchangeAlt />
                          </button>
                        ) : (
                          <button 
                            className={`${styles.iconButton} ${!canSubmit ? styles.iconDisabled : ''}`} 
                            onClick={() => handleOpenSubmitModal(project)}
                            disabled={!canSubmit}
                            title="Review & Submit"
                            style={canSubmit ? { color: '#3b82f6' } : {}}
                          >
                            <FaPaperPlane />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* BARIS HISTORY (TIMELINE) */}
                    {isExpanded && (
                      <div className={styles.historyRow}>
                        <h4 className={styles.historyTitle}><FaHistory /> Version History</h4>
                        <div className={styles.timeline}>
                          {projectVersions.map((ver) => {
                            const isLatest = ver.id === project.active_version?.id;
                            return (
                              <div className={styles.timelineItem} key={ver.id}>
                                <div className={styles.timelineLine}></div>
                                <div className={`${styles.timelineDot} ${isLatest ? styles.timelineDotActive : ''}`}>
                                  v{ver.version_number}
                                </div>
                                <div className={styles.timelineContent}>
                                  <div className={styles.timelineInfo}>
                                    {/* FONT KECIL SESUAI PERMINTAAN */}
                                    <span className={styles.timelineName}>{ver.name}</span>
                                    <span className={styles.timelineDate}>
                                      <FaClock style={{ fontSize: '0.8rem' }}/> {new Date(ver.created_at).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  <div className={styles.timelineBadges}>
                                    {renderStatusBadge(ver.status)}
                                    <button 
                                      className={styles.btnViewVersion} 
                                      onClick={() => handleView(project, ver)} 
                                    >
                                      <FaEye /> View Data
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              }) : (
                <div className={styles.emptyState}>No projects found.</div>
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

      {isModalOpen && <ModalProjectForm project={currentProject} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
      
      {isViewModalOpen && <ModalProjectView project={projectToView} onClose={() => setIsViewModalOpen(false)} />}
      
      {isSubmitModalOpen && (
        <ModalSubmitProject 
          project={projectToSubmit} 
          onClose={() => setIsSubmitModalOpen(false)} 
          onSubmit={handleConfirmSubmitToAPI} 
        />
      )}

      {isReviseModalOpen && (
        <ModalViewRevise 
          project={projectToRevise} 
          onClose={() => setIsReviseModalOpen(false)} 
          onRevise={handleConfirmReviseToAPI} 
        />
      )}
    </div>
  );
}