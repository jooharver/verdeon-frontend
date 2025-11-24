'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectView.module.css';
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaRulerCombined, FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaBuilding
} from 'react-icons/fa';

export default function ModalProjectView({ project, onClose }) {
  // --- STATE GALLERY ---
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveImgIndex(0);
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
    const cleanPath = filePath.replace(/\\/g, '/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    return `${baseUrl}/${cleanPath}`;
  };

  const images = project.documents?.filter(d => d.type === 'image') || [];
  const docs = project.documents?.filter(d => d.type === 'document') || [];
  const specs = project.issuerDetail || {};

  // --- HANDLERS ---
  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const SpecItem = ({ icon, label, value, unit }) => (
    <div className={styles.specItem}>
      <div className={styles.specIcon}>{icon}</div>
      <div className={styles.specContent}>
        <span className={styles.specLabel}>{label}</span>
        <strong className={styles.specValue}>
          {value ? value.toLocaleString() : '-'} {unit && <span className={styles.unit}>{unit}</span>}
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
            <div className={styles.headerTitleGroup}>
              <span className={styles.projectId}>PROJECT ID: #{project.id.toUpperCase()}</span>
              <h2 className={styles.projectTitle}>{project.name}</h2>
            </div>
            <div className={styles.headerActions}>
              <span className={`${styles.badge} ${styles[project.status?.toLowerCase() || 'draft']}`}>
                {project.status}
              </span>
              <button className={styles.closeBtnHeader} onClick={onClose}>
                <FaTimes />
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className={styles.content}>
            
            {/* LEFT COLUMN: GALLERY, DOCS, & ISSUER (RESTORED) */}
            <div className={styles.colLeft}>
              
              {/* GALLERY */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}><FaImage /> PROJECT GALLERY</h4>
                {images.length > 0 ? (
                  <div className={styles.galleryContainer}>
                    <div className={styles.mainImageWrapper} onClick={() => setIsLightboxOpen(true)}>
                      <img 
                        src={getFullUrl(images[activeImgIndex].file_path)} 
                        alt="Main Preview" className={styles.mainImg}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Error"; }}
                      />
                      <div className={styles.mainImageOverlay}>
                        <FaExpand /> <span>View Fullscreen</span>
                      </div>
                    </div>
                    {images.length > 1 && (
                      <div className={styles.thumbnailStrip}>
                        {images.map((img, idx) => (
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
                  <div className={styles.emptyMedia}><FaImage size={24} /> <span>No images uploaded</span></div>
                )}
              </div>

              {/* LEGAL DOCS */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}><FaFilePdf /> LEGAL DOCUMENTS</h4>
                <div className={styles.docList}>
                  {docs.length > 0 ? docs.map((doc) => (
                    <a key={doc.id} href={getFullUrl(doc.file_path)} target="_blank" rel="noreferrer" className={styles.docCard}>
                      <div className={styles.docIconBox}><FaFilePdf /></div>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{doc.original_filename}</span>
                        <span className={styles.docDate}>{formatDate(doc.uploaded_at)}</span>
                      </div>
                      <FaExternalLinkAlt className={styles.linkIcon} />
                    </a>
                  )) : (
                    <div className={styles.emptyStateSimple}>No documents attached.</div>
                  )}
                </div>
              </div>

              {/* ISSUER INFORMATION (RESTORED HERE) */}
              {project.issuer && (
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}><FaBuilding /> ISSUER INFORMATION</h4>
                  <div className={styles.issuerCard}>
                    <div className={styles.issuerIconBox}>
                      <FaBuilding />
                    </div>
                    <div className={styles.issuerDetails}>
                      <strong className={styles.issuerName}>{project.issuer.name || 'Unknown User'}</strong>
                      <span className={styles.issuerEmail}>{project.issuer.email || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: SPECS, LOCATION, & DESCRIPTION */}
            <div className={styles.colRight}>
              
              {/* SPECS */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}><FaBolt /> TECHNICAL SPECIFICATIONS</h4>
                <div className={styles.specsGrid}>
                  <SpecItem icon={<FaSolarPanel/>} label="Capacity" value={specs.panel_capacity_wp} unit="Wp" />
                  <SpecItem icon={<FaBolt/>} label="Inverter" value={specs.inverter_capacity_kw} unit="kW" />
                  <SpecItem icon={<FaRulerCombined/>} label="Area Size" value={specs.area_size_m2} unit="m²" />
                  <SpecItem icon={<FaSolarPanel/>} label="Total Panels" value={specs.number_of_panels} unit="Unit" />
                  <SpecItem icon={<FaCalendarDay/>} label="Installation" value={formatDate(specs.installation_date)} unit="" />
                  <SpecItem icon={<FaInfoCircle/>} label="Type" value={specs.installation_type || 'Rooftop'} unit="" />
                </div>
              </div>

              {/* BRANDS */}
              <div className={styles.brandRow}>
                <div className={styles.brandBadge}>Panel Brand: <strong>{specs.panel_brand || '-'}</strong></div>
                <div className={styles.brandBadge}>Inverter Brand: <strong>{specs.inverter_brand || '-'}</strong></div>
              </div>

              <div className={styles.divider}></div>

              {/* LOCATION */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}><FaMapMarkerAlt /> PROJECT LOCATION</h4>
                <div className={styles.locationCard}>
                  <p className={styles.addressText}>
                    {project.address}<br/>
                    {project.location_city}, {project.location_province}<br/>
                    {project.location_country}
                  </p>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}><FaAlignLeft /> DESCRIPTION</h4>
                <div className={styles.descriptionBox}>
                  {project.description || "No description provided."}
                </div>
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className={styles.footer}>
             <div className={styles.footerNote}>Created at: {formatDate(project.created_at)}</div>
             <button className={styles.closeBtnBottom} onClick={onClose}>Close View</button>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && images.length > 0 && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <button className={styles.lightboxCloseBtn}><FaTimes /></button>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button className={styles.navBtn} onClick={handlePrevImage}><FaChevronLeft /></button>
            <div className={styles.lightboxImageWrapper}>
              <img src={getFullUrl(images[activeImgIndex].file_path)} alt="Full View" className={styles.lightboxImg} />
              <div className={styles.lightboxCounter}>{activeImgIndex + 1} / {images.length}</div>
            </div>
            <button className={styles.navBtn} onClick={handleNextImage}><FaChevronRight /></button>
          </div>
          <div className={styles.lightboxThumbs} onClick={e => e.stopPropagation()}>
             {images.map((img, idx) => (
                <img key={idx} src={getFullUrl(img.file_path)} 
                  className={`${styles.lbThumb} ${idx === activeImgIndex ? styles.lbThumbActive : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                />
             ))}
          </div>
        </div>
      )}
    </>
  );
}