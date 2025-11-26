'use client';

import React, { useState } from 'react';
import styles from './ModalAuditProject.module.css';
import { 
  FaTimes, FaClipboardCheck, FaFileUpload, FaSolarPanel, FaLeaf, FaCalendarAlt, FaPen, FaImage
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalAuditProject({ project, onClose, onSave }) {
  
  const [formData, setFormData] = useState({
    verified_installed_capacity_kwp: '',
    verified_annual_generation_kwh: '',
    baseline_emission_factor: '',
    expected_carbon_reduction_ton_per_year: '',
    onsite_measurement_date: '',
    audit_notes: '',
    audit_status: ''
  });

  // State untuk Multiple Files
  const [documents, setDocuments] = useState([]);
  const [images, setImages] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle File Docs
  const handleDocChange = (e) => {
    if (e.target.files) {
      // Convert FileList to Array
      setDocuments(Array.from(e.target.files));
    }
  };

  // Handle File Images
  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.audit_status) {
      Swal.fire('Warning', 'Please select an audit decision.', 'warning');
      return;
    }
    
    // Validasi Minimal 1 Dokumen Laporan
    if (documents.length === 0) {
      Swal.fire('Warning', 'Please upload at least one audit report document.', 'warning');
      return;
    }

    const payload = new FormData();
    
    // Append Text Fields
    Object.keys(formData).forEach(key => {
      payload.append(key, formData[key]);
    });

    // Append Multiple Documents
    documents.forEach((file) => {
        payload.append('audit_documents', file);
    });

    // Append Multiple Images
    images.forEach((file) => {
        payload.append('audit_images', file);
    });

    onSave(project.id, payload);
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
              <h3 className={styles.modalTitle}>Submit Audit Report</h3>
              <p className={styles.modalSubtitle}>Verify technical data and upload evidence.</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          
          {/* PROJECT INFO */}
          <div className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <h4 className={styles.projectName}>{project.name}</h4>
              <span className={styles.projectType}>Solar PV</span>
            </div>
            <div className={styles.projectMetaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Issuer</span>
                <span className={styles.metaValue}>{project.issuer?.name || '-'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Location</span>
                <span className={styles.metaValue}>{project.location_city}, {project.location_province}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Claimed Capacity</span>
                <span className={styles.metaValue}>{project.issuerDetail?.panel_capacity_wp || 0} Wp</span>
              </div>
            </div>
          </div>

          <form id="auditForm" onSubmit={handleSubmit} className={styles.formWrapper}>
            
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
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Annual Generation (KWh) <span className={styles.req}>*</span></label>
                  <input 
                    type="number" step="0.01" name="verified_annual_generation_kwh"
                    className={styles.input} placeholder="e.g. 15000" required
                    onChange={handleChange}
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
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Expected Reduction (Ton/Year) <span className={styles.req}>*</span></label>
                  <input 
                    type="number" step="0.01" name="expected_carbon_reduction_ton_per_year"
                    className={styles.input} placeholder="e.g. 12.5" required
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: EVIDENCE & REPORT (UPDATED) */}
            <div className={styles.formSection}>
              <h5 className={styles.sectionHeader}>
                <FaClipboardCheck className={styles.sectionIcon} /> Evidence & Report
              </h5>
              
              <div className={styles.gridTwo}>
                {/* DATE INPUT */}
                <div className={styles.inputGroup}>
                  <label>On-site Measurement Date <span className={styles.req}>*</span></label>
                  <div className={styles.iconInputWrapper}>
                    <FaCalendarAlt className={styles.fieldIcon} />
                    <input 
                      type="date" name="onsite_measurement_date"
                      className={styles.inputWithIcon} required
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                {/* UPLOAD DOCS (Multiple) */}
                <div className={styles.inputGroup}>
                  <label>Audit Documents (PDF) <span className={styles.req}>*</span></label>
                  <div className={styles.fileUploadWrapper}>
                    <input 
                      type="file" accept=".pdf" id="auditDocs" multiple
                      className={styles.fileInput} required
                      onChange={handleDocChange}
                    />
                    <label htmlFor="auditDocs" className={styles.fileLabel}>
                      <FaFileUpload />
                      <span>{documents.length > 0 ? `${documents.length} files selected` : "Choose PDF Files..."}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* UPLOAD IMAGES (Multiple) */}
              <div className={styles.inputGroup} style={{marginTop: '12px'}}>
                  <label>Evidence Images (JPG/PNG) <span className={styles.req}>*</span></label>
                  <div className={styles.fileUploadWrapper}>
                    <input 
                      type="file" accept="image/*" id="auditImages" multiple
                      className={styles.fileInput} 
                      onChange={handleImageChange}
                    />
                    <label htmlFor="auditImages" className={styles.fileLabel}>
                      <FaImage />
                      <span>{images.length > 0 ? `${images.length} images selected` : "Choose Evidence Photos..."}</span>
                    </label>
                  </div>
              </div>

              <div className={styles.inputGroup} style={{marginTop: '12px'}}>
                <label>Auditor Notes / Findings <span className={styles.req}>*</span></label>
                <div className={styles.iconInputWrapper}>
                  <FaPen className={styles.fieldIconArea} />
                  <textarea 
                    name="audit_notes" rows="3"
                    className={styles.textarea} required
                    placeholder="Write your technical findings, discrepancies, or recommendations..."
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.decisionBox}>
                <label className={styles.decisionLabel}>Final Decision <span className={styles.req}>*</span></label>
                <select 
                  name="audit_status" className={styles.decisionSelect}
                  onChange={handleChange} required defaultValue=""
                >
                  <option value="" disabled>-- Select Verification Result --</option>
                  <option value="verified">✅ VERIFIED (Approved)</option>
                  <option value="revision">⚠️ REVISION NEEDED (Incomplete Data)</option>
                  <option value="rejected">❌ REJECTED (Failed Validation)</option>
                </select>
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