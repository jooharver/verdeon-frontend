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

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    
    // 1. Ganti semua backslash dengan forward slash
    let cleanPath = filePath.replace(/\\/g, '/');
    
    // 2. Jika path mengandung "uploads/", kita ambil bagian setelahnya
    // Ini penting jika Multer/Seeder menyimpan path yang berbeda.
    const uploadsIndex = cleanPath.indexOf('uploads/');
    if (uploadsIndex !== -1) {
      cleanPath = cleanPath.substring(uploadsIndex); // Ambil dari 'uploads/...'
    }

    // 3. Pastikan path yang digabungkan tidak memiliki double slash (//)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    
    // CleanPath seharusnya sekarang adalah 'uploads/projects/UUID-filename.jpg'
    // Hasilnya: http://localhost:3001/uploads/projects/UUID-filename.jpg
    return `${baseUrl}/${cleanPath}`;
  };

  // --- DATA FILTERING (Separated by Role) ---
  
  // 1. DATA ISSUER
  const issuerImages = project.documents?.filter(d => d.type === 'image' && d.uploader_role === 'issuer') || [];
  const issuerDocs = project.documents?.filter(d => d.type === 'document' && d.uploader_role === 'issuer') || [];
  const issuerSpecs = project.issuerDetail || {};

  // 2. DATA AUDITOR
  const auditDetail = project.auditorDetail;
  const auditorUser = project.auditor;
  const auditDocs = project.documents?.filter(d => d.type === 'audit_report' || (d.type === 'document' && d.uploader_role === 'auditor')) || [];
  const auditImages = project.documents?.filter(d => d.type === 'image' && d.uploader_role === 'auditor') || [];

  // Determine which images to show in Gallery based on Tab
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
          {value ? value.toLocaleString() : '-'} {unit && <span className={styles.unit}>{unit}</span>}
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
                  <span className={styles.projectId}>PROJECT ID: #{project.id.slice(0, 8).toUpperCase()}</span>
                  <h2 className={styles.projectTitle}>{project.name}</h2>
                </div>
                <div className={styles.headerActions}>
                  <span className={`${styles.badge} ${styles[project.status?.toLowerCase() || 'draft']}`}>
                    {project.status?.replace('_', ' ')}
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
                      <div className={styles.emptyMedia}><FaImage size={24} /> <span>No images provided by Issuer</span></div>
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
                            <span className={styles.docDate}>{formatDate(doc.uploaded_at)}</span>
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
                      <SpecItem icon={<FaInfoCircle/>} label="Type" value={issuerSpecs.installation_type || 'Rooftop'} unit="" />
                    </div>
                  </div>

                  <div className={styles.brandRow}>
                    <div className={styles.brandBadge}>Panel: <strong>{issuerSpecs.panel_brand || '-'}</strong></div>
                    <div className={styles.brandBadge}>Inverter: <strong>{issuerSpecs.inverter_brand || '-'}</strong></div>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaMapMarkerAlt /> LOCATION</h4>
                    <div className={styles.locationCard}>
                      <p className={styles.addressText}>
                        {project.address}<br/>
                        {project.location_city}, {project.location_province}<br/>
                        {project.location_country}
                      </p>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><FaAlignLeft /> DESCRIPTION</h4>
                    <div className={styles.descriptionBox}>
                      {project.description || "No description provided."}
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
                             {auditDetail.audit_status === 'verified' ? <FaCheckDouble /> : <FaInfoCircle />}
                          </div>
                          <div>
                            <h4 className={styles.auditStatusTitle}>{auditDetail.audit_status}</h4>
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
                            <strong className={styles.issuerName}>{auditorUser?.name || 'Unknown Auditor'}</strong>
                            <span className={styles.issuerEmail}>{auditorUser?.email || 'Registered Auditor'}</span>
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
                      <p>This project has not been audited yet. <br/>Auditor data will appear here once the verification process is complete.</p>
                      {project.auditor && (
                        <div className={styles.assignedBadge}>
                          Assigned to: <strong>{project.auditor.name}</strong>
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
                 ? `Submitted on: ${formatDate(project.created_at)}` 
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