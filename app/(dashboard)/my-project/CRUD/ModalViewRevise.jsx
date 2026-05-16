'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectView.module.css'; 
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaBuilding, FaClipboardCheck, FaUserTie, FaLeaf, FaCheckDouble, FaClock, FaUserShield, FaExchangeAlt, FaBan
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalViewRevise({ project, onClose, onRevise }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleConfirmRevise = async () => {
    const result = await Swal.fire({
      title: 'Create Revision?',
      text: 'Ini akan membuat versi Draft baru berdasarkan data yang ditolak. Anda dapat memperbaikinya sebelum melakukan submit ulang.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Buat Revisi Baru!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        await onRevise(project.id); 
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const SpecItem = ({ icon, label, value, unit, verified = false }) => (
    <div className={`${styles.specItem} ${verified ? styles.specVerified : ''}`}>
      <div className={styles.specIcon}>{icon}</div>
      <div className={styles.specContent}>
        <span className={styles.specLabel}>{label}</span>
        <strong className={styles.specValue}>
          {value ? value.toLocaleString() : '-'} {unit && value && value !== '-' ? <span className={styles.unit}>{unit}</span> : ''}
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
                  <span className={styles.projectId}>REVISION REVIEW: #{projectIdString}</span>
                  <h2 className={styles.projectTitle}>{activeVersion.name || 'Unnamed Project'}</h2>
                </div>
                <div className={styles.headerActions}>
                  <span className={`${styles.badge} ${styles.rejected}`} style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                    <FaBan style={{ display: 'inline', marginRight: '6px' }}/> REJECTED
                  </span>
                  <button className={styles.closeBtnHeader} onClick={onClose} disabled={isSubmitting}>
                    <FaTimes />
                  </button>
                </div>
            </div>

            {/* Banner Info Penolakan */}
            <div style={{ padding: '0 32px' }}>
                <div style={{ backgroundColor: '#fffbeb', padding: '12px 16px', borderRadius: '8px', color: '#b45309', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #fde68a', marginBottom: '16px' }}>
                <FaInfoCircle style={{fontSize: '1.2rem', flexShrink: 0}} /> 
                <span>Proyek ini telah ditolak. Silakan baca catatan dari Admin/Auditor di bawah sebelum membuat revisi baru.</span>
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
                        <div className={styles.emptyStateSimple}>No legal documents attached.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.colRight}>
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaBolt /> TECHNICAL SPECIFICATIONS (ISSUER CLAIM)</h4>
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

                  <div className={styles.section} style={{marginTop: '20px'}}>
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
                  
                  {/* ADMIN NOTES SELALU TAMPIL AGAR ISSUER BACA */}
                  <div className={styles.section} style={{ marginTop: '20px' }}>
                    <h4 className={styles.sectionTitle}><FaUserShield /> ADMIN NOTES / REVIEW</h4>
                    <div 
                      className={styles.descriptionBox} 
                      style={{ 
                        backgroundColor: activeVersion.admin_verification_status === 'rejected' ? '#fef2f2' : '#f0fdf4', 
                        borderColor: activeVersion.admin_verification_status === 'rejected' ? '#fca5a5' : '#bbf7d0', 
                        color: '#374151' 
                      }}
                    >
                      {activeVersion.admin_notes ? activeVersion.admin_notes : "Belum ada catatan dari Admin."}
                    </div>
                  </div>

                  {/* AUDITOR NOTES: Tampil di Tab Overview jika ada penolakan dari auditor */}
                  {(activeVersion.auditor_verification_status === 'rejected' || activeVersion.auditor_notes) && (
                    <div className={styles.section} style={{ marginTop: '20px' }}>
                      <h4 className={styles.sectionTitle}><FaClipboardCheck style={{ color: '#d97706' }}/> AUDITOR NOTES / REASON</h4>
                      <div 
                        className={styles.descriptionBox} 
                        style={{ 
                          backgroundColor: '#fef2f2', 
                          borderColor: '#fca5a5', 
                          color: '#991b1b' 
                        }}
                      >
                        {activeVersion.auditor_notes ? activeVersion.auditor_notes : "Proyek ditolak oleh Auditor, namun tidak ada catatan spesifik yang diberikan."}
                      </div>
                    </div>
                  )}

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
                      <h3>No Audit Data</h3>
                      <p>Auditor has not provided any report yet.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className={styles.footer} style={{ justifyContent: 'space-between', gap: '12px' }}>
             <div className={styles.footerNote}>Pastikan Anda memahami catatan di atas sebelum merevisi.</div>
             <div style={{ display: 'flex', gap: '12px' }}>
                 <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.closeBtnBottom}>
                   Cancel
                 </button>
                 <button 
                   type="button" 
                   onClick={handleConfirmRevise} 
                   disabled={isSubmitting} 
                   style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#eab308', color: 'white', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s ease' }}
                 >
                   <FaExchangeAlt /> {isSubmitting ? 'Creating...' : 'Create New Revision'}
                 </button>
             </div>
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