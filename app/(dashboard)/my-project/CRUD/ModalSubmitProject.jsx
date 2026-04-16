'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectView.module.css'; // Kita bisa reuse CSS dari Modal View
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaRulerCombined, FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaBuilding, FaPaperPlane
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalSubmitProject({ project, onClose, onSubmit }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
    const uploadsIndex = cleanPath.indexOf('uploads/');
    if (uploadsIndex !== -1) cleanPath = cleanPath.substring(uploadsIndex);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    return `${baseUrl}/${cleanPath}`;
  };

  // --- DATA FILTERING ---
  const allDocs = activeVersion.documents || [];
  const issuerImages = allDocs.filter(d => d.type === 'image' && d.uploader_role === 'issuer');
  const issuerDocs = allDocs.filter(d => d.type === 'document' && d.uploader_role === 'issuer');
  
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
      confirmButtonColor: '#3b82f6', // Warna biru untuk action utama
      cancelButtonColor: '#6b7280',  // Abu-abu untuk cancel
      confirmButtonText: 'Yes, Submit to Admin!',
      cancelButtonText: 'Review Again'
    });

    if (result.isConfirmed) {
      onSubmit(project.id); // Panggil fungsi submit dari parent
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
                  <button className={styles.closeBtnHeader} onClick={onClose}>
                    <FaTimes />
                  </button>
                </div>
            </div>
            {/* Banner Informasi */}
            <div style={{ backgroundColor: '#eff6ff', padding: '12px 16px', color: '#1d4ed8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #bfdbfe' }}>
              <FaInfoCircle /> 
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

                {/* LOCATION */}
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
             <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', cursor: 'pointer', fontWeight: '500' }}>
               Cancel
             </button>
             <button type="button" onClick={handleConfirmSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '600' }}>
               <FaPaperPlane /> Submit to Admin
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