'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectForm.module.css';
import { 
  FaTimes, FaCloudUploadAlt, FaFilePdf, FaImage, 
  FaTrash, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { projectService } from '../../../../services/projectService';

export default function ModalProjectForm({ project, onClose, onSave }) {
  const activeVersion = project?.active_version;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location_country: 'Indonesia',
    location_province: '',
    location_city: '',
    address: '',
    project_type: 'solar',
  });

  const [existingImages, setExistingImages] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // LOGIC STATUS: Hanya bisa edit jika Draft atau Rejected
  const isEditable = !activeVersion || ['draft', 'rejected'].includes(activeVersion.status);

  useEffect(() => {
    if (project && activeVersion) {
      setFormData({
        name: activeVersion.name || '',
        description: activeVersion.description || '',
        location_country: activeVersion.location_country || 'Indonesia',
        location_province: activeVersion.location_province || '',
        location_city: activeVersion.location_city || '',
        address: activeVersion.address || '',
        project_type: activeVersion.project_type || 'solar',
      });

      if (activeVersion.documents) {
        setExistingImages(activeVersion.documents.filter(d => d.type === 'image'));
        setExistingDocs(activeVersion.documents.filter(d => d.type === 'document'));
      }
    }
  }, [project, activeVersion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (project) {
        // REVISE ATAU UPDATE
        if (activeVersion.status === 'rejected') {
          await projectService.reviseProject(project.id);
          await projectService.updateProject(project.id, formData);
        } else {
          await projectService.updateProject(project.id, formData);
        }
      } else {
        // CREATE NEW
        await projectService.createProject(formData);
      }
      
      // Tambahkan await agar menunggu user klik OK
      await Swal.fire('Success', 'Data saved successfully', 'success');
      
      // Panggil onSave untuk trigger refresh di halaman utama
      onSave(); 
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.message || 'Something went wrong', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h3>{project ? `Edit Project (v${activeVersion?.version_number})` : 'Create New Project'}</h3>
          <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
        </div>

        <div className={styles.body}>
          <form id="projectForm" onSubmit={handleSubmit}>
            
            {activeVersion?.status === 'rejected' && (
              <div className={styles.alertWarning}>
                <FaExclamationCircle />
                <div>
                  <strong>Project Rejected:</strong> {activeVersion.admin_notes || activeVersion.auditor_notes}
                  <br/><small>Saving changes will create a new version (v{activeVersion.version_number + 1})</small>
                </div>
              </div>
            )}

            {!isEditable && (
              <div className={styles.alertInfo}>
                <FaCheckCircle /> <span>Project is under review and locked.</span>
              </div>
            )}

            <h4 className={styles.sectionTitle}>General Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Project Name <span className={styles.required}>*</span></label>
                <input 
                  name="name" 
                  type="text" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  disabled={!isEditable} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Project Type</label>
                <select name="project_type" value={formData.project_type} onChange={handleChange} disabled={!isEditable}>
                  <option value="solar">Solar Power</option>
                  <option value="wind">Wind Turbine</option>
                  <option value="mangrove">Mangrove Restoration</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Description</label>
                <textarea 
                  name="description" 
                  rows="3" 
                  value={formData.description} 
                  onChange={handleChange} 
                  disabled={!isEditable} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Province <span className={styles.required}>*</span></label>
                <input name="location_province" value={formData.location_province} onChange={handleChange} required disabled={!isEditable} />
              </div>
              <div className={styles.formGroup}>
                <label>City <span className={styles.required}>*</span></label>
                <input name="location_city" value={formData.location_city} onChange={handleChange} required disabled={!isEditable} />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Full Address <span className={styles.required}>*</span></label>
                <input name="address" value={formData.address} onChange={handleChange} required disabled={!isEditable} />
              </div>
            </div>

            <p className={styles.mutedText}>* Media upload currently handled after project creation.</p>

          </form>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={isLoading}>Cancel</button>
          {isEditable && (
            <button type="submit" form="projectForm" className={styles.primaryButton} disabled={isLoading}>
              {isLoading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}