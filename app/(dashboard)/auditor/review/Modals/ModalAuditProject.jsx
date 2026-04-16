'use client';

import React, { useState } from 'react';
import styles from './ModalAuditProject.module.css';
import { 
  FaTimes, FaClipboardCheck, FaPen
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalAuditProject({ project, onClose, onSave }) {
  const activeVersion = project?.active_version;

  const [formData, setFormData] = useState({
    action: '', // 'verify' atau 'reject'
    audit_notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.action) {
      Swal.fire('Warning', 'Silakan pilih keputusan audit (Verify / Reject).', 'warning');
      return;
    }
    
    // Jika ditolak, catatan wajib diisi
    if (formData.action === 'reject' && !formData.audit_notes.trim()) {
      Swal.fire('Warning', 'Alasan penolakan (Notes) wajib diisi.', 'warning');
      return;
    }

    // Kirim payload ke Parent (AuditorReviewPage)
    onSave(project.id, formData);
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
              <p className={styles.modalSubtitle}>Finalize your review for this project.</p>
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
                <span className={styles.metaLabel}>Issuer</span>
                <span className={styles.metaValue}>{project.issuer?.name || '-'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Location</span>
                <span className={styles.metaValue}>{activeVersion?.location_city}, {activeVersion?.location_province}</span>
              </div>
            </div>
          </div>

          <form id="auditForm" onSubmit={handleSubmit} className={styles.formWrapper}>
            
            <div className={styles.formSection}>
              <div className={styles.decisionBox}>
                <label className={styles.decisionLabel}>Audit Decision <span className={styles.req}>*</span></label>
                <select 
                  name="action" 
                  className={styles.decisionSelect}
                  onChange={handleChange} 
                  value={formData.action}
                >
                  <option value="" disabled>-- Pilih Keputusan --</option>
                  <option value="verify">✅ VERIFIED (Lolos Audit)</option>
                  <option value="reject">❌ REJECTED (Perlu Revisi / Gagal)</option>
                </select>
              </div>

              <div className={styles.inputGroup} style={{marginTop: '16px'}}>
                <label>
                  Auditor Notes 
                  {formData.action === 'reject' && <span className={styles.req}> * (Wajib)</span>}
                </label>
                <div className={styles.iconInputWrapper}>
                  <FaPen className={styles.fieldIconArea} />
                  <textarea 
                    name="audit_notes" 
                    rows="4"
                    className={styles.textarea} 
                    placeholder="Tuliskan catatan teknis, alasan penolakan, atau rekomendasi di sini..."
                    onChange={handleChange}
                    value={formData.audit_notes}
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" form="auditForm" className={styles.btnPrimary}>
            Submit Audit Result
          </button>
        </div>

      </div>
    </div>
  );
}