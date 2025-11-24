'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalVerifiedProject.module.css';
import { 
  FaTimes, FaUserTie, FaClipboardCheck, FaInfoCircle 
} from 'react-icons/fa';

/**
 * Props:
 * - project: Object data project yang dipilih
 * - auditors: Array daftar user dengan role 'auditor' (Fetch di parent)
 * - onClose: Fungsi tutup modal
 * - onSave: Fungsi simpan (kirim data { status, auditorId, notes })
 */
export default function ModalVerifiedProject({ project, auditors = [], onClose, onSave }) {
  
  const [formData, setFormData] = useState({
    status: '',
    auditor_id: '',
    admin_notes: ''
  });

  // Populate data saat modal dibuka
  useEffect(() => {
    if (project) {
      setFormData({
        status: project.status || 'submitted',
        auditor_id: project.auditor_id || '', // Jika sudah ada auditor sebelumnya
        admin_notes: project.admin_notes || ''
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validasi sederhana
    if (!formData.status) return alert("Status must be selected");
    
    // Kirim data ke Parent untuk diproses ke API
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
            <h3>Process Verification</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          
          {/* 1. PROJECT SUMMARY CARD */}
          <div className={styles.summaryCard}>
            <h4 className={styles.projectTitle}>{project.name}</h4>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <strong>Issuer:</strong> {project.issuer?.name || 'Unknown'}
              </span>
              <span className={styles.metaItem}>
                <strong>Location:</strong> {project.location_city}, {project.location_province}
              </span>
            </div>
          </div>

          <form id="verifyForm" onSubmit={handleSubmit} className={styles.formContainer}>
            
            {/* 2. CHANGE STATUS */}
            <div className={styles.formGroup}>
              <label>Update Status <span className={styles.required}>*</span></label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                className={styles.selectInput}
              >
                <option value="submitted" disabled>Submitted (Current)</option>
                <option value="in review">In Review (Proses Audit)</option>
                <option value="verified">Verified (Disetujui)</option>
                <option value="revision">Revision Needed (Perlu Revisi)</option>
                <option value="rejected">Rejected (Ditolak)</option>
              </select>
              <small className={styles.helperText}>
                Select "Verified" only if all documents and specs are valid.
              </small>
            </div>

            {/* 3. ASSIGN AUDITOR */}
            <div className={styles.formGroup}>
              <label>Assign Auditor <span className={styles.required}>*</span></label>
              <div className={styles.selectWrapper}>
                <FaUserTie className={styles.inputIcon} />
                <select 
                  name="auditor_id" 
                  value={formData.auditor_id} 
                  onChange={handleChange}
                  className={styles.selectInputWithIcon}
                  required
                >
                  <option value="">-- Select Auditor --</option>
                  {auditors.length > 0 ? (
                    auditors.map((auditor) => (
                      <option key={auditor.id} value={auditor.id}>
                        {auditor.name} ({auditor.email})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No auditors found</option>
                  )}
                </select>
              </div>
            </div>

            {/* 4. ADMIN NOTES */}
            <div className={styles.formGroup}>
              <label>Admin Notes / Reason</label>
              <textarea 
                name="admin_notes" 
                rows="4" 
                value={formData.admin_notes} 
                onChange={handleChange}
                placeholder="Write notes for the auditor or reason for rejection..."
                className={styles.textareaInput}
              />
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button type="submit" form="verifyForm" className={styles.btnSave}>
            Save Decision
          </button>
        </div>

      </div>
    </div>
  );
}