'use client';

import React, { useState } from 'react';
import styles from './ModalAuditProject.module.css';
import { 
  FaTimes, FaClipboardCheck, FaFileUpload, FaSolarPanel, FaLeaf, FaCalendarAlt, FaPen, FaImage
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalAuditProject({ project, onClose, onSave }) {
  const activeVersion = project?.active_version;

  const [formData, setFormData] = useState({
    action: '', // 'verify' atau 'reject'
    audit_notes: '',
    // --- Data Teknis Baru ---
    verified_installed_capacity_kwp: '',
    verified_annual_generation_kwh: '',
    baseline_emission_factor: '',
    expected_carbon_reduction_ton_per_year: '',
    onsite_measurement_date: '',
  });

  // State File
  const [auditDocs, setAuditDocs] = useState([]);
  const [auditImages, setAuditImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler File Upload Multiple
  const handleFileChange = (e, type) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (type === 'document') setAuditDocs(filesArray);
      if (type === 'image') setAuditImages(filesArray);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.action) {
      Swal.fire('Warning', 'Silakan pilih keputusan audit (Verify / Reject).', 'warning');
      return;
    }
    
    if (formData.action === 'reject' && !formData.audit_notes.trim()) {
      Swal.fire('Warning', 'Alasan penolakan (Notes) wajib diisi.', 'warning');
      return;
    }

    // --- LOGIKA REJECT (Hanya Catatan, Tidak Perlu Data Teknis/File) ---
    if (formData.action === 'reject') {
      onSave(project.id, { action: 'reject', audit_notes: formData.audit_notes });
      return;
    }

    // --- LOGIKA VERIFY (Wajib Data Teknis & File) ---
    if (auditDocs.length === 0) {
      Swal.fire('Warning', 'Dokumen Laporan Audit (PDF) wajib diunggah untuk verifikasi.', 'warning');
      return;
    }

    // Siapkan FormData karena ada file upload
    const payload = new FormData();
    
    // Tambahkan variabel action untuk ditangkap parent
    payload.append('action', 'verify');

    // Masukkan data teks (kecuali action, karena backend tidak butuh field 'action')
    Object.keys(formData).forEach(key => {
      if (key !== 'action') {
        payload.append(key, formData[key]);
      }
    });

    // Masukkan file dokumen
    auditDocs.forEach(file => {
      payload.append('audit_documents[]', file);
    });

    // Masukkan file gambar
    auditImages.forEach(file => {
      payload.append('audit_images[]', file);
    });

    setIsLoading(true);
    try {
      // Panggil onSave dari parent (AuditorReviewPage), kirim FormData
      await onSave(project.id, payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <FaClipboardCheck />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Submit Audit Decision</h3>
              <p className={styles.modalSubtitle}>Verifikasi data teknis dan unggah bukti laporan.</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          
          <div className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <h4 className={styles.projectName}>{activeVersion?.name || 'Unnamed Project'}</h4>
            </div>
            <div className={styles.projectMetaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Klaim Kapasitas (Issuer)</span>
                <span className={styles.metaValue}>{activeVersion?.panel_capacity_wp || 0} KWp</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Lokasi</span>
                <span className={styles.metaValue}>{activeVersion?.location_city}, {activeVersion?.location_province}</span>
              </div>
            </div>
          </div>

          <form id="auditForm" onSubmit={handleSubmit} className={styles.formWrapper}>
            
            {/* DECISION SELECT */}
            <div className={styles.decisionBox} style={{ marginBottom: '20px' }}>
              <label className={styles.decisionLabel}>Keputusan Audit <span className={styles.req}>*</span></label>
              <select 
                name="action" 
                className={styles.decisionSelect}
                onChange={handleChange} 
                value={formData.action}
              >
                <option value="" disabled>-- Pilih Keputusan --</option>
                <option value="verify">✅ VERIFIED (Data Valid, Input Laporan Lengkap)</option>
                <option value="reject">❌ REJECTED (Data Tidak Valid, Kembalikan ke Issuer)</option>
              </select>
            </div>

            {/* FORM TEKNIS & UPLOAD (HANYA MUNCUL JIKA VERIFY) */}
            {formData.action === 'verify' && (
              <>
                {/* SECTION 1: TECHNICAL */}
                <div className={styles.formSection}>
                  <h5 className={styles.sectionHeader}>
                    <FaSolarPanel className={styles.sectionIcon} /> Technical Verification
                  </h5>
                  <div className={styles.gridTwo}>
                    <div className={styles.inputGroup}>
                      <label>Verified Capacity (KWp) <span className={styles.req}>*</span></label>
                      <input 
                        type="number" step="0.01" name="verified_installed_capacity_kwp"
                        className={styles.input} placeholder="e.g. 10.5" required
                        onChange={handleChange} value={formData.verified_installed_capacity_kwp}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Annual Generation (KWh) <span className={styles.req}>*</span></label>
                      <input 
                        type="number" step="0.01" name="verified_annual_generation_kwh"
                        className={styles.input} placeholder="e.g. 15000" required
                        onChange={handleChange} value={formData.verified_annual_generation_kwh}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CARBON */}
                <div className={styles.formSection}>
                  <h5 className={styles.sectionHeader}>
                    <FaLeaf className={styles.sectionIcon} /> Environmental Impact
                  </h5>
                  <div className={styles.gridTwo}>
                    <div className={styles.inputGroup}>
                      <label>Baseline Emission Factor <span className={styles.req}>*</span></label>
                      <input 
                        type="number" step="0.001" name="baseline_emission_factor"
                        className={styles.input} placeholder="e.g. 0.85" required
                        onChange={handleChange} value={formData.baseline_emission_factor}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Expected Reduction (Ton/Year) <span className={styles.req}>*</span></label>
                      <input 
                        type="number" step="0.01" name="expected_carbon_reduction_ton_per_year"
                        className={styles.input} placeholder="e.g. 12.5" required
                        onChange={handleChange} value={formData.expected_carbon_reduction_ton_per_year}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: EVIDENCE & UPLOAD */}
                <div className={styles.formSection}>
                  <h5 className={styles.sectionHeader}>
                    <FaFileUpload className={styles.sectionIcon} /> Evidence & Report
                  </h5>
                  
                  <div className={styles.gridTwo}>
                    <div className={styles.inputGroup}>
                      <label>On-site Measurement Date <span className={styles.req}>*</span></label>
                      <div className={styles.iconInputWrapper}>
                        <FaCalendarAlt className={styles.fieldIcon} />
                        <input 
                          type="date" name="onsite_measurement_date"
                          className={styles.inputWithIcon} required
                          onChange={handleChange} value={formData.onsite_measurement_date}
                        />
                      </div>
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label>Audit Documents (PDF) <span className={styles.req}>*</span></label>
                      <div className={styles.fileUploadWrapper}>
                        <input 
                          type="file" accept=".pdf" id="auditDocs" multiple
                          className={styles.fileInput} style={{display:'none'}}
                          onChange={(e) => handleFileChange(e, 'document')}
                        />
                        <label htmlFor="auditDocs" className={styles.fileLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '6px' }}>
                          <FaFileUpload color="#6b7280" />
                          <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                            {auditDocs.length > 0 ? `${auditDocs.length} files selected` : "Choose PDF Files..."}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className={styles.inputGroup} style={{marginTop: '12px'}}>
                      <label>Evidence Images (JPG/PNG)</label>
                      <div className={styles.fileUploadWrapper}>
                        <input 
                          type="file" accept="image/*" id="auditImages" multiple
                          className={styles.fileInput} style={{display:'none'}}
                          onChange={(e) => handleFileChange(e, 'image')}
                        />
                        <label htmlFor="auditImages" className={styles.fileLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '6px' }}>
                          <FaImage color="#6b7280"/>
                          <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                            {auditImages.length > 0 ? `${auditImages.length} images selected` : "Choose Evidence Photos..."}
                          </span>
                        </label>
                      </div>
                  </div>
                </div>
              </>
            )}

            {/* AUDITOR NOTES (Selalu Muncul) */}
            <div className={styles.inputGroup} style={{marginTop: '16px'}}>
              <label>
                Auditor Notes / Findings 
                {formData.action === 'reject' && <span className={styles.req}> * (Wajib)</span>}
              </label>
              <div className={styles.iconInputWrapper}>
                <FaPen className={styles.fieldIconArea} />
                <textarea 
                  name="audit_notes" rows="3"
                  className={styles.textarea} 
                  placeholder="Catatan teknis, alasan penolakan, atau rekomendasi..."
                  onChange={handleChange} value={formData.audit_notes}
                />
              </div>
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="submit" form="auditForm" className={styles.btnPrimary} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Decision'}
          </button>
        </div>

      </div>
    </div>
  );
}