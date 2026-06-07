'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import styles from './AuditorReview.module.css';
import Topbar from '../../../components/Topbar'; 
import { 
  FaSearch, FaEye, FaClipboardCheck, FaCheckCircle, FaClock, FaBan, FaUserTie, FaSort, 
  FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight, FaImage, FaPlayCircle, FaChevronDown, FaHistory,
  FaExclamationTriangle
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Services
import { projectService } from '../../../../services/projectService';
import { api } from '../../../../services/api'; 

import { connectWallet, addTrackingToBlockchain } from '../../../utils/web3Config';
import { useAuth } from '../../../../context/AuthContext';

// Modals
import ModalProjectView from '../../my-project/CRUD/ModalProjectView'; 
import ModalAuditProject from './Modals/ModalAuditProject'; 

const COLORS = ['#3b82f6', '#eab308', '#22c55e', '#ef4444'];

export default function AuditorReviewPage() {
  const pageTitle = "Audit Tasks";
  const pageBreadcrumbs = ["Dashboard", "Auditor", "Review"];

  const { user } = useAuth();
  const auditorWallet = user?.wallet_address;

  // --- STATE ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [expandedRows, setExpandedRows] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [projectToAudit, setProjectToAudit] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
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
    const pending = projects.filter(p => ['admin_approved', 'returned_to_auditor'].includes(p.active_version?.status)).length;
    const completed = projects.filter(p => ['auditor_verified', 'rejected', 'listed'].includes(p.active_version?.status)).length;
    const inProgress = total - pending - completed; 
    
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

  const handleView = (project, specificVersion = null) => {
    const projectDataToView = specificVersion ? { ...project, active_version: specificVersion } : project;
    setProjectToView(projectDataToView);
    setIsViewModalOpen(true);
  };

  const handleStartAudit = (project) => {
    setProjectToAudit(project);
    setIsAuditModalOpen(true);
  };

  // ==============================================================
  // 🔥 FUNGSI UTAMA: INTEGRASI SAGA PATTERN + ANTI SPLIT-BRAIN
  // ==============================================================
  const handleSaveAudit = async (projectId, payload) => {
    try {
      if (!auditorWallet) throw new Error("Anda belum mengatur/menghubungkan dompet Web3 di profil Anda!");

      Swal.fire({
        title: 'Menyiapkan Data...',
        html: 'Menyimpan laporan audit ke server Verideon...',
        allowOutsideClick: false,
        allowEscapeKey: false,       
        showConfirmButton: false,    
        didOpen: () => { Swal.showLoading(); }
      });

      // 1. IDENTIFIKASI STATUS SEBELUMNYA UNTUK FAIL-SAFE (ROLLBACK)
      const previousStatus = projectToAudit.active_version.status;
      
      const isFormData = payload instanceof FormData;
      const action = isFormData ? payload.get('action') : payload.action;
      const actionStatus = action === 'verify' ? 'auditor_verified' : 'auditor_rejected';
      const versionNumber = projectToAudit.active_version.version_number;

      // 2. [SAGA STEP 1]: BACKEND FIRST (Simpan Data & Bikin Snapshot JSON)
      let backendResponse;
      if (action === 'verify') {
        backendResponse = await projectService.auditorVerify(projectId, payload, ""); 
      } else {
        backendResponse = await projectService.auditorReject(projectId, { note: payload.audit_notes }, "");
      }

      // 👉 KUNCI: AMBIL HASH, URI, DAN ID SNAPSHOT LANGSUNG DARI LARAVEL
      const exactDataHash = backendResponse.dataHash;
      const exactUri = backendResponse.snapshotUri;
      const exactSnapshotId = backendResponse.snapshotId;

      let finalTxHash = null;
      let hasTxSuccess = false; // 👉 BENDERA ANTI SPLIT-BRAIN

      // 3. [SAGA STEP 2]: BLOCKCHAIN EXECUTION DENGAN FAIL-SAFE
      try {
        Swal.update({ 
          title: 'Tanda Tangan Web3', 
          html: 'Mohon konfirmasi transaksi pencatatan (*Add Tracking*) di MetaMask Anda.' 
        });

        await connectWallet(auditorWallet); 
        
        const eventNameAuditor = action === 'verify' 
            ? "Auditor Technical Verification Approved" 
            : "Auditor Technical Verification Rejected";

        const receiptTrack = await addTrackingToBlockchain(
            auditorWallet,        
            projectId,            
            projectId,            
            versionNumber,        
            eventNameAuditor,     
            actionStatus,         
            exactDataHash,        
            exactUri              
        );
        
        hasTxSuccess = true; // ✅ TX AUDIT BERHASIL! (Haram Rollback)
        finalTxHash = receiptTrack.hash || receiptTrack.transactionHash;

      } catch (web3Error) {
        // 4. [SAGA STEP 3]: FAIL-SAFE AUTO ROLLBACK ATAU PENYELAMATAN
        console.error("Web3 Error (MetaMask ditolak):", web3Error);
        
        // 👉 LOGIKA PENYELAMAT NYAWA:
        if (!hasTxSuccess) {
            Swal.update({ 
              title: 'Membatalkan...', 
              html: 'Transaksi dibatalkan. Mengembalikan status sistem (Rollback) demi keamanan...' 
            });

            await projectService.revertStatus(projectId, previousStatus);

            if (web3Error.message && web3Error.message.includes('MISMATCH_WALLET')) {
                const cleanMsg = web3Error.message.split('|')[1];
                Swal.fire('Dompet Tidak Sesuai', cleanMsg, 'error');
            } else {
                Swal.fire('Dibatalkan', 'Transaksi dibatalkan melalui MetaMask. Data sistem telah otomatis dikembalikan (Rollback).', 'warning');
            }
        } else {
            // JIKA BLOCKCHAIN SUDAH JALAN, JANGAN ROLLBACK!
            Swal.fire('Info Jaringan', 'Transaksi berhasil di Blockchain, namun sinkronisasi UI agak terlambat karena jaringan sibuk. Data Anda aman!', 'success');
        }

        setIsAuditModalOpen(false);
        fetchProjects();
        return; // 👉 BERHENTI DI SINI AGAR TIDAK KE TAHAP SELANJUTNYA
      }

      // 5. [SAGA STEP 4]: SINKRONISASI TX HASH PRESISI KE ID SNAPSHOT
      if (finalTxHash) {
        try {
          Swal.update({ title: 'Finalisasi...', html: 'Menyinkronkan transaksi ke database...' });
          await projectService.saveTxHash(projectId, finalTxHash, exactSnapshotId);
        } catch (dbError) {
          console.warn("TxHash gagal disinkronkan ke DB:", dbError);
        }
      }
      
      Swal.fire('Success', 'Hasil Audit MRV berhasil dikomputasi dan dicatat permanen ke Blockchain.', 'success');
      setIsAuditModalOpen(false);
      fetchProjects(); 

    } catch (error) {
      console.error("Backend Error:", error);
      Swal.fire('Error', error.response?.data?.message || error.message || 'Gagal menyimpan data ke server.', 'error');
      setIsAuditModalOpen(false);
      fetchProjects();
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
      auditor_verified: { class: styles.badgeVerified, icon: <FaCheckCircle />, label: 'Verified' },
      admin_approved: { class: styles.badgePending, icon: <FaClock />, label: 'Ready to Audit' }, 
      returned_to_auditor: { class: styles.badgeRejected, icon: <FaExclamationTriangle />, label: 'Revision Needed' },
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
                <div className={styles.tableCell} style={{ width: '120px', flex: 'none', paddingLeft: '16px' }}>Project ID</div>
                <div className={styles.tableCell} style={{ justifyContent: 'center', width: '80px', flex: 'none' }}>Img</div>
                <div className={`${styles.tableCell} ${styles.cellName}`} style={{ flex: 1.5, paddingLeft: '16px' }}>
                  <div className={styles.sortableHeader} onClick={()=>handleSort('name')}>
                    <span>Project Name</span> <SortIcon columnKey="name" />
                  </div>
                </div>
                <div className={styles.tableCell} style={{ flex: 1.5 }}>Issuer</div>
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
                <div className={styles.emptyState}>Loading tasks...</div>
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
                        <div className={styles.issuerInfo}>
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
                        
                        {['admin_approved', 'returned_to_auditor'].includes(project.active_version?.status) && (
                          <button className={`${styles.actionBtn} ${styles.btnAudit}`} onClick={() => handleStartAudit(project)} title={project.active_version?.status === 'returned_to_auditor' ? "Perbaiki Audit" : "Start Verification"}>
                            <FaClipboardCheck />
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