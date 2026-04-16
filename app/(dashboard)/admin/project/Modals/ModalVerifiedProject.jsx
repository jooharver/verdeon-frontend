'use client';

import React, { useState } from 'react';
import styles from './ModalVerifiedProject.module.css';
import { 
  FaTimes, FaClipboardCheck 
} from 'react-icons/fa';

export default function ModalVerifiedProject({ project, onClose, onSave }) {
  const activeVersion = project?.active_version;

  const [formData, setFormData] = useState({
    action: '', // 'approve' atau 'reject'
    admin_notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.action) return alert("Tentukan keputusan verifikasi (Approve / Reject).");
    if (formData.action === 'reject' && !formData.admin_notes.trim()) {
      return alert("Alasan penolakan (Notes) wajib diisi jika menolak proyek.");
    }
    
    // Kirim keputusan ke parent
    onSave(project.id, formData);
  };

  if (!project) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <FaClipboardCheck className={styles.headerIcon} />
            <h3>Review Project Submission</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          
          <div className={styles.summaryCard}>
            <h4 className={styles.projectTitle}>{activeVersion?.name || 'Unnamed Project'}</h4>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <strong>Issuer:</strong> {project.issuer?.name || 'Unknown'}
              </span>
              <span className={styles.metaItem}>
                <strong>Location:</strong> {activeVersion?.location_city}, {activeVersion?.location_province}
              </span>
            </div>
          </div>

          <form id="verifyForm" onSubmit={handleSubmit} className={styles.formContainer}>
            
            {/* ACTION DECISION */}
            <div className={styles.formGroup}>
              <label>Verification Decision <span className={styles.required}>*</span></label>
              <select 
                name="action" 
                value={formData.action} 
                onChange={handleChange}
                className={styles.selectInput}
              >
                <option value="">-- Pilih Keputusan --</option>
                <option value="approve">Approve (Teruskan ke Auditor)</option>
                <option value="reject">Reject (Kembalikan ke Issuer)</option>
              </select>
            </div>

            {/* ADMIN NOTES (Wajib jika reject) */}
            <div className={styles.formGroup}>
              <label>
                Admin Notes 
                {formData.action === 'reject' && <span className={styles.required}> * (Wajib untuk Reject)</span>}
              </label>
              <textarea 
                name="admin_notes" 
                rows="4" 
                value={formData.admin_notes} 
                onChange={handleChange}
                placeholder="Tulis alasan jika menolak, atau catatan tambahan jika menyetujui..."
                className={styles.textareaInput}
              />
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button type="submit" form="verifyForm" className={styles.btnSave}>
            Process Verification
          </button>
        </div>

      </div>
    </div>
  );
}