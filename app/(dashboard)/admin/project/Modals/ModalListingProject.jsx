'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../../my-project/CRUD/ModalProjectView.module.css'; 
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaBuilding, FaClipboardCheck, FaUserTie, FaLeaf, FaCheckDouble, FaClock, FaUserShield, FaRocket
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalListingProject({ project, onClose, onList }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  useEffect(() => {
    setActiveImgIndex(0);
    setActiveTab('overview'); 
  }, [project]);

  if (!project) return null;

  // --- MAPPING DATA ---
  const activeVersion = project.active_version || {};
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

  // --- DATA FILTERING ---
  const allDocs = activeVersion.documents || [];
  const issuerImages = allDocs.filter(d => d.type === 'image' && d.uploader_role === 'issuer');
  const issuerDocs = allDocs.filter(d => d.type === 'document' && d.uploader_role === 'issuer');
  
  const issuerSpecs = {
    total_system_capacity_kwp: activeVersion.total_system_capacity_kwp,
    inverter_capacity_kw: activeVersion.inverter_capacity_kw,
    installation_date: activeVersion.installation_date,
    panel_brand: activeVersion.panel_brand,
    inverter_brand: activeVersion.inverter_brand,
    period_start: activeVersion.period_start,
    period_end: activeVersion.period_end,
  };

  const auditDocs = allDocs.filter(d => (d.type === 'audit_report' || d.type === 'document') && d.uploader_role === 'auditor');
  const auditImages = allDocs.filter(d => d.type === 'image' && d.uploader_role === 'auditor');
  
  const reportData = activeVersion.audit_report || activeVersion.auditReport;
  const auditorUser = reportData?.auditor || project.auditor || null;

  const isAuditorReviewed = ['approved', 'rejected', 'verified'].includes(activeVersion.auditor_verification_status);

  const auditDetail = isAuditorReviewed ? {
    audit_status: activeVersion.auditor_verification_status,
    verified_at: reportData?.created_at || activeVersion.updated_at,
    audit_notes: activeVersion.auditor_notes || reportData?.audit_notes, 
    calculation_method: reportData?.calculation_method,
    verification_checklist: reportData?.verification_checklist || [],
    verified_installed_capacity_kwp: reportData?.verified_installed_capacity_kwp,
    verified_generation_kwh: reportData?.verified_generation_kwh,
    baseline_emission_factor: reportData?.baseline_emission_factor,
    carbon_reduction_amount_ton: reportData?.carbon_reduction_amount_ton, 
    onsite_measurement_date: reportData?.onsite_measurement_date,
  } : null;

  const currentGallery = activeTab === 'overview' ? issuerImages : auditImages;

  // --- HANDLERS ---
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

  // ==============================================================
  // 🔥 FUNGSI PEMICU (Melempar eksekusi ke AdminProject.js)
  // ==============================================================
  const handleConfirmList = async () => {
    const issuerWallet = project.issuer?.wallet_address;
    
    // Safety Guard: Pastikan dompet Issuer ada untuk menerima token
    if (!issuerWallet || issuerWallet === "") {
      Swal.fire('Error', 'Issuer belum mengatur Wallet Address di profil! Token VCT tidak dapat dicetak.', 'error');
      return;
    }

    const calculatedCarbon = auditDetail?.carbon_reduction_amount_ton || 0;
    if (calculatedCarbon <= 0) {
      Swal.fire('Error', 'Jumlah reduksi karbon 0. Token tidak dapat dicetak.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'List to Market?',
      text: `Proyek akan resmi di-list dan ${calculatedCarbon.toLocaleString()} VCT Token akan dicetak ke dompet Issuer (${issuerWallet.substring(0, 6)}...).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e', 
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Publish & Mint Token!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      // Lempar seluruh payload yang dibutuhkan ke fungsi handleFinalList di AdminProject.js
      onList(project.id, { 
        calculatedCarbon, 
        issuerWallet, 
        project 
      });
    }
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
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          
          <div className={styles.header}>
            <div className={styles.headerTopRow}>
                <div className={styles.headerTitleGroup}>
                  <span className={styles.projectId}>FINAL LISTING REVIEW: #{projectIdString}</span>
                  <h2 className={styles.projectTitle}>{activeVersion.name || 'Unnamed Project'}</h2>
                </div>
                <div className={styles.headerActions}>
                  <span className={`${styles.badge} ${styles.auditor_verified}`}>
                    READY TO LIST
                  </span>
                  <button className={styles.closeBtnHeader} onClick={onClose}>
                    <FaTimes />
                  </button>
                </div>
            </div>

            <div style={{ padding: '0 32px' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '12px 16px', borderRadius: '8px', color: '#166534', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                <FaInfoCircle style={{fontSize: '1.2rem', flexShrink: 0}} /> 
                <span>Tinjau laporan komputasi auditor sebelum merilis proyek ke Carbon Market dan menerbitkan token VCT.</span>
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
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className={styles.tabContentAnim}>
                <div className={styles.colLeft}>
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaImage /> PROJECT GALLERY</h4>
                    {currentGallery.length > 0 ? (
                      <div className={styles.galleryContainer}>
                        <div className={styles.mainImageWrapper} onClick={() => setIsLightboxOpen(true)}>
                          <img src={getFullUrl(currentGallery[activeImgIndex]?.file_path)} className={styles.mainImg} alt="Preview" />
                        </div>
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
                            <span className={styles.docName}>{doc.original_filename}</span>
                            <span className={styles.docDate}>{formatDate(doc.created_at)}</span>
                          </div>
                          <FaExternalLinkAlt className={styles.linkIcon} />
                        </a>
                      )) : (
                        <div className={styles.emptyStateSimple}>No documents attached.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.colRight}>
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaBolt /> TECHNICAL SPECS</h4>
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
                      <p><strong>Address:</strong> {activeVersion.address || '-'}</p>
                      <p><strong>Kelurahan:</strong> {activeVersion.kelurahan?.nama || '-'}</p>
                      <p><strong>Kecamatan:</strong> {activeVersion.kecamatan?.nama || '-'}</p>
                      <p><strong>Kota/Kab:</strong> {activeVersion.kota?.nama || '-'}</p>
                      <p><strong>Provinsi:</strong> {activeVersion.provinsi?.nama || '-'}</p>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaAlignLeft /> DESCRIPTION</h4>
                    <div className={styles.descriptionBox}>
                      {activeVersion.description || "No description provided."}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT REPORT */}
            {activeTab === 'audit' && (
              <div className={styles.tabContentAnim}>
                {auditDetail ? (
                  <>
                    <div className={styles.colLeft}>
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaClipboardCheck /> AUDIT STATUS</h4>
                        <div className={`${styles.auditStatusCard} ${styles[auditDetail.audit_status?.toLowerCase()]}`}>
                          <div className={styles.auditStatusIcon}><FaCheckDouble /></div>
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
                              <img src={getFullUrl(currentGallery[activeImgIndex]?.file_path)} className={styles.mainImg} alt="Evidence" />
                            </div>
                          </div>
                        ) : (
                          <div className={styles.emptyMedia}>No evidence photos provided.</div>
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
                                <span className={styles.docName}>{doc.original_filename}</span>
                                <span className={styles.docDate}>Report</span>
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

                      {/* CHECKLIST VERIFIKASI AUDITOR */}
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
                        <h4 className={styles.sectionTitle}><FaAlignLeft /> AUDITOR NOTES</h4>
                        <div className={styles.descriptionBox} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                          {auditDetail.audit_notes || "Verified without notes."}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.fullWidthEmpty}>
                    <div className={styles.emptyStateAudit}>
                      <FaClock size={40} color="#9ca3af" />
                      <h3>Audit Pending</h3>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.footer} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
             <div className={styles.footerNote}>Tinjau data auditor sebelum menerbitkan proyek ke market.</div>
             <div style={{ display: 'flex', gap: '12px' }}>
                 <button type="button" onClick={onClose} className={styles.closeBtnBottom}>
                   Cancel
                 </button>
                 <button 
                   type="button" 
                   onClick={handleConfirmList} 
                   style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease' }}
                 >
                   <FaRocket /> Publish & Mint Token
                 </button>
             </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <img src={getFullUrl(currentGallery[activeImgIndex]?.file_path)} className={styles.lightboxImg} alt="Lightbox" />
          </div>
        </div>
      )}
    </>
  );
}