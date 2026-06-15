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
import { ethers } from 'ethers'; 

import { projectService } from '../../../../services/projectService';
import { api } from '../../../../services/api';

import { 
  connectWallet, 
  submitProjectToBlockchain, 
  addTrackingToBlockchain, 
  mintCarbonTokens,
  checkProjectIsMinted,        
  checkLatestProjectStatus    
} from '../../../utils/web3Config';

import { useAuth } from '../../../../context/AuthContext'; 

import ModalProjectView from '../../my-project/CRUD/ModalProjectView'; 
import ModalVerifiedProject from './Modals/ModalVerifiedProject'; 
import ModalListingProject from './Modals/ModalListingProject';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#94a3b8'];

export default function AdminProject() {
  const pageTitle = "Project Verification";
  const pageBreadcrumbs = ["Dashboard", "Admin", "Projects"];

  const { user } = useAuth(); 
  const adminWallet = user?.wallet_address;

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [expandedRows, setExpandedRows] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [projectToVerify, setProjectToVerify] = useState(null);

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
      if (!adminWallet) throw new Error("Anda belum menghubungkan dompet Web3!");

      Swal.fire({ title: 'Menyiapkan Data...', html: 'Menyimpan keputusan ke server...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => { Swal.showLoading(); } });

      const previousStatus = projectToVerify.active_version.status; 
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const versionId = projectToVerify.active_version.id;
      const versionNumber = projectToVerify.active_version.version_number;
      const actionStatus = payload.action === 'approve' ? 'admin_approved' : 'admin_rejected';
      const issuerWallet = projectToVerify.issuer?.wallet_address;
      
      let backendResponse;
      if (payload.action === 'approve') {
        backendResponse = await projectService.adminApprove(projectId, "");
      } else {
        backendResponse = await projectService.adminReject(projectId, { note: payload.admin_notes }, "");
      }

      const exactDataHash = backendResponse?.dataHash || backendResponse?.data?.dataHash;
      const exactUri = backendResponse?.snapshotUri || backendResponse?.data?.snapshotUri;
      const exactSnapshotId = backendResponse?.snapshotId || backendResponse?.data?.snapshotId;

      const submittedUri = `${apiBaseUrl}/projects/${projectId}/versions/${versionId}/snapshot/submitted`;
      const submittedRes = await fetch(submittedUri);
      const submittedJson = await submittedRes.json();
      
      const initialDataHash = submittedJson?.hash_info?.expected_blockchain_hash || submittedJson?.data?.hash_info?.expected_blockchain_hash;
      const exactSubmittedUri = submittedJson?.snapshotUri || submittedJson?.data?.snapshotUri; 
      const exactSubmittedId = submittedJson?.snapshotId || submittedJson?.data?.snapshotId; 

      let finalTxHash = null;
      let hasTxSuccess = false; 

      try {
        await connectWallet(adminWallet);
        const isMinted = await checkProjectIsMinted(projectId);

        if (!isMinted) {
          Swal.update({ title: 'Transaksi (Mint NFT)', html: 'Mohon konfirmasi di MetaMask Anda.' });
          const receiptTx1 = await submitProjectToBlockchain(
              adminWallet, issuerWallet, projectId, versionNumber, "Issuer Project Initial Submission", initialDataHash, exactSubmittedUri
          );
          
          hasTxSuccess = true; 
          
          // X-RAY LOG 1: Lihat bentuk asli receipt dari Ethers.js!
          console.log("RECEIPT MINTING DARI METAMASK:", receiptTx1);
          
          const tx1Hash = receiptTx1?.hash || receiptTx1?.transactionHash || receiptTx1?.id;
          if (tx1Hash) {
             try { 
               await projectService.saveTxHash(projectId, tx1Hash, exactSubmittedId); 
             } catch(e) {
               console.error("GAGAL SAVE MINTING HASH:", e);
             }
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        let updatedOnChainStatus = "";
        try { updatedOnChainStatus = await checkLatestProjectStatus(projectId); } catch(e) {}

        if (updatedOnChainStatus !== actionStatus) {
          Swal.update({ title: 'Catat Keputusan', html: 'Mohon konfirmasi di MetaMask Anda.' });
          const eventNameAdmin = payload.action === 'approve' ? "Admin Document Verification Approved" : "Admin Document Verification Rejected";
          
          const receiptTrack = await addTrackingToBlockchain(
              adminWallet, projectId, projectId, versionNumber, eventNameAdmin, actionStatus, exactDataHash, exactUri 
          );
          
          hasTxSuccess = true; 
          
          // X-RAY LOG 2: Lihat bentuk asli tracking receipt
          console.log("RECEIPT TRACKING DARI METAMASK:", receiptTrack);
          
          finalTxHash = receiptTrack?.hash || receiptTrack?.transactionHash || receiptTrack?.id;
          console.log("HASH YANG BERHASIL DITANGKAP FRONTEND:", finalTxHash);
        }

      } catch (web3Error) {
        if (!hasTxSuccess) {
            await projectService.revertStatus(projectId, previousStatus);
            Swal.fire('Dibatalkan', 'Transaksi ditolak melalui MetaMask.', 'warning');
        } else {
            Swal.fire('Berhasil', 'Transaksi Blockchain selesai.', 'success');
        }
        setIsVerifyModalOpen(false); fetchProjects(); return; 
      }

      // X-RAY 3: PROSES PENYIMPANAN KE DATABASE
      console.log("MENCOBA SAVE KE DB. HASH:", finalTxHash, " | SNAPSHOT ID:", exactSnapshotId);
      
      if (finalTxHash) {
        try {
          Swal.update({ title: 'Finalisasi...', html: 'Menyinkronkan transaksi ke database...' });
          
          // Panggil API Backend
          const dbResult = await projectService.saveTxHash(projectId, finalTxHash, exactSnapshotId);
          console.log("RESPON DATABASE:", dbResult);
          
        } catch (dbError) {
          // 👉 FIX FATAL: Jangan disembunyikan lagi! Tampilkan pesan error aslinya!
          console.error("❌ BACKEND MENOLAK TX HASH:", dbError);
          Swal.fire('Peringatan Database', 'Transaksi sukses di Polygon, TAPI gagal tersimpan di database: ' + (dbError.message || 'Unknown Error'), 'warning');
        }
      } else {
         console.error("❌ finalTxHash KOSONG (UNDEFINED)! Pantesan gak kesimpen ke database.");
         Swal.fire('Peringatan Frontend', 'Transaksi sukses, tapi Ethers.js gagal menangkap kode Hash.', 'warning');
      }

      Swal.fire('Berhasil!', 'Proyek telah diulas dan jejak terekam permanen di Blockchain.', 'success');
      setIsVerifyModalOpen(false);
      fetchProjects();

    } catch (error) {
      Swal.fire('Gagal', error.message || 'Terjadi kesalahan sistem.', 'error');
      setIsVerifyModalOpen(false);
      fetchProjects();
    }
  };

  const handleFinalList = async (projectId, payload) => {
    try {
      if (!adminWallet) throw new Error("Anda belum menghubungkan dompet Web3!");

      Swal.fire({ title: 'Menyiapkan Data...', html: 'Menarik otorisasi dari server...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => { Swal.showLoading(); } });

      const { calculatedCarbon, issuerWallet, project } = payload;
      const previousStatus = project.active_version.status; 
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const versionId = project.active_version.id;
      const versionNumber = project.active_version.version_number;

      const sigResponse = await projectService.requestMintSignature(projectId);
      const serverSignature = sigResponse.signature;
      const exactAmountInWei = sigResponse.amountInWei; 

      Swal.update({ html: 'Menyimpan status listing ke server Verideon...' });
      const backendResponse = await projectService.adminListProject(projectId, "");
      
      // 👉 FIX: Fallback parser
      const exactDataHash = backendResponse?.dataHash || backendResponse?.data?.dataHash;
      const exactUri = backendResponse?.snapshotUri || backendResponse?.data?.snapshotUri; 
      const exactSnapshotId = backendResponse?.snapshotId || backendResponse?.data?.snapshotId;

      const auditorUri = `${apiBaseUrl}/projects/${projectId}/versions/${versionId}/snapshot/auditor_verified`;
      const auditorRes = await fetch(auditorUri);
      const auditorJson = await auditorRes.json();
      const initialDataHash = auditorJson?.hash_info?.expected_blockchain_hash || auditorJson?.data?.hash_info?.expected_blockchain_hash;
      const exactAuditorUri = auditorJson?.snapshotUri || auditorJson?.data?.snapshotUri;

      let finalTxHash = null;
      let hasTxSuccess = false;

      try {
        await connectWallet(adminWallet); 

        let currentStatus = "";
        try { currentStatus = await checkLatestProjectStatus(projectId); } catch(e) {}

        if (currentStatus !== 'listed') {
          Swal.update({ title: 'Mencatat Listing (1/2)', html: 'Mohon konfirmasi transaksi Add Tracking di MetaMask.' });
          
          const receiptTrack = await addTrackingToBlockchain(
            adminWallet, projectId, projectId, versionNumber, "Project Officially Listed to Market", 'listed', initialDataHash, exactAuditorUri
          );
          hasTxSuccess = true; 
          
          finalTxHash = receiptTrack?.hash || receiptTrack?.transactionHash || receiptTrack?.id;

          Swal.update({ title: 'Sinkronisasi...', html: 'Menunggu blok tercatat...' });
          await new Promise(resolve => setTimeout(resolve, 3500));
        }

        Swal.update({ title: `Mencetak ${calculatedCarbon} VCT (2/2)`, html: 'Mohon konfirmasi penerbitan aset beserta Signature di MetaMask.' });
        const projectName = project.active_version?.name || `Verdeon Project #${projectId}`;

        const receiptMint = await mintCarbonTokens(adminWallet, issuerWallet, projectId, projectName, exactAmountInWei, serverSignature);
        
        hasTxSuccess = true; 
        
        if (!finalTxHash) {
             finalTxHash = receiptMint?.hash || receiptMint?.transactionHash || receiptMint?.id;
        }

      } catch (web3Error) {
        if (!hasTxSuccess) {
            Swal.update({ title: 'Membatalkan...', html: 'Transaksi dibatalkan. Mengembalikan status sistem...' });
            await projectService.revertStatus(projectId, previousStatus);
            if (web3Error.message && web3Error.message.includes('MISMATCH_WALLET')) {
                Swal.fire('Dompet Tidak Sesuai', web3Error.message.split('|')[1], 'error');
            } else {
                Swal.fire('Dibatalkan', 'Transaksi dibatalkan. Data server berhasil diamankan.', 'warning');
            }
        } else {
            Swal.fire('Info Jaringan', 'Pencetakan Token berhasil, namun respon UI sedikit terhambat.', 'success');
        }
        setIsListingModalOpen(false);
        fetchProjects();
        return; 
      }

      if (finalTxHash) {
        try {
          Swal.update({ title: 'Finalisasi...', html: 'Menyinkronkan transaksi ke database...' });
          await projectService.saveTxHash(projectId, finalTxHash, exactSnapshotId);
        } catch (dbError) {}
      }
      
      Swal.fire('Berhasil!', 'Proyek resmi dilisting dan token VCT telah dicetak!', 'success');
      setIsListingModalOpen(false); 
      fetchProjects(); 

    } catch (error) {
      Swal.fire('Gagal Listing', error.message || 'Terjadi kesalahan sistem.', 'error');
      setIsListingModalOpen(false);
      fetchProjects();
    }
  };

  const handleRejectAuditor = async (projectId, payload, project) => {
    try {
      if (!adminWallet) throw new Error("Anda belum menghubungkan dompet Web3!");

      Swal.fire({ title: 'Menyiapkan Revisi...', html: 'Menyimpan catatan revisi ke server...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => { Swal.showLoading(); } });

      const previousStatus = project.active_version.status; 
      const versionId = project.active_version.id;
      const versionNumber = project.active_version.version_number;

      const backendResponse = await projectService.adminRejectAuditor(projectId, { note: payload.note }, "");
      
      // 👉 FIX: Fallback parser
      const exactDataHash = backendResponse?.dataHash || backendResponse?.data?.dataHash;
      const exactUri = backendResponse?.snapshotUri || backendResponse?.data?.snapshotUri; 
      const exactSnapshotId = backendResponse?.snapshotId || backendResponse?.data?.snapshotId;

      let finalTxHash = null;
      let hasTxSuccess = false;

      try {
        await connectWallet(adminWallet);

        let currentStatus = "";
        try { currentStatus = await checkLatestProjectStatus(projectId); } catch(e) {}
        
        if (currentStatus !== 'admin_approved') {
          Swal.update({ title: 'Mencatat Log Revisi', html: 'Mohon konfirmasi di MetaMask untuk mengembalikan status dokumen ke Auditor.' });
          
          const receiptTrack = await addTrackingToBlockchain(
            adminWallet, projectId, projectId, versionNumber, 
            "Admin Requested Audit Revision", "admin_approved", exactDataHash, exactUri
          );
          
          hasTxSuccess = true;
          finalTxHash = receiptTrack?.hash || receiptTrack?.transactionHash || receiptTrack?.id;
        }

      } catch (web3Error) {
        if (!hasTxSuccess) {
            Swal.update({ title: 'Membatalkan...', html: 'Transaksi dibatalkan. Mengembalikan status sistem (Rollback)...' });
            await projectService.revertStatus(projectId, previousStatus);
            if (web3Error.message && web3Error.message.includes('MISMATCH_WALLET')) {
                Swal.fire('Dompet Tidak Sesuai', web3Error.message.split('|')[1], 'error');
            } else {
                Swal.fire('Dibatalkan', 'Transaksi dibatalkan melalui MetaMask. Data sistem telah di-rollback.', 'warning');
            }
        } else {
            Swal.fire('Info Jaringan', 'Catatan Revisi berhasil direkam di Blockchain!', 'success');
        }
        setIsListingModalOpen(false);
        fetchProjects();
        return; 
      }

      if (finalTxHash) {
        try {
          Swal.update({ title: 'Finalisasi...', html: 'Menyinkronkan transaksi ke database...' });
          await projectService.saveTxHash(projectId, finalTxHash, exactSnapshotId);
        } catch (dbError) {}
      }

      Swal.fire('Berhasil!', 'Proyek telah dikembalikan ke antrean Auditor.', 'success');
      setIsListingModalOpen(false);
      fetchProjects();

    } catch (error) {
      Swal.fire('Gagal', error.message || 'Terjadi kesalahan sistem.', 'error');
      setIsListingModalOpen(false);
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
      auditor_verified: { class: styles.badgeVerified, icon: <FaCheckCircle />, label: 'Ready to List' },
      admin_approved: { class: styles.badgePending, icon: <FaSpinner />, label: 'Auditor Review' },
      submitted: { class: styles.badgePending, icon: <FaClock />, label: 'Need Admin Action' },
      returned_to_auditor: { class: styles.badgeRejected, icon: <FaBan />, label: 'Revision Needed' }, 
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
                      
                      <div className={styles.tableCell} style={{ width: '120px', flex: 'none', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px' }}>
                        <FaChevronDown className={`${styles.expandIcon} ${isExpanded ? styles.expandIconActive : ''}`} />
                        <span style={{ fontWeight: '700', color: '#6b7280', fontSize: '0.85rem' }}>#{projectIdString}</span>
                      </div>

                      <div className={styles.tableCell} style={{justifyContent:'center', width: '80px', flex: 'none'}}>
                        {projectImgUrl ? (
                          <img src={projectImgUrl} alt="thumb" className={styles.thumbImg} onError={(e)=>{e.target.style.display='none'}}/>
                        ) : (
                          <div className={styles.thumbPlaceholder}><FaImage /></div>
                        )}
                      </div>

                      <div className={`${styles.tableCell} ${styles.cellName}`} style={{ flex: 1.5, paddingLeft: '16px' }}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                          <span className={styles.projectName}>{project.active_version?.name || 'Unnamed'}</span>
                          <span style={{fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold'}}>Current: v{versionNumber}</span>
                        </div>
                      </div>

                      <div className={styles.tableCell} style={{ flex: 1.5 }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', fontWeight: '500'}}>
                          <FaUserTie /> {project.issuer?.name || 'Unknown'}
                        </div>
                      </div>

                      <div className={styles.tableCell} style={{ flex: 1.2 }}>{renderStatusBadge(project.active_version?.status)}</div>

                      <div className={styles.tableCell} style={{ flex: 1 }}>
                        {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>

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

      {isViewModalOpen && (
        <ModalProjectView project={projectToView} onClose={() => setIsViewModalOpen(false)} />
      )}
      {isVerifyModalOpen && (
        <ModalVerifiedProject project={projectToVerify} onClose={() => setIsVerifyModalOpen(false)} onSave={handleSaveVerification} />
      )}
      {isListingModalOpen && (
        <ModalListingProject project={projectToList} onClose={() => setIsListingModalOpen(false)} onList={handleFinalList} onRejectAuditor={handleRejectAuditor} />
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