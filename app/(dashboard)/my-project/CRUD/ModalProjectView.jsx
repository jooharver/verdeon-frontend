'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectView.module.css';
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaBuilding, FaClipboardCheck, FaUserTie, FaLeaf, FaCheckDouble, FaClock, FaUserShield, FaShieldAlt,
  FaCopy, FaSpinner, FaSearch
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { ethers } from 'ethers';

// 👉 IMPORT WEB3
import { getProjectContract } from '../../../utils/web3Config'; 

export default function ModalProjectView({ project, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [blockchainHistory, setBlockchainHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const activeVersion = project?.active_version || {};
  const projectVersions = project?.versions || [activeVersion];

  const hasOnChainData = activeVersion.status && activeVersion.status !== 'draft';

  useEffect(() => {
    setActiveImgIndex(0);
    setActiveTab('overview');
    
    if (project && hasOnChainData) {
      fetchBlockchainHistory(project.id);
    }
  }, [project, hasOnChainData]);

  const fetchBlockchainHistory = async (projectId) => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    setIsLoadingHistory(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = getProjectContract(provider);
      const history = await contract.getProjectHistory(projectId);
      
      const enrichedHistory = [];

      // Dapatkan versi mana yang saat ini sedang aktif (tertinggi)
      const maxVersionNumber = Math.max(...projectVersions.map(v => v.version_number));
      const isViewingActiveVersion = activeVersion.version_number === maxVersionNumber;

      for (const log of history) {
        const matchedSnapshot = (project.snapshots || []).find(
          snap => snap.data_hash === log.dataHash
        );

        // Jika kita sedang melihat versi aktif, tampilkan SEMUA log
        // Jika kita sedang melihat versi lampau, filter berdasarkan version_number
        const logVersion = Number(log.versionNumber); 
        
        const shouldShow = isViewingActiveVersion 
            ? logVersion <= activeVersion.version_number 
            : logVersion === activeVersion.version_number;

        if (shouldShow) {
            enrichedHistory.push({
              eventName: log.eventName,
              timestamp: log.timestamp,
              actor: log.actor,
              dataHash: log.dataHash,
              metadataUri: log.metadataUri,
              status: log.status,
              txHash: matchedSnapshot?.tx_hash || null 
            });
        }
      }

      setBlockchainHistory(enrichedHistory);
    } catch (error) {
      console.error("Gagal menarik data dari Blockchain:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatBlockchainTime = (epochTimestamp) => {
    const date = new Date(Number(epochTimestamp) * 1000);
    return date.toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
  };

  if (!project) return null;

  const projectIdString = String(project.id).padStart(4, '0');

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

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

  // ==============================================================
  // 🔥 ALGORITMA EKSTRAKSI DOKUMEN YANG JAUH LEBIH CERDAS
  // ==============================================================
  const allDocs = activeVersion.documents || [];
  
  const issuerImages = allDocs.filter(d => d.type === 'image' && d.uploader_role !== 'auditor');
  const issuerDocs = allDocs.filter(d => d.type === 'document' && d.uploader_role !== 'auditor');
  
  const issuerSpecs = {
    total_system_capacity_kwp: activeVersion.total_system_capacity_kwp,
    inverter_capacity_kw: activeVersion.inverter_capacity_kw,
    installation_date: activeVersion.installation_date,
    panel_brand: activeVersion.panel_brand,
    inverter_brand: activeVersion.inverter_brand,
    period_start: activeVersion.period_start,
    period_end: activeVersion.period_end,
  };

  const reportData = activeVersion.audit_report || activeVersion.auditReport;
  const auditorUser = reportData?.auditor || project.auditor || null;

  const reportDocs = reportData?.documents || []; 
  const versionAuditorDocs = allDocs.filter(d => d.uploader_role === 'auditor' || ['audit_report', 'audit_image', 'evidence'].includes(d.type));
  
  const allAuditorDocs = [...versionAuditorDocs, ...reportDocs];
  
  const uniqueAuditorDocs = allAuditorDocs.filter((obj, index, self) =>
      index === self.findIndex((t) => (t.id === obj.id))
  );

  const auditImages = uniqueAuditorDocs.filter(d => ['image', 'audit_image', 'evidence'].includes(d.type));
  const auditDocs = uniqueAuditorDocs.filter(d => ['document', 'audit_report', 'pdf'].includes(d.type));
  // ==============================================================

  const auditDetail = (activeVersion.auditor_verification_status !== 'pending' && reportData) ? {
    audit_status: activeVersion.auditor_verification_status,
    verified_at: reportData.created_at || activeVersion.updated_at,
    audit_notes: reportData.audit_notes,
    calculation_method: reportData.calculation_method,
    verification_checklist: reportData.verification_checklist || [],
    verified_installed_capacity_kwp: reportData.verified_installed_capacity_kwp,
    verified_generation_kwh: reportData.verified_generation_kwh,
    baseline_emission_factor: reportData.baseline_emission_factor,
    carbon_reduction_amount_ton: reportData.carbon_reduction_amount_ton,
    onsite_measurement_date: reportData.onsite_measurement_date,
  } : null;

  const currentGallery = activeTab === 'overview' ? issuerImages : auditImages;

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (currentGallery.length === 0) return;
    setActiveImgIndex((prev) => (prev === currentGallery.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (currentGallery.length === 0) return;
    setActiveImgIndex((prev) => (prev === 0 ? currentGallery.length - 1 : prev - 1));
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Disalin ke clipboard!',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const SpecItem = ({ icon, label, value, unit, verified = false }) => (
    <div className={`${styles.specItem} ${verified ? styles.specVerified : ''}`}>
      <div className={styles.specIcon}>{icon}</div>
      <div className={styles.specContent}>
        <span className={styles.specLabel}>{label}</span>
        <strong className={styles.specValue}>
          {value ? (typeof value === 'number' ? value.toLocaleString() : value) : '-'} {unit && value && value !== '-' ? <span className={styles.unit}>{unit}</span> : ''}
        </strong>
      </div>
      {verified && <div className={styles.verifiedBadge}><FaCheckDouble /></div>}
    </div>
  );

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          
          <div className={styles.header}>
            <div className={styles.headerTopRow}>
                <div className={styles.headerTitleGroup}>
                  <span className={styles.projectId}>PROJECT ID: #{projectIdString}</span>
                  <h2 className={styles.projectTitle}>{activeVersion.name || 'Unnamed Project'}</h2>
                </div>
                <div className={styles.headerActions}>
                  <span className={`${styles.badge} ${styles[activeVersion.status?.toLowerCase() || 'draft']}`}>
                    {activeVersion.status?.replace(/_/g, ' ').toUpperCase() || 'DRAFT'}
                  </span>
                  <button className={styles.closeBtnHeader} onClick={onClose}>
                    <FaTimes />
                  </button>
                </div>
            </div>

            <div className={styles.tabsContainer}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <FaSolarPanel /> Project Overview
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <FaClipboardCheck /> Audit Report
              </button>
            </div>
          </div>

          <div className={styles.content}>
            
            {activeTab === 'overview' && (
              <div className={styles.tabContentAnim}>
                <div className={styles.colLeft}>
                  
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaImage /> PROJECT GALLERY</h4>
                    {currentGallery.length > 0 ? (
                      <div className={styles.galleryContainer}>
                        <div className={styles.mainImageWrapper} onClick={() => setIsLightboxOpen(true)}>
                          <img 
                            src={getFullUrl(currentGallery[activeImgIndex]?.file_path)} 
                            alt="Main Preview" className={styles.mainImg}
                            onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Image+Error"; }}
                          />
                          <div className={styles.mainImageOverlay}>
                            <FaExpand /> <span>View Fullscreen</span>
                          </div>
                        </div>
                        {currentGallery.length > 1 && (
                          <div className={styles.thumbnailStrip}>
                            {currentGallery.map((img, idx) => (
                              <div key={img.id} 
                                className={`${styles.thumbItem} ${idx === activeImgIndex ? styles.thumbActive : ''}`}
                                onClick={() => setActiveImgIndex(idx)}
                              >
                                <img src={getFullUrl(img.file_path)} alt={`thumb-${idx}`} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.emptyMedia}><FaImage size={24} /> <span>No images provided</span></div>
                    )}
                  </div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaBuilding /> ISSUER INFORMATION</h4>
                    <div className={styles.issuerCard}>
                      <div className={styles.issuerIconBox}><FaBuilding /></div>
                      <div className={styles.issuerDetails}>
                        <strong className={styles.issuerName}>{project.issuer?.name || 'Unknown User'}</strong>
                        <span className={styles.issuerEmail}>{project.issuer?.email || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaFilePdf /> LEGAL DOCUMENTS</h4>
                    <div className={styles.docList}>
                      {issuerDocs.length > 0 ? issuerDocs.map((doc) => (
                        <a key={doc.id} href={getFullUrl(doc.file_path)} target="_blank" rel="noreferrer" className={styles.docCard}>
                          <div className={styles.docIconBox}><FaFilePdf /></div>
                          <div className={styles.docInfo}>
                            <span className={styles.docName}>{doc.original_filename || 'Legal_Document.pdf'}</span>
                            <span className={styles.docDate}>{formatDate(doc.created_at)}</span>
                          </div>
                          <FaExternalLinkAlt className={styles.linkIcon} />
                        </a>
                      )) : (
                        <div className={styles.emptyStateSimple}>No legal documents attached.</div>
                      )}
                    </div>
                  </div>

                  {/* AUDIT TRAIL TIMELINE */}
                  {hasOnChainData && (
                    <div className={styles.section} style={{ marginTop: '20px' }}>
                      <h4 className={styles.sectionTitle}>
                        <FaShieldAlt style={{ color: '#0d9488' }} /> ON-CHAIN AUDIT TRAIL
                      </h4>
                      
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px 16px' }}>
                        
                        {isLoadingHistory ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', fontSize: '0.9rem', justifyContent: 'center' }}>
                            <FaSpinner className="fa-spin" /> Fetching immutable ledger from Polygon...
                          </div>
                        ) : [blockchainHistory].length > 0 ? (
                          
                          <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {blockchainHistory.map((log, index) => {
                              let statusColor = '#3b82f6'; 
                              if (log.status === 'listed') statusColor = '#22c55e'; 
                              else if (log.status === 'admin_rejected' || log.status === 'auditor_rejected' || log.status === 'rejected') statusColor = '#ef4444'; 
                              else if (log.status === 'auditor_verified') statusColor = '#0ea5e9';

                              return (
                                <div key={index} style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: statusColor, border: '2px solid white', boxShadow: '0 0 0 1px #cbd5e1' }}></div>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <strong style={{ fontSize: '0.95rem', color: '#1f2937', lineHeight: '1.2' }}>{log.eventName}</strong>
                                      <span style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                                        {formatBlockchainTime(log.timestamp)}
                                      </span>
                                    </div>
                                    
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <FaUserTie /> Executed by: <code>{log.actor.substring(0,6)}...{log.actor.substring(38)}</code>
                                    </div>

                                    <div style={{ marginTop: '4px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Data Hash (SHA-256)</span>
                                        <code style={{ fontSize: '0.75rem', color: '#334155' }}>
                                          {log.dataHash.substring(0, 16)}...{log.dataHash.substring(log.dataHash.length - 8)}
                                        </code>
                                      </div>
                                      <button onClick={() => handleCopyHash(log.dataHash)} title="Copy Full Data Hash" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                                        <FaCopy size={16} />
                                      </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                      
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {log.txHash ? (
                                          <a 
                                            href={`https://polygonscan.com/tx/${log.txHash}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            style={{ fontSize: '0.75rem', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', transition: 'background 0.2s' }}
                                          >
                                            <FaExternalLinkAlt /> View Transaction
                                          </a>
                                        ) : (
                                          <a 
                                            href={`https://polygonscan.com/address/${log.actor}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            title="TxHash belum tersimpan di DB, lihat log aktor"
                                            style={{ fontSize: '0.75rem', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', transition: 'background 0.2s' }}
                                          >
                                            <FaSearch /> View Actor Logs
                                          </a>
                                        )}

                                        {log.status === 'listed' && project.blockchain_tx && (
                                          <a 
                                            href={`https://polygonscan.com/tx/${project.blockchain_tx}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            style={{ fontSize: '0.75rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', transition: 'background 0.2s' }}
                                          >
                                            <FaBolt color="#f59e0b" /> View Mint Token
                                          </a>
                                        )}
                                      </div>

                                      <div style={{ display: 'flex' }}>
                                        <a 
                                          href={`/snapshot?url=${encodeURIComponent(log.metadataUri)}`} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          style={{ fontSize: '0.75rem', color: '#0d9488', backgroundColor: '#ccfbf1', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                          <FaFilePdf /> Data Snapshot
                                        </a>
                                      </div>

                                    </div>

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>No On-Chain Logs Found</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Proyek ini sudah dikirim namun log blockchain belum tersinkronisasi.</p>
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.colRight}>
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaBolt /> TECHNICAL SPECIFICATIONS</h4>
                    <div className={styles.specsGrid}>
                      <SpecItem icon={<FaSolarPanel/>} label="Total Capacity" value={issuerSpecs.total_system_capacity_kwp} unit="kWp" />
                      <SpecItem icon={<FaBolt/>} label="Inverter" value={issuerSpecs.inverter_capacity_kw} unit="kW" />
                      <SpecItem icon={<FaCalendarDay/>} label="Installation" value={formatDate(issuerSpecs.installation_date)} unit="" />
                    </div>
                  </div>

                  <div className={styles.brandRow}>
                    <div className={styles.brandBadge}>Panel: <strong>{issuerSpecs.panel_brand || '-'}</strong></div>
                    <div className={styles.brandBadge}>Inverter: <strong>{issuerSpecs.inverter_brand || '-'}</strong></div>
                  </div>

                  <div className={styles.section} style={{marginTop: '20px'}}>
                    <h4 className={styles.sectionTitle}><FaCalendarDay /> CLAIM VERIFICATION PERIOD</h4>
                    <div className={styles.specsGrid}>
                      <SpecItem icon={<FaCalendarDay/>} label="Start Date" value={formatDate(issuerSpecs.period_start)} unit="" />
                      <SpecItem icon={<FaCalendarDay/>} label="End Date" value={formatDate(issuerSpecs.period_end)} unit="" />
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaMapMarkerAlt /> LOCATION DETAILS</h4>
                    <div className={styles.locationCard} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>Address</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.address || '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>Kelurahan</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.kelurahan?.nama || activeVersion.kode_kelurahan || '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>Kecamatan</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.kecamatan?.nama || activeVersion.kode_kecamatan || '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>Kota/Kab.</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.kota?.nama || activeVersion.kode_kota || '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>Provinsi</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.provinsi?.nama || activeVersion.kode_provinsi || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaAlignLeft /> DESCRIPTION</h4>
                    <div className={styles.descriptionBox}>
                      {activeVersion.description || "No description provided."}
                    </div>
                  </div>

                  {activeVersion.status !== 'draft' && (
                    <div className={styles.section} style={{ marginTop: '20px' }}>
                      <h4 className={styles.sectionTitle}><FaUserShield /> ADMIN NOTES / REVIEW</h4>
                      {(!activeVersion.admin_verification_status || activeVersion.admin_verification_status === 'pending') ? (
                        <div className={styles.descriptionBox} style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#6b7280' }}>
                          <FaClock style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} /> Menunggu proses review dari Admin.
                        </div>
                      ) : (
                        <div 
                          className={styles.descriptionBox} 
                          style={{ 
                            backgroundColor: ['rejected', 'returned_to_auditor'].includes(activeVersion.status) ? '#fef2f2' : '#f0fdf4', 
                            borderColor: ['rejected', 'returned_to_auditor'].includes(activeVersion.status) ? '#fca5a5' : '#bbf7d0', 
                            color: '#374151' 
                          }}
                        >
                          {['auditor_verified', 'listed'].includes(activeVersion.status) 
                            ? "Proyek telah diverifikasi dan disetujui sepenuhnya oleh Admin." 
                            : (activeVersion.admin_notes ? activeVersion.admin_notes : "Proyek disetujui tanpa catatan tambahan dari Admin.")}
                        </div>
                      )}
                    </div>
                  )}

                  {(activeVersion.auditor_verification_status === 'rejected' || activeVersion.auditor_notes) && activeVersion.status !== 'listed' && (
                    <div className={styles.section} style={{ marginTop: '20px' }}>
                      <h4 className={styles.sectionTitle}><FaClipboardCheck style={{ color: '#d97706' }}/> AUDITOR NOTES / REASON</h4>
                      <div 
                        className={styles.descriptionBox} 
                        style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}
                      >
                        {activeVersion.auditor_notes ? activeVersion.auditor_notes : "Proyek ditolak oleh Auditor, namun tidak ada catatan spesifik yang diberikan."}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className={styles.tabContentAnim}>
                {auditDetail ? (
                  <>
                    <div className={styles.colLeft}>
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaClipboardCheck /> AUDIT STATUS</h4>
                        <div className={`${styles.auditStatusCard} ${styles[auditDetail.audit_status?.toLowerCase()]}`}>
                          <div className={styles.auditStatusIcon}>
                             {auditDetail.audit_status === 'approved' || auditDetail.audit_status === 'verified' ? <FaCheckDouble /> : <FaInfoCircle />}
                          </div>
                          <div>
                            <h4 className={styles.auditStatusTitle}>{auditDetail.audit_status.toUpperCase()}</h4>
                            <span className={styles.auditStatusDate}>Verified on: {formatDate(auditDetail.verified_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaImage /> EVIDENCE PHOTOS</h4>
                        {currentGallery.length > 0 ? (
                          <div className={styles.galleryContainer}>
                            <div className={styles.mainImageWrapper} onClick={() => setIsLightboxOpen(true)}>
                              <img 
                                src={getFullUrl(currentGallery[activeImgIndex]?.file_path)} 
                                alt="Audit Evidence" className={styles.mainImg}
                                onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Image+Error"; }}
                              />
                              <div className={styles.mainImageOverlay}><FaExpand /> View</div>
                            </div>
                            {currentGallery.length > 1 && (
                              <div className={styles.thumbnailStrip}>
                                {currentGallery.map((img, idx) => (
                                  <div key={img.id} 
                                    className={`${styles.thumbItem} ${idx === activeImgIndex ? styles.thumbActive : ''}`}
                                    onClick={() => setActiveImgIndex(idx)}
                                  >
                                    <img src={getFullUrl(img.file_path)} alt="evidence" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={styles.emptyMedia}><FaImage /> No evidence photos uploaded.</div>
                        )}
                      </div>

                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaUserTie /> AUDITED BY</h4>
                        <div className={styles.issuerCard}>
                          <div className={styles.issuerIconBox} style={{background: '#e0e7ff', color: '#4f46e5'}}><FaUserTie /></div>
                          <div className={styles.issuerDetails}>
                            <strong className={styles.issuerName}>{auditorUser?.name || 'Assigned Auditor'}</strong>
                            <span className={styles.issuerEmail}>{auditorUser?.email || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaFilePdf /> AUDIT REPORT FILES</h4>
                        <div className={styles.docList}>
                          {auditDocs.length > 0 ? auditDocs.map((doc) => (
                            <a key={doc.id} href={getFullUrl(doc.file_path)} target="_blank" rel="noreferrer" className={styles.docCard}>
                              <div className={styles.docIconBox} style={{background: '#dbeafe', color: '#2563eb'}}><FaFilePdf /></div>
                              <div className={styles.docInfo}>
                                <span className={styles.docName}>{doc.original_filename || 'Audit_Report.pdf'}</span>
                                <span className={styles.docDate}>Report Document</span>
                              </div>
                              <FaExternalLinkAlt className={styles.linkIcon} />
                            </a>
                          )) : (
                            <div className={styles.emptyStateSimple}>No report files attached.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.colRight}>
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaCheckDouble /> VERIFIED SPECIFICATIONS</h4>
                        <div className={styles.specsGrid}>
                          <SpecItem verified icon={<FaSolarPanel/>} label="Verified Capacity" value={auditDetail.verified_installed_capacity_kwp} unit="kWp" />
                          <SpecItem verified icon={<FaInfoCircle/>} label="Method" value={auditDetail.calculation_method === 'system_estimated' ? 'System Est.' : 'Actual Inv.'} unit="" />
                          <SpecItem verified icon={<FaCalendarDay/>} label="Period Start" value={formatDate(issuerSpecs.period_start)} unit="" />
                          <SpecItem verified icon={<FaCalendarDay/>} label="Period End" value={formatDate(issuerSpecs.period_end)} unit="" />
                          <SpecItem verified icon={<FaBolt/>} label="Verified Generation" value={auditDetail.verified_generation_kwh} unit="kWh" />
                          <SpecItem verified icon={<FaLeaf/>} label="Emission Factor" value={auditDetail.baseline_emission_factor} unit="" />
                          <SpecItem verified icon={<FaLeaf/>} label="Carbon Reduction" value={auditDetail.carbon_reduction_amount_ton} unit="Ton" />
                          <SpecItem verified icon={<FaCalendarDay/>} label="On-site Date" value={auditDetail.onsite_measurement_date ? formatDate(auditDetail.onsite_measurement_date) : 'N/A (System)'} unit="" />
                        </div>
                      </div>

                      {auditDetail.verification_checklist && auditDetail.verification_checklist.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}><FaClipboardCheck /> VERIFICATION CHECKLIST</h4>
                          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {auditDetail.verification_checklist.map((item, idx) => (
                              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#374151' }}>
                                <FaCheckDouble color="#10b981" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaAlignLeft /> AUDITOR NOTES / FINDINGS</h4>
                        <div 
                          className={`${styles.descriptionBox} ${styles.auditNotesBox}`}
                          style={{ 
                            backgroundColor: auditDetail.audit_status === 'rejected' ? '#fef2f2' : '#f0fdf4', 
                            borderColor: auditDetail.audit_status === 'rejected' ? '#fca5a5' : '#bbf7d0', 
                            color: '#374151' 
                          }}
                        >
                          {auditDetail.audit_notes ? auditDetail.audit_notes : "Proyek diverifikasi tanpa catatan tambahan dari Auditor."}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.fullWidthEmpty}>
                    <div className={styles.emptyStateAudit}>
                      <div className={styles.emptyIcon}><FaClock /></div>
                      <h3>Audit Pending</h3>
                      <p>This project has not been fully verified yet. <br/>Auditor data will appear here once the verification process is complete.</p>
                      {auditorUser && (
                        <div className={styles.assignedBadge}>
                          Assigned to: <strong>{auditorUser.name}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.footer}>
             <div className={styles.footerNote}>
               {activeTab === 'overview' 
                 ? `Created on: ${formatDate(project.created_at)}` 
                 : (auditDetail ? `Last audited: ${formatDate(auditDetail.verified_at)}` : 'Waiting for audit...')}
             </div>
             <button className={styles.closeBtnBottom} onClick={onClose}>Close View</button>
          </div>
        </div>
      </div>

      {isLightboxOpen && currentGallery.length > 0 && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <button className={styles.lightboxCloseBtn}><FaTimes /></button>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button className={styles.navBtn} onClick={handlePrevImage}><FaChevronLeft /></button>
            <div className={styles.lightboxImageWrapper}>
              <img src={getFullUrl(currentGallery[activeImgIndex]?.file_path)} alt="Full View" className={styles.lightboxImg} />
              <div className={styles.lightboxCounter}>{activeImgIndex + 1} / {currentGallery.length}</div>
            </div>
            <button className={styles.navBtn} onClick={handleNextImage}><FaChevronRight /></button>
          </div>
        </div>
      )}
    </>
  );
}