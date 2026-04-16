'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectView.module.css';
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaRulerCombined, FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaBuilding, FaClipboardCheck, FaUserTie, FaLeaf, FaCheckDouble, FaClock
} from 'react-icons/fa';

export default function ModalProjectView({ project, onClose }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'audit'
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveImgIndex(0);
    setActiveTab('overview'); // Reset tab saat buka project baru
  }, [project]);

  if (!project) return null;

  // --- MAPPING DATA LARAVEL (VERSIONING) ---
  const activeVersion = project.active_version || {};
  const projectIdString = String(project.id).padStart(4, '0'); // Mengamankan integer ID dari Laravel

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    let cleanPath = filePath.replace(/\\/g, '/');
    const uploadsIndex = cleanPath.indexOf('uploads/');
    if (uploadsIndex !== -1) cleanPath = cleanPath.substring(uploadsIndex);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    return `${baseUrl}/${cleanPath}`;
  };

  // --- DATA FILTERING ---
  // Dokumen sekarang ada di dalam active_version
  const allDocs = activeVersion.documents || [];

  // 1. DATA ISSUER
  const issuerImages = allDocs.filter(d => d.type === 'image' && d.uploader_role === 'issuer');
  const issuerDocs = allDocs.filter(d => d.type === 'document' && d.uploader_role === 'issuer');
  
  // Spesifikasi teknis (Fallback ke '-' atau 0 jika belum ada di database)
  const issuerSpecs = {
    panel_capacity_wp: activeVersion.panel_capacity_wp,
    inverter_capacity_kw: activeVersion.inverter_capacity_kw,
    area_size_m2: activeVersion.area_size_m2,
    number_of_panels: activeVersion.number_of_panels,
    installation_date: activeVersion.installation_date,
    installation_type: activeVersion.installation_type || 'Rooftop',
    panel_brand: activeVersion.panel_brand,
    inverter_brand: activeVersion.inverter_brand,
  };

  // 2. DATA AUDITOR
  const auditDocs = allDocs.filter(d => d.type === 'audit_report' || (d.type === 'document' && d.uploader_role === 'auditor'));
  const auditImages = allDocs.filter(d => d.type === 'image' && d.uploader_role === 'auditor');
  
  // Auditor detail diambil dari active_version dan relasi user
  const auditorUser = project.auditor || null; 
  const auditDetail = activeVersion.auditor_verification_status !== 'pending' ? {
    audit_status: activeVersion.auditor_verification_status,
    verified_at: activeVersion.updated_at,
    audit_notes: activeVersion.auditor_notes,
    verified_installed_capacity_kwp: activeVersion.verified_installed_capacity_kwp,
    verified_annual_generation_kwh: activeVersion.verified_annual_generation_kwh,
    baseline_emission_factor: activeVersion.baseline_emission_factor,
    expected_carbon_reduction_ton_per_year: activeVersion.expected_carbon_reduction_ton_per_year,
    onsite_measurement_date: activeVersion.onsite_measurement_date,
  } : null;

  // Tentukan galeri mana yang tampil berdasarkan tab
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

  // Reusable Spec Item
  const SpecItem = ({ icon, label, value, unit, verified = false }) => (
    <div className={`${styles.specItem} ${verified ? styles.specVerified : ''}`}>
      <div className={styles.specIcon}>{icon}</div>
      <div className={styles.specContent}>
        <span className={styles.specLabel}>{label}</span>
        <strong className={styles.specValue}>
          {value ? value.toLocaleString() : '-'} {unit && value ? <span className={styles.unit}>{unit}</span> : ''}
        </strong>
      </div>
      {verified && <div className={styles.verifiedBadge}><FaCheckDouble /></div>}
    </div>
  );

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          
          {/* HEADER */}
          <div className={styles.header}>
            <div className={styles.headerTopRow}>
                <div className={styles.headerTitleGroup}>
                  <span className={styles.projectId}>PROJECT ID: #{projectIdString}</span>
                  <h2 className={styles.projectTitle}>{activeVersion.name || 'Unnamed Project'}</h2>
                </div>
                <div className={styles.headerActions}>
                  <span className={`${styles.badge} ${styles[activeVersion.status?.toLowerCase() || 'draft']}`}>
                    {activeVersion.status?.replace('_', ' ').toUpperCase() || 'DRAFT'}
                  </span>
                  <button className={styles.closeBtnHeader} onClick={onClose}>
                    <FaTimes />
                  </button>
                </div>
            </div>

            {/* TABS NAVIGATION */}
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

          {/* SCROLLABLE CONTENT */}
          <div className={styles.content}>
            
            {/* ================= TAB 1: OVERVIEW (ISSUER DATA) ================= */}
            {activeTab === 'overview' && (
              <div className={styles.tabContentAnim}>
                <div className={styles.colLeft}>
                  {/* GALLERY ISSUER */}
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

                  {/* ISSUER INFO */}
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

                  {/* ISSUER DOCS */}
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
                  {/* TECHNICAL SPECS */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaBolt /> TECHNICAL SPECIFICATIONS (ISSUER CLAIM)</h4>
                    <div className={styles.specsGrid}>
                      <SpecItem icon={<FaSolarPanel/>} label="Capacity" value={issuerSpecs.panel_capacity_wp} unit="Wp" />
                      <SpecItem icon={<FaBolt/>} label="Inverter" value={issuerSpecs.inverter_capacity_kw} unit="kW" />
                      <SpecItem icon={<FaRulerCombined/>} label="Area Size" value={issuerSpecs.area_size_m2} unit="m²" />
                      <SpecItem icon={<FaSolarPanel/>} label="Total Panels" value={issuerSpecs.number_of_panels} unit="Unit" />
                      <SpecItem icon={<FaCalendarDay/>} label="Installation" value={formatDate(issuerSpecs.installation_date)} unit="" />
                      <SpecItem icon={<FaInfoCircle/>} label="Type" value={issuerSpecs.installation_type} unit="" />
                    </div>
                  </div>

                  <div className={styles.brandRow}>
                    <div className={styles.brandBadge}>Panel: <strong>{issuerSpecs.panel_brand || '-'}</strong></div>
                    <div className={styles.brandBadge}>Inverter: <strong>{issuerSpecs.inverter_brand || '-'}</strong></div>
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
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>City</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.location_city || '-'}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>Province</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.location_province || '-'}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '100px', color: '#6b7280', fontSize: '0.9rem' }}>Country</span>
                        <strong style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{activeVersion.location_country || 'Indonesia'}</strong>
                      </div>

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

            {/* ================= TAB 2: AUDIT REPORT (AUDITOR DATA) ================= */}
            {activeTab === 'audit' && (
              <div className={styles.tabContentAnim}>
                
                {auditDetail ? (
                  // --- JIKA SUDAH ADA DATA AUDIT ---
                  <>
                    <div className={styles.colLeft}>
                      
                      {/* AUDIT STATUS CARD */}
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

                      {/* EVIDENCE GALLERY */}
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

                      {/* AUDITOR INFO */}
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

                      {/* AUDIT DOCS */}
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
                      {/* VERIFIED METRICS */}
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaCheckDouble /> VERIFIED SPECIFICATIONS</h4>
                        <div className={styles.specsGrid}>
                          <SpecItem verified icon={<FaSolarPanel/>} label="Verified Capacity" value={auditDetail.verified_installed_capacity_kwp} unit="KWp" />
                          <SpecItem verified icon={<FaBolt/>} label="Est. Annual Generation" value={auditDetail.verified_annual_generation_kwh} unit="KWh" />
                          <SpecItem verified icon={<FaLeaf/>} label="Emission Factor" value={auditDetail.baseline_emission_factor} unit="" />
                          <SpecItem verified icon={<FaLeaf/>} label="Carbon Reduction" value={auditDetail.expected_carbon_reduction_ton_per_year} unit="Ton/Year" />
                          <SpecItem verified icon={<FaCalendarDay/>} label="On-site Date" value={formatDate(auditDetail.onsite_measurement_date)} unit="" />
                        </div>
                      </div>

                      {/* NOTES */}
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}><FaAlignLeft /> AUDITOR NOTES / FINDINGS</h4>
                        <div className={`${styles.descriptionBox} ${styles.auditNotesBox}`}>
                          {auditDetail.audit_notes || "No specific notes provided."}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // --- JIKA BELUM ADA DATA AUDIT (EMPTY STATE) ---
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

          {/* FOOTER */}
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

      {/* LIGHTBOX */}
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