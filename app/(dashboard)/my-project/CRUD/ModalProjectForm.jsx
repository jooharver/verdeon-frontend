'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectForm.module.css';
import { 
  FaTimes, FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle, FaFilePdf, FaImage
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

  // State File Baru
  const [newImages, setNewImages] = useState([]);
  const [newDocs, setNewDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditable = !activeVersion || ['draft', 'rejected', 'revision'].includes(activeVersion.status);

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
    }
  }, [project, activeVersion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler File Upload Multiple
  const handleFileChange = (e, type) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (type === 'image') setNewImages(filesArray);
      if (type === 'document') setNewDocs(filesArray);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Siapkan FormData (Bukan JSON)
      const payload = new FormData();
      
      // Masukkan semua data teks ke payload
      Object.keys(formData).forEach(key => {
        payload.append(key, formData[key]);
      });

      // Masukkan file foto dengan format array (project_images[])
      newImages.forEach(file => {
        payload.append('project_images[]', file);
      });

      // Masukkan file dokumen dengan format array (project_documents[])
      newDocs.forEach(file => {
        payload.append('project_documents[]', file);
      });

      // 2. Eksekusi API
      if (project) {
        // Jika statusnya REJECTED, panggil revise (buat versi baru) sebelum update file
        if (activeVersion.status === 'rejected') {
          await projectService.reviseProject(project.id);
          // Setelah revisi, update file dan datanya ke versi yang baru
          await projectService.updateProject(project.id, payload);
        } else {
          // Jika Draft/Revision, langsung update (termasuk upload file)
          await projectService.updateProject(project.id, payload);
        }
      } else {
        // CREATE NEW PROJECT (termasuk upload file)
        await projectService.createProject(payload);
      }
      
      await Swal.fire('Success', 'Project and files saved successfully', 'success');
      onSave(); 
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.response?.data?.message || 'Something went wrong', 'error');
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
                  <br/><small>Saving changes will automatically create a new Draft version.</small>
                </div>
              </div>
            )}

            {!isEditable && (
              <div className={styles.alertInfo}>
                <FaCheckCircle /> <span>Project is locked for review.</span>
              </div>
            )}

            <h4 className={styles.sectionTitle}>General Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Project Name <span className={styles.required}>*</span></label>
                <input name="name" type="text" value={formData.name} onChange={handleChange} required disabled={!isEditable} />
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
                <textarea name="description" rows="3" value={formData.description} onChange={handleChange} disabled={!isEditable} />
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

            {/* --- UPLOAD SECTION --- */}
            {isEditable && (
              <>
                <h4 className={styles.sectionTitle}>Project Media & Documents</h4>
                <div className={styles.formGrid}>
                  
                  {/* UPLOAD IMAGES */}
                  <div className={styles.formGroup}>
                    <label>Upload Gallery Photos (JPG/PNG)</label>
                    <div className={styles.fileUploadWrapper}>
                      <input 
                        type="file" accept="image/*" id="projectImages" multiple
                        onChange={(e) => handleFileChange(e, 'image')}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="projectImages" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '6px' }}>
                        <FaCloudUploadAlt size={20} color="#6b7280" />
                        <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                          {newImages.length > 0 ? `${newImages.length} images selected` : 'Choose photos...'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* UPLOAD PDF */}
                  <div className={styles.formGroup}>
                    <label>Upload Legal Docs (PDF)</label>
                    <div className={styles.fileUploadWrapper}>
                      <input 
                        type="file" accept=".pdf,.doc,.docx" id="projectDocs" multiple
                        onChange={(e) => handleFileChange(e, 'document')}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="projectDocs" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '6px' }}>
                        <FaFilePdf size={20} color="#ef4444" />
                        <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                          {newDocs.length > 0 ? `${newDocs.length} files selected` : 'Choose documents...'}
                        </span>
                      </label>
                    </div>
                  </div>

                </div>
              </>
            )}

          </form>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={isLoading}>Cancel</button>
          {isEditable && (
            <button type="submit" form="projectForm" className={styles.primaryButton} disabled={isLoading}>
              {isLoading ? 'Saving...' : project ? 'Save Changes & Files' : 'Create Project'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}