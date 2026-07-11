'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import styles from './AdminProject.module.css';
import Topbar from '../../../components/Topbar'; 
import { 
  FaSearch, FaEye, FaLayerGroup, FaCheckCircle, FaClock, FaBan, FaUserTie, FaSort, FaSortUp, FaSortDown,
  FaChevronLeft, FaChevronRight, FaImage, FaEdit, FaSpinner, FaRocket, FaChevronDown, FaHistory, FaExclamationTriangle
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { ethers } from 'ethers'; 

// Import Services
import { projectService } from '../../../../services/projectService';
import { api } from '../../../../services/api';

// IMPORT LENGKAP: Masukkan fungsi checker web3
import { 
  connectWallet, 
  submitProjectToBlockchain, 
  addTrackingToBlockchain, 
  mintCarbonTokens,
  checkProjectIsMinted,        
  checkLatestProjectStatus    
} from '../../../utils/web3Config';

import { useAuth } from '../../../../context/AuthContext'; 

// Modals
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // --- FETCH DATA ---
  const fetchProjects = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await projectService.getAllProjects(page);
      
      if (response && response.data && Array.isArray(response.data)) {
        setProjects(response.data);
        setCurrentPage(response.current_page);
        setTotalPages(response.last_page);
        setTotalItems(response.total);
      } else {
        const dataArr = Array.isArray(response) ? response : [];
        setProjects(dataArr);
        setTotalItems(dataArr.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      Swal.fire('Error', 'Gagal memuat data project.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage]);

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
    const total = totalItems;
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
  }, [projects, totalItems]);

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

  const handleView = async (project, specificVersion = null) => {
    if (!specificVersion || specificVersion.id === project.active_version?.id) {
      setProjectToView(project);
      setIsViewModalOpen(true);
      return; 
    }

    try {
      Swal.fire({
        title: 'Memuat History...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await projectService.getProjectVersionDetail(project.id, specificVersion.id);
      const fetchedVersion = response?.data?.version || response?.version;

      if (!fetchedVersion) {
          throw new Error("Data version gagal ditarik dari server.");
      }

      const projectDataToView = {
        ...project,
        active_version: fetchedVersion
      };

      Swal.close();
      setProjectToView(projectDataToView);
      setIsViewModalOpen(true);

    } catch (error) {
      console.error("Gagal memuat detail versi:", error);
      Swal.fire('Error', 'Gagal memuat detail data versi lampau.', 'error');
    }
  };

  const handleProcess = (project) => {
    setProjectToVerify(project);
    setIsVerifyModalOpen(true);
  };

// ==============================================================
  // 🔥 FUNGSI 1: ADMIN REVIEW VERIFICATION (ANTI SPLIT-BRAIN)
  // ==============================================================
  const handleSaveVerification = async (projectId, payload) => {
    try {
      if (!adminWallet) throw new Error("Anda belum menghubungkan dompet Web3!");

      Swal.fire({ title: 'Menyiapkan Data...', html: 'Menyimpan keputusan ke server...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => { Swal.showLoading(); } });

      const previousStatus = projectToVerify.active_version.status; 
      const isAlreadyProcessed = ['admin_approved', 'rejected'].includes(previousStatus);

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const versionId = projectToVerify.active_version.id;
      const versionNumber = projectToVerify.active_version.version_number;
      const actionStatus = payload.action === 'approve' ? 'admin_approved' : 'admin_rejected';
      const issuerWallet = projectToVerify.issuer?.wallet_address;
      
      if (!issuerWallet) throw new Error("Issuer belum mengatur dompet MetaMask! Proses tidak bisa dilanjutkan.");

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

      let trackingTxHash = null;
      let isTx1JustFinished = false; // 👉 FIX UTAMA: Deklarasi variabel jangan sampai lupa!

      try {
        await connectWallet(adminWallet);

        const isMinted = await checkProjectIsMinted(projectId);
        let currentOnChainStatus = "";
        try { currentOnChainStatus = await checkLatestProjectStatus(projectId); } catch(e) { console.warn("RPC Lag", e) }

        // TRANSAKSI 1: INITIAL MINT / RESUBMIT
        if (currentOnChainStatus !== 'submitted') {
            if (!isMinted) {
                Swal.update({ title: 'Pencatatan Awal (1/2)', html: 'Mohon konfirmasi pencetakan awal aset di MetaMask Anda.' });
                const receiptTx1 = await submitProjectToBlockchain(
                    adminWallet, issuerWallet, projectId, versionNumber, "Issuer Project Initial Submission", initialDataHash, exactSubmittedUri
                );
                
                isTx1JustFinished = true; // Sekarang sudah aman dieksekusi
                const tx1Hash = receiptTx1?.hash || receiptTx1?.transactionHash || receiptTx1?.id;
                if (tx1Hash) {
                    try { await projectService.saveTxHash(projectId, tx1Hash, exactSubmittedId); } catch(e) {}
                }

                Swal.update({ title: 'Sinkronisasi...', html: 'Menunggu blok tercatat...' });
                await new Promise(resolve => setTimeout(resolve, 15000));
            } 
            else if (isMinted && ['admin_rejected', 'auditor_rejected', 'returned_to_auditor'].includes(currentOnChainStatus)) {
                Swal.update({ title: `Mencatat Revisi v${versionNumber} (1/2)`, html: 'Mohon konfirmasi log Revisi Issuer di MetaMask Anda.' });
                const eventNameResubmit = `Issuer Project Resubmission (v${versionNumber})`;
                
                const receiptResubmit = await addTrackingToBlockchain(
                    adminWallet, projectId, projectId, versionNumber, eventNameResubmit, 'submitted', initialDataHash, exactSubmittedUri
                );
                
                isTx1JustFinished = true;
                const txResubmitHash = receiptResubmit?.hash || receiptResubmit?.transactionHash || receiptResubmit?.id;
                if (txResubmitHash) {
                    try { await projectService.saveTxHash(projectId, txResubmitHash, exactSubmittedId); } catch(e) {}
                }

                Swal.update({ title: 'Sinkronisasi...', html: 'Menunggu blok tercatat...' });
                await new Promise(resolve => setTimeout(resolve, 15000));
            }
        }

        // TRANSAKSI 2: KEPUTUSAN ADMIN
        if (isTx1JustFinished || currentOnChainStatus === 'submitted') {
            const stepText = isTx1JustFinished ? "(2/2)" : "(Resume)";
            Swal.update({ title: `Catat Keputusan Admin ${stepText}`, html: 'Mohon konfirmasi pencatatan keputusan di MetaMask Anda.' });
            
            const eventNameAdmin = payload.action === 'approve' ? "Admin Document Verification Approved" : "Admin Document Verification Rejected";
            
            const receiptTrack = await addTrackingToBlockchain(
                adminWallet, projectId, projectId, versionNumber, eventNameAdmin, actionStatus, exactDataHash, exactUri 
            );
            
            trackingTxHash = receiptTrack?.hash || receiptTrack?.transactionHash || receiptTrack?.id;
        }

      } catch (web3Error) {
        console.error("Web3 Error:", web3Error);
        
        let onChainStatus = "";
        try { onChainStatus = await checkLatestProjectStatus(projectId); } catch(e) {}

        const isUserRejected = web3Error?.code === 4001 || web3Error?.message?.toLowerCase().includes("user rejected") || web3Error?.message?.includes("ACTION_REJECTED");

        // 🔥 LOGIKA ANTI ROLLBACK REVIEW ADMIN
        if (onChainStatus === 'submitted' || isTx1JustFinished) {
            Swal.fire('Proses Terjeda', 'Tahap 1 (Pencatatan Awal) berhasil, namun Tahap 2 (Keputusan Admin) dibatalkan. Anda dapat melanjutkan proses kapan saja dengan menekan tombol Resume (Oranye).', 'info');
        } else {
            Swal.update({ title: 'Membatalkan...', html: 'Transaksi tidak tuntas. Mengembalikan status sistem (Rollback)...' });
            await projectService.revertStatus(projectId, previousStatus);
            
            if (web3Error.message && web3Error.message.includes('MISMATCH_WALLET')) {
                Swal.fire('Dompet Tidak Sesuai', web3Error.message.split('|')[1], 'error');
            } else if (isUserRejected) {
                Swal.fire('Dibatalkan', 'Transaksi ditolak melalui MetaMask. Status dikembalikan demi keamanan data.', 'warning');
            } else {
                Swal.fire('Error Web3', 'Terjadi kegagalan jaringan. Status dikembalikan. Silakan coba lagi.', 'error');
            }
        }
        
        setIsVerifyModalOpen(false);
        fetchProjects(currentPage);
        return; 
      }

      if (trackingTxHash) {
        try {
          Swal.update({ title: 'Finalisasi...', html: 'Menyinkronkan transaksi ke database...' });
          await projectService.saveTxHash(projectId, trackingTxHash, exactSnapshotId);
        } catch (dbError) {}
      }

      Swal.fire('Berhasil!', 'Proyek telah diulas dan jejak terekam permanen di Blockchain.', 'success');
      setIsVerifyModalOpen(false);
      fetchProjects(currentPage);

    } catch (error) {
      Swal.fire('Gagal', error.message || 'Terjadi kesalahan sistem.', 'error');
      setIsVerifyModalOpen(false);
      fetchProjects(currentPage);
    }
  };

  // ==============================================================
  // 🔥 FUNGSI 2: FINAL LISTING & MINT TOKENS (SINKRONISASI GANDA)
  // ==============================================================
  const handleFinalList = async (projectId, payload) => {
    try {
      if (!adminWallet) throw new Error("Anda belum menghubungkan dompet Web3!");

      Swal.fire({ title: 'Menyiapkan Data...', html: 'Menarik otorisasi dari server...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => { Swal.showLoading(); } });

      const { calculatedCarbon, issuerWallet, project } = payload;
      const previousStatus = project.active_version.status; 
      const isAlreadyListed = project.active_version.status === 'listed';

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const versionId = project.active_version.id;
      const versionNumber = project.active_version.version_number;

      if (!isAlreadyListed) {
        Swal.update({ html: 'Menyimpan status listing ke server Verideon...' });
        await projectService.adminListProject(projectId, "");
      } else {
        Swal.update({ html: 'Status sudah listed, memuat data resume...' });
      }

      const sigResponse = await projectService.requestMintSignature(projectId);
      const serverSignature = sigResponse.signature;
      const exactAmountInWei = sigResponse.amountInWei; 

      // Panggil lagi untuk mendapatkan snapshot ID yang tepat dari backend 
      // (Bisa juga dari response API di atas jika diubah, tapi panggil ulang lebih aman di sini)
      const backendResponse = await projectService.adminListProject(projectId, "");
      
      const exactDataHash = backendResponse?.dataHash || backendResponse?.data?.dataHash;
      const exactUri = backendResponse?.snapshotUri || backendResponse?.data?.snapshotUri; 
      const exactSnapshotId = backendResponse?.snapshotId || backendResponse?.data?.snapshotId;

      const auditorUri = `${apiBaseUrl}/projects/${projectId}/versions/${versionId}/snapshot/auditor_verified`;
      const auditorRes = await fetch(auditorUri);
      const auditorJson = await auditorRes.json();
      const initialDataHash = auditorJson?.hash_info?.expected_blockchain_hash || auditorJson?.data?.hash_info?.expected_blockchain_hash;
      const exactAuditorUri = auditorJson?.snapshotUri || auditorJson?.data?.snapshotUri;

      let trackingTxHash = null;
      let blockchainTx = null;

      try {
        await connectWallet(adminWallet); 

        let currentStatus = "";
        try { currentStatus = await checkLatestProjectStatus(projectId); } catch(e) {}

        // TRANSAKSI 1: ADD TRACKING (LISTED) - Hanya jika belum
        if (currentStatus !== 'listed') {
          Swal.update({ title: 'Mencatat Listing (1/2)', html: 'Mohon konfirmasi transaksi Add Tracking di MetaMask.' });
          
          const receiptTrack = await addTrackingToBlockchain(
            adminWallet, projectId, projectId, versionNumber, "Project Officially Listed to Market", 'listed', exactDataHash, exactUri // ✅ UBAH JADI exactUri
          );
          
          trackingTxHash = receiptTrack?.hash || receiptTrack?.transactionHash || receiptTrack?.id;

          if (trackingTxHash) {
              try { 
                  await projectService.saveTxHash(projectId, trackingTxHash, exactSnapshotId, null); 
              } catch(e) { console.error("Gagal nyicil simpan hash:", e); }
          }

          Swal.update({ title: 'Sinkronisasi...', html: 'Menunggu blok tercatat...' });
          await new Promise(resolve => setTimeout(resolve, 15000));
        }

        // TRANSAKSI 2: MINT CARBON TOKENS
        Swal.update({ title: `Mencetak ${calculatedCarbon} VCT (2/2)`, html: 'Mohon konfirmasi penerbitan aset beserta Signature di MetaMask.' });
        const projectName = project.active_version?.name || `Verdeon Project #${projectId}`;

        const receiptMint = await mintCarbonTokens(adminWallet, issuerWallet, projectId, projectName, exactAmountInWei, serverSignature);
        
        blockchainTx = receiptMint?.hash || receiptMint?.transactionHash || receiptMint?.id;

      } catch (web3Error) {
        console.error("Web3 Error:", web3Error);

        let onChainStatus = "";
        try { onChainStatus = await checkLatestProjectStatus(projectId); } catch(e) {}

        const isUserRejected = web3Error?.code === 4001 || web3Error?.message?.toLowerCase().includes("user rejected") || web3Error?.message?.includes("ACTION_REJECTED");

        if (onChainStatus === 'listed') {
            Swal.fire('Proses Terjeda', 'Tahap 1 (Pencatatan) berhasil, namun Tahap 2 (Pencetakan Token) dibatalkan. Anda dapat melanjutkan pencetakan kapan saja dengan menekan tombol Resume (Oranye).', 'info');
        } else {
            Swal.update({ title: 'Membatalkan...', html: 'Transaksi tidak tuntas. Mengembalikan status sistem...' });
            await projectService.revertStatus(projectId, previousStatus);
            
            if (web3Error.message && web3Error.message.includes('MISMATCH_WALLET')) {
                Swal.fire('Dompet Tidak Sesuai', web3Error.message.split('|')[1], 'error');
            } else if (isUserRejected) {
                Swal.fire('Dibatalkan', 'Transaksi dibatalkan. Data server berhasil diamankan (Rollback).', 'warning');
            } else {
                Swal.fire('Error Web3', 'Terjadi kendala jaringan. Status dikembalikan. Silakan coba lagi.', 'error');
            }
        }
        
        setIsListingModalOpen(false);
        fetchProjects(currentPage);
        return; 
      }

      if (trackingTxHash || blockchainTx) {
        try {
          Swal.update({ title: 'Finalisasi...', html: 'Menyinkronkan transaksi ke database...' });
          await projectService.saveTxHash(projectId, trackingTxHash, exactSnapshotId, blockchainTx);
        } catch (dbError) {
          console.error("Gagal simpan hash ke DB:", dbError);
        }
      }
      
      Swal.fire('Berhasil!', 'Proyek resmi dilisting dan token VCT telah dicetak!', 'success');
      setIsListingModalOpen(false); 
      fetchProjects(currentPage); 

    } catch (error) {
      Swal.fire('Gagal Listing', error.message || 'Terjadi kesalahan sistem.', 'error');
      setIsListingModalOpen(false);
      fetchProjects(currentPage);
    }
  };

  const handleRejectAuditor = async (projectId, payload, project) => {
    try {
      if (!adminWallet) throw new Error("Anda belum menghubungkan dompet Web3!");
      Swal.fire({ title: 'Menyiapkan Revisi...', html: 'Menyimpan catatan revisi ke server...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => { Swal.showLoading(); } });

      const previousStatus = project.active_version.status; 
      const versionNumber = project.active_version.version_number;

      const backendResponse = await projectService.adminRejectAuditor(projectId, { note: payload.note }, "");
      
      const exactDataHash = backendResponse?.dataHash || backendResponse?.data?.dataHash;
      const exactUri = backendResponse?.snapshotUri || backendResponse?.data?.snapshotUri; 
      const exactSnapshotId = backendResponse?.snapshotId || backendResponse?.data?.snapshotId;

      let finalTxHash = null;

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
          
          finalTxHash = receiptTrack?.hash || receiptTrack?.transactionHash || receiptTrack?.id;
        }

      } catch (web3Error) {
        Swal.update({ title: 'Membatalkan...', html: 'Transaksi dibatalkan. Mengembalikan status sistem (Rollback)...' });
        await projectService.revertStatus(projectId, previousStatus);
        
        const isUserRejected = web3Error?.code === 4001 || web3Error?.message?.toLowerCase().includes("user rejected") || web3Error?.message?.includes("ACTION_REJECTED");

        if (web3Error.message && web3Error.message.includes('MISMATCH_WALLET')) {
            Swal.fire('Dompet Tidak Sesuai', web3Error.message.split('|')[1], 'error');
        } else if (isUserRejected) {
            Swal.fire('Dibatalkan', 'Transaksi dibatalkan melalui MetaMask. Data sistem telah di-rollback.', 'warning');
        } else {
            Swal.fire('Error Web3', 'Terjadi kegagalan jaringan. Status dikembalikan.', 'error');
        }
        
        setIsListingModalOpen(false);
        fetchProjects(currentPage);
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
      fetchProjects(currentPage);

    } catch (error) {
      Swal.fire('Gagal', error.message || 'Terjadi kesalahan sistem.', 'error');
      setIsListingModalOpen(false);
      fetchProjects(currentPage);
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

  const renderStatusBadge = (status, isHalfFinished = false) => {
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
    
    const mainBadge = (
      <span className={`${styles.badge} ${conf.class}`}>
        {conf.icon} {conf.label}
      </span>
    );

    if (isHalfFinished) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={styles.badgeWarning} title="Proses transaksi belum tuntas!">
             <FaExclamationTriangle />
          </span>
          {mainBadge}
        </div>
      );
    }

    return mainBadge;
  };

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        <section className={styles.topGrid}>
          <div className={styles.statsGrid}>
            <StatCard icon={<FaLayerGroup/>} className={styles.iconTotal} label="Total Projects" value={stats.total} />
            <StatCard icon={<FaClock/>} className={styles.iconPending} label="Need Action (Current Page)" value={stats.pending} />
            <StatCard icon={<FaSpinner/>} className={styles.iconPending} label="On Review (Current Page)" value={stats.onReview} />
            <StatCard icon={<FaCheckCircle/>} className={styles.iconVerified} label="Listed (Current Page)" value={stats.listed} />
          </div>
          
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Status Distribution (Current Page)</h3>
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
              ) : processedProjects.length > 0 ? processedProjects.map(project => {
                const versionNumber = project.active_version?.version_number;
                const isExpanded = expandedRows.includes(project.id);
                const projectIdString = String(project.id).padStart(4, '0');
                const projectVersions = (project.versions || [project.active_version]).slice().sort((a, b) => a.version_number - b.version_number);
                const projectImgUrl = getProjectImage(project.active_version);

                // Variabel Final Listing
                const isReadyToList = project.active_version?.status === 'auditor_verified';
                const isHalfFinished = project.active_version?.status === 'listed' && !project.blockchain_tx;

                // Variabel Admin Review
                const isReadyToReview = project.active_version?.status === 'submitted';
                const reviewSnapshot = project.snapshots?.find(s => s.status_at_snapshot === (project.active_version?.status === 'rejected' ? 'admin_rejected' : 'admin_approved'));
                const isReviewHalfFinished = ['admin_approved', 'rejected'].includes(project.active_version?.status) && reviewSnapshot && !reviewSnapshot.tx_hash;

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

                      <div className={styles.tableCell} style={{ flex: 1.2 }}>
                        {renderStatusBadge(project.active_version?.status, isHalfFinished || isReviewHalfFinished)}
                      </div>

                      <div className={styles.tableCell} style={{ flex: 1 }}>
                        {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>

                      <div className={`${styles.tableCell} ${styles.actionsCell}`} style={{ flex: 1.5 }} onClick={e => e.stopPropagation()}>
                        <button className={`${styles.actionBtn} ${styles.btnView}`} onClick={() => handleView(project)} title="View Detail">
                          <FaEye />
                        </button>
                        
                        {(isReadyToReview || isReviewHalfFinished) && (
                          <button 
                            className={`${styles.actionBtn} ${styles.btnProcess}`} 
                            style={{ backgroundColor: isReviewHalfFinished ? '#f59e0b' : '#3b82f6', color: 'white' }} 
                            onClick={() => handleProcess(project)} 
                            title={isReviewHalfFinished ? "Resume Pencatatan Keputusan Admin (Tahap 2)" : "Review Project"}
                          >
                            <FaEdit />
                          </button>
                        )}
                        
                        {(isReadyToList || isHalfFinished) && (
                          <button 
                            className={`${styles.actionBtn} ${styles.btnProcess}`} 
                            style={{ backgroundColor: isHalfFinished ? '#f59e0b' : '#22c55e', color: 'white' }} 
                            onClick={() => { setProjectToList(project); setIsListingModalOpen(true); }} 
                            title={isHalfFinished ? "Resume Minting Token (Tahap 2)" : "Finalize & List Project"}
                          >
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
              Showing Page {currentPage} of {totalPages} (Total: {totalItems} cases)
            </span>
            <div className={styles.paginationControls}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage <= 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <FaChevronLeft /> Prev
              </button>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage >= totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next <FaChevronRight />
              </button>
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