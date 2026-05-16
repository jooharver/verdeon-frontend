'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectView.module.css'; 
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaPaperPlane
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalSubmitProject({ project, onClose, onSubmit }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveImgIndex(0);
  }, [project]);

  if (!project) return null;

  // --- MAPPING DATA ---
  const activeVersion = project.active_version || {};
  const projectIdString = String(project.id).padStart(4, '0');

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

  // --- HANDLERS ---
  const handleNextImage = (e) => {
    e.stopPropagation();
    if (issuerImages.length === 0) return;
    setActiveImgIndex((prev) => (prev === issuerImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (issuerImages.length === 0) return;
    setActiveImgIndex((prev) => (prev === 0 ? issuerImages.length - 1 : prev - 1));
  };

  const handleConfirmSubmit = async () => {
    const result = await Swal.fire({
      title: 'Ready to Submit?',
      text: "Once submitted, this project will be locked for Admin review. You will not be able to edit it unless it is returned for revision.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6', 
      cancelButtonColor: '#6b7280', 
      confirmButtonText: 'Yes, Submit to Admin!',
      cancelButtonText: 'Review Again'
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        await onSubmit(project.id); 
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const SpecItem = ({ icon, label, value, unit }) => (
    <div className={styles.specItem}>
      <div className={styles.specIcon}>{icon}</div>
      <div className={styles.specContent}>
        <span className={styles.specLabel}>{label}</span>
        <strong className={styles.specValue}>
          {value ? value.toLocaleString() : '-'} {unit && value ? <span className={styles.unit}>{unit}</span> : ''}
        </strong>
      </div>
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
                  <span className={styles.projectId}>FINAL REVIEW: #{projectIdString}</span>
                  <h2 className={styles.projectTitle}>{activeVersion.name || 'Unnamed Project'}</h2>
                </div>
                <div className={styles.headerActions}>
                  <span className={`${styles.badge} ${styles.draft}`}>
                    READY TO SUBMIT
                  </span>
                  <button className={styles.closeBtnHeader} onClick={onClose} disabled={isSubmitting}>
                    <FaTimes />
                  </button>
                </div>
            </div>
            {/* Banner Informasi */}
            <div style={{ backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '8px', color: '#1d4ed8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #bfdbfe' }}>
              <FaInfoCircle style={{fontSize: '1.2rem', flexShrink: 0}} /> 
              <span>Please verify that all information and documents are correct before submitting to the Administrator.</span>
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className={styles.content}>
            <div className={styles.tabContentAnim}>
              <div className={styles.colLeft}>
                
                {/* GALLERY ISSUER */}
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}><FaImage /> PROJECT GALLERY</h4>
                  {issuerImages.length > 0 ? (
                    <div className={styles.galleryContainer}>
                      <div className={styles.mainImageWrapper} onClick={() => setIsLightboxOpen(true)}>
                        <img 
                          src={getFullUrl(issuerImages[activeImgIndex]?.file_path)} 
                          alt="Main Preview" className={styles.mainImg}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Image+Error"; }}
                        />
                        <div className={styles.mainImageOverlay}>
                          <FaExpand /> <span>View Fullscreen</span>
                        </div>
                      </div>
                      {issuerImages.length > 1 && (
                        <div className={styles.thumbnailStrip}>
                          {issuerImages.map((img, idx) => (
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

                {/* ISSUER DOCS */}
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}><FaFilePdf /> LEGAL DOCUMENTS</h4>
                  <div className={styles.docList}>
                    {issuerDocs.length > 0 ? issuerDocs.map((doc) => (
                      <a key={doc.id} href={getFullUrl(doc.file_path)} target="_blank" rel="noreferrer" className={styles.docCard}>
                        <div className={styles.docIconBox}><FaFilePdf /></div>
                        <div className={styles.docInfo}>
                          <span className={styles.docName}>{doc.original_filename}</span>
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

                {/* CLAIM PERIOD */}
                <div className={styles.section} style={{marginTop: '20px'}}>
                  <h4 className={styles.sectionTitle}><FaCalendarDay /> CLAIM VERIFICATION PERIOD</h4>
                  <div className={styles.specsGrid}>
                    <SpecItem icon={<FaCalendarDay/>} label="Start Date" value={formatDate(issuerSpecs.period_start)} unit="" />
                    <SpecItem icon={<FaCalendarDay/>} label="End Date" value={formatDate(issuerSpecs.period_end)} unit="" />
                  </div>
                </div>

                <div className={styles.divider}></div>

                {/* LOCATION */}
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

                {/* DESCRIPTION */}
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}><FaAlignLeft /> DESCRIPTION</h4>
                  <div className={styles.descriptionBox}>
                    {activeVersion.description || "No description provided."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTION */}
          <div className={styles.footer} style={{ justifyContent: 'flex-end', gap: '12px' }}>
             <button type="button" onClick={onClose} disabled={isSubmitting} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s ease' }}>
               Cancel
             </button>
             <button type="button" onClick={handleConfirmSubmit} disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s ease' }}>
               <FaPaperPlane /> {isSubmitting ? 'Submitting...' : 'Submit to Admin'}
             </button>
          </div>

        </div>
      </div>

      {/* LIGHTBOX */}
      {isLightboxOpen && issuerImages.length > 0 && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <button className={styles.lightboxCloseBtn}><FaTimes /></button>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button className={styles.navBtn} onClick={handlePrevImage}><FaChevronLeft /></button>
            <div className={styles.lightboxImageWrapper}>
              <img src={getFullUrl(issuerImages[activeImgIndex]?.file_path)} alt="Full View" className={styles.lightboxImg} />
              <div className={styles.lightboxCounter}>{activeImgIndex + 1} / {issuerImages.length}</div>
            </div>
            <button className={styles.navBtn} onClick={handleNextImage}><FaChevronRight /></button>
          </div>
        </div>
      )}
    </>
  );
}