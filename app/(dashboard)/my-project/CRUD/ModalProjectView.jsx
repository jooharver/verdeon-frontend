'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectView.module.css';
import { 
  FaTimes, FaMapMarkerAlt, FaSolarPanel, FaBolt, 
  FaCalendarDay, FaFilePdf, FaExternalLinkAlt, 
  FaInfoCircle, FaImage, FaExpand, FaChevronLeft, FaChevronRight,
  FaAlignLeft, FaBuilding, FaClipboardCheck, FaUserTie, FaLeaf, FaCheckDouble, FaClock, FaUserShield, FaShieldAlt
} from 'react-icons/fa';

export default function ModalProjectView({ project, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveImgIndex(0);
    setActiveTab('overview');
  }, [project]);

  if (!project) return null;

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

  const allDocs = activeVersion.documents || [];
  const issuerImages = allDocs.filter(d => d.type === 'image' && d.uploader_role === 'issuer');
  const issuerDocs = allDocs.filter(d => d.type === 'document' && d.uploader_role === 'issuer');
  
  const issuerSpecs = {
    total_system_capacity_kwp: activeVersion.total_system_capacity_kwp,
    inverter_capacity_kw: activeVersion.inverter_capacity_kw,
    installation_date: activeVersion.installation_date,
    panel_brand: activeVersion.panel_brand,
    inverter_brand: activeVersion.inverter_brand,
    // 👉 NEW: Ambil periode dari activeVersion
    period_start: activeVersion.period_start,
    period_end: activeVersion.period_end,
  };

  const auditDocs = allDocs.filter(d => (d.type === 'audit_report' || d.type === 'document') && d.uploader_role === 'auditor');
  const auditImages = allDocs.filter(d => d.type === 'image' && d.uploader_role === 'auditor');
  const reportData = activeVersion.audit_report || activeVersion.auditReport;
  const auditorUser = reportData?.auditor || project.auditor || null;

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

                  {project.tx_hash && (
                    <div className={styles.section} style={{ marginTop: '20px' }}>
                      <h4 className={styles.sectionTitle}>
                        <FaShieldAlt style={{ color: '#0d9488' }} /> ON-CHAIN EVIDENCE
                      </h4>
                      <div 
                        className={styles.descriptionBox} 
                        style={{ 
                          backgroundColor: '#f0fdfa', 
                          borderColor: '#5eead4', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '10px' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: '600' }}>Polygon Smart Contract</span>
                          <a 
                            href={`https://amoy.polygonscan.com/tx/${project.tx_hash}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                              color: '#0284c7', 
                              fontSize: '0.85rem', 
                              textDecoration: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              fontWeight: 'bold' 
                            }}
                          >
                            View on Explorer <FaExternalLinkAlt size={12} />
                          </a>
                        </div>
                        <code 
                          style={{ 
                            fontSize: '0.75rem', 
                            backgroundColor: '#ccfbf1', 
                            padding: '8px 10px', 
                            borderRadius: '6px', 
                            color: '#115e59',
                            wordBreak: 'break-all',
                            border: '1px solid #99f6e4',
                            fontWeight: '500'
                          }}
                        >
                          TxHash: {project.tx_hash}
                        </code>
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

                  {/* 👉 NEW: Tampilkan usulan Claim Period dari Issuer */}
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
                            backgroundColor: activeVersion.admin_verification_status === 'rejected' ? '#fef2f2' : '#f0fdf4', 
                            borderColor: activeVersion.admin_verification_status === 'rejected' ? '#fca5a5' : '#bbf7d0', 
                            color: '#374151' 
                          }}
                        >
                          {activeVersion.admin_notes ? activeVersion.admin_notes : "Proyek disetujui tanpa catatan tambahan dari Admin."}
                        </div>
                      )}
                    </div>
                  )}

                  {(activeVersion.auditor_verification_status === 'rejected' || activeVersion.auditor_notes) && (
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
                          {/* 👉 UPDATE: Tetap tampilkan periode di sini sebagai referensi verifikasi */}
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