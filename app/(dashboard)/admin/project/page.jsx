'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import styles from './AdminProject.module.css';
import Topbar from '../../../components/Topbar'; 
import { 
  FaSearch, FaEye, FaLayerGroup, FaCheckCircle, FaClock, FaBan, FaUserTie, FaSort, FaSortUp, FaSortDown,
  FaChevronLeft, FaChevronRight, FaImage, FaEdit, FaSpinner, FaRocket, FaChevronDown, FaHistory
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Services
import { projectService } from '../../../../services/projectService';

// Modals
import ModalProjectView from '../../my-project/CRUD/ModalProjectView'; 
import ModalVerifiedProject from './Modals/ModalVerifiedProject'; 
import ModalListingProject from './Modals/ModalListingProject';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#94a3b8'];

export default function AdminProject() {
  const pageTitle = "Project Verification";
  const pageBreadcrumbs = ["Dashboard", "Admin", "Projects"];

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Row Expand
  const [expandedRows, setExpandedRows] = useState([]);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  // Review Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [projectToVerify, setProjectToVerify] = useState(null);

  // Listing Modal State
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [projectToList, setProjectToList] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

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

  useEffect(() => {
    fetchProjects();
  }, []);

  // UBAH FUNGSI INI DI ADMINPROJECT.JSX
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

  const stats = useMemo(() => {
    const total = projects.length;
    const listed = projects.filter(p => p.active_version?.status === 'listed').length;
    const onReview = projects.filter(p => ['admin_approved', 'auditor_verified'].includes(p.active_version?.status)).length;
    const pending = projects.filter(p => p.active_version?.status === 'submitted').length;
    const rejected = projects.filter(p => p.active_version?.status === 'rejected').length;
    
    const chartData = [
      { name: 'Listed', value: listed },
      { name: 'On Review', value: onReview },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ].filter(item => item.value > 0);

    return { total, listed, onReview, pending, rejected, chartData };
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

  const handleView = (project, specificVersion = null) => {
    const projectDataToView = specificVersion ? { ...project, active_version: specificVersion } : project;
    setProjectToView(projectDataToView);
    setIsViewModalOpen(true);
  };

  const handleProcess = (project) => {
    setProjectToVerify(project);
    setIsVerifyModalOpen(true);
  };

  const handleSaveVerification = async (projectId, payload) => {
    try {
      if (payload.action === 'approve') {
        await projectService.adminApprove(projectId);
      } else if (payload.action === 'reject') {
        await projectService.adminReject(projectId, { note: payload.admin_notes });
      }
      Swal.fire('Success', 'Project verification updated successfully.', 'success');
      setIsVerifyModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Verification Error:", error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to update project.', 'error');
    }
  };

  const handleFinalList = async (projectId) => {
    try {
      await projectService.adminListProject(projectId);
      Swal.fire('Listed!', 'Project is now live on the Carbon Market.', 'success');
      setIsListingModalOpen(false); 
      fetchProjects(); 
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to list project.', 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleRowExpansion = (projectId) => {
    setExpandedRows(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FaSort className={styles.sortIcon} />;
    return sortConfig.direction === 'asc' ? <FaSortUp className={styles.sortIconActive} /> : <FaSortDown className={styles.sortIconActive} />;
  };

  const renderStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'draft';
    const badges = {
      listed: { class: styles.badgeVerified, icon: <FaCheckCircle />, label: 'Listed' },
      auditor_verified: { class: styles.badgeVerified, icon: <FaCheckCircle />, label: 'Ready to List' },
      admin_approved: { class: styles.badgePending, icon: <FaSpinner />, label: 'Auditor Review' },
      submitted: { class: styles.badgePending, icon: <FaClock />, label: 'Need Admin Action' },
      rejected: { class: styles.badgeRejected, icon: <FaBan />, label: 'Rejected' },
      draft: { class: styles.badgeDraft, icon: <FaLayerGroup />, label: 'Draft' }
    };
    const conf = badges[s] || badges.draft;
    return <span className={`${styles.badge} ${conf.class}`}>{conf.icon} {conf.label}</span>;
  };

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        {/* KPI & Chart Section */}
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
            <h3 className={styles.cardTitle}>All Submissions</h3>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Search project or issuer..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.table}>
              {/* HEADER */}
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={styles.tableCell} style={{ width: '120px', flex: 'none', paddingLeft: '16px' }}>Project ID</div>
                <div className={styles.tableCell} style={{ justifyContent: 'center', width: '80px', flex: 'none' }}>Img</div>
                <div className={`${styles.tableCell} ${styles.cellName}`} style={{ flex: 1.5, paddingLeft: '16px' }}>
                  <div className={styles.sortableHeader} onClick={()=>handleSort('name')}>
                    <span>Project Name</span> <SortIcon columnKey="name" />
                  </div>
                </div>
                <div className={`${styles.tableCell}`} style={{ flex: 1.5 }}>Issuer</div>
                <div className={`${styles.tableCell} ${styles.sortable}`} style={{ flex: 1.2 }} onClick={()=>handleSort('status')}>
                  <div className={styles.sortableHeader}>Status <SortIcon columnKey="status" /></div>
                </div>
                <div className={`${styles.tableCell} ${styles.sortable}`} style={{ flex: 1 }} onClick={()=>handleSort('created_at')}>
                  <div className={styles.sortableHeader}>Date <SortIcon columnKey="created_at" /></div>
                </div>
                <div className={styles.tableCell} style={{ justifyContent: 'center', flex: 1.5 }}>Actions</div>
              </div>

              {/* BODY */}
              {isLoading ? (
                <div className={styles.emptyState}>Loading data...</div>
              ) : paginatedProjects.length > 0 ? paginatedProjects.map(project => {
                const versionNumber = project.active_version?.version_number;
                const isExpanded = expandedRows.includes(project.id);
                const projectIdString = String(project.id).padStart(4, '0');
                const projectVersions = (project.versions || [project.active_version]).slice().sort((a, b) => a.version_number - b.version_number);
                const projectImgUrl = getProjectImage(project.active_version);

                return (
                  <React.Fragment key={project.id}>
                    <div className={`${styles.tableRow} ${styles.tableRowExpandable}`} onClick={() => toggleRowExpansion(project.id)}>
                      
                      {/* ID */}
                      <div className={styles.tableCell} style={{ width: '120px', flex: 'none', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px' }}>
                        <FaChevronDown className={`${styles.expandIcon} ${isExpanded ? styles.expandIconActive : ''}`} />
                        <span style={{ fontWeight: '700', color: '#6b7280', fontSize: '0.85rem' }}>#{projectIdString}</span>
                      </div>

                      {/* Img */}
                      <div className={styles.tableCell} style={{justifyContent:'center', width: '80px', flex: 'none'}}>
                        {projectImgUrl ? (
                          <img src={projectImgUrl} alt="thumb" className={styles.thumbImg} onError={(e)=>{e.target.style.display='none'}}/>
                        ) : (
                          <div className={styles.thumbPlaceholder}><FaImage /></div>
                        )}
                      </div>

                      {/* Name */}
                      <div className={`${styles.tableCell} ${styles.cellName}`} style={{ flex: 1.5, paddingLeft: '16px' }}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                          <span className={styles.projectName}>{project.active_version?.name || 'Unnamed'}</span>
                          <span style={{fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold'}}>Current: v{versionNumber}</span>
                        </div>
                      </div>

                      {/* Issuer */}
                      <div className={styles.tableCell} style={{ flex: 1.5 }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', fontWeight: '500'}}>
                          <FaUserTie /> {project.issuer?.name || 'Unknown'}
                        </div>
                      </div>

                      {/* Status */}
                      <div className={styles.tableCell} style={{ flex: 1.2 }}>{renderStatusBadge(project.active_version?.status)}</div>

                      {/* Date */}
                      <div className={styles.tableCell} style={{ flex: 1 }}>
                        {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>

                      {/* Actions */}
                      <div className={`${styles.tableCell} ${styles.actionsCell}`} style={{ flex: 1.5 }} onClick={e => e.stopPropagation()}>
                        <button className={`${styles.actionBtn} ${styles.btnView}`} onClick={() => handleView(project)} title="View Detail">
                          <FaEye />
                        </button>
                        
                        {project.active_version?.status === 'submitted' && (
                          <button className={`${styles.actionBtn} ${styles.btnProcess}`} onClick={() => handleProcess(project)} title="Review Project">
                            <FaEdit />
                          </button>
                        )}

                        {project.active_version?.status === 'auditor_verified' && (
                          <button className={`${styles.actionBtn} ${styles.btnProcess}`} style={{ backgroundColor: '#22c55e', color: 'white' }} onClick={() => { setProjectToList(project); setIsListingModalOpen(true); }} title="Finalize & List Project">
                            <FaRocket />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* HISTORY ROW */}
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
                                    <span className={styles.timelineName}>{ver.name}</span>
                                    <span className={styles.timelineDate}>
                                      <FaClock style={{ fontSize: '0.8rem' }}/> {new Date(ver.created_at).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  <div className={styles.timelineBadges}>
                                    {renderStatusBadge(ver.status)}
                                    <button className={styles.btnViewVersion} onClick={() => handleView(project, ver)}>
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

      {/* MODALS */}
      {isViewModalOpen && (
        <ModalProjectView 
          project={projectToView} 
          onClose={() => setIsViewModalOpen(false)} 
        />
      )}

      {isVerifyModalOpen && (
        <ModalVerifiedProject 
          project={projectToVerify}
          onClose={() => setIsVerifyModalOpen(false)}
          onSave={handleSaveVerification}
        />
      )}

      {isListingModalOpen && (
        <ModalListingProject 
          project={projectToList}
          onClose={() => setIsListingModalOpen(false)}
          onList={handleFinalList}
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