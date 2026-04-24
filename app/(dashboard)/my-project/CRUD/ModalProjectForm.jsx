'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectForm.module.css';
import { 
  FaTimes, FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle, 
  FaFilePdf, FaImage, FaArrowRight, FaArrowLeft, FaBolt
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { projectService } from '../../../../services/projectService';

export default function ModalProjectForm({ project, onClose, onSave }) {
  const activeVersion = project?.active_version;

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location_country: 'Indonesia',
    location_province: '',
    location_city: '',
    address: '',
    project_type: 'solar',
    panel_capacity_wp: '',
    inverter_capacity_kw: '',
    area_size_m2: '',
    number_of_panels: '',
    installation_date: '',
    installation_type: 'Rooftop',
    panel_brand: '',
    inverter_brand: ''
  });

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
        panel_capacity_wp: activeVersion.panel_capacity_wp || '',
        inverter_capacity_kw: activeVersion.inverter_capacity_kw || '',
        area_size_m2: activeVersion.area_size_m2 || '',
        number_of_panels: activeVersion.number_of_panels || '',
        installation_date: activeVersion.installation_date || '',
        installation_type: activeVersion.installation_type || 'Rooftop',
        panel_brand: activeVersion.panel_brand || '',
        inverter_brand: activeVersion.inverter_brand || ''
      });
    }
  }, [project, activeVersion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (type === 'image') setNewImages(filesArray);
      if (type === 'document') setNewDocs(filesArray);
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault(); 
    if (!formData.name || !formData.location_province || !formData.location_city || !formData.address) {
      Swal.fire('Data Belum Lengkap', 'Mohon lengkapi semua field wajib (*) di halaman ini.', 'warning');
      return;
    }
    setStep(2);
  };

  const handlePrevStep = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = new FormData();
      
      Object.keys(formData).forEach(key => {
        if(formData[key] !== null && formData[key] !== '') {
            payload.append(key, formData[key]);
        }
      });

      newImages.forEach(file => payload.append('project_images[]', file));
      newDocs.forEach(file => payload.append('project_documents[]', file));

      if (project) {
        if (activeVersion.status === 'rejected') {
          await projectService.reviseProject(project.id);
          await projectService.updateProject(project.id, payload);
        } else {
          await projectService.updateProject(project.id, payload);
        }
      } else {
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
              <div className={styles.alertWarning} style={{ marginBottom: '20px' }}>
                <FaExclamationCircle />
                <div>
                  <strong>Project Rejected:</strong> {activeVersion.admin_notes || activeVersion.auditor_notes}
                  <br/><small>Saving changes will automatically create a new Draft version.</small>
                </div>
              </div>
            )}

            {!isEditable && (
              <div className={styles.alertInfo} style={{ marginBottom: '20px' }}>
                <FaCheckCircle /> <span>Project is locked for review.</span>
              </div>
            )}

            {/* ================= STEP 1: GENERAL INFO ================= */}
            {step === 1 && (
                <div className={styles.stepContainer}>
                    <h4 className={styles.sectionTitle} style={{marginTop: 0}}>General Information</h4>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Project Name <span className={styles.required}>*</span></label>
                            <input name="name" type="text" value={formData.name} onChange={handleChange} disabled={!isEditable} />
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
                            <input name="location_province" value={formData.location_province} onChange={handleChange} disabled={!isEditable} />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label>City <span className={styles.required}>*</span></label>
                            <input name="location_city" value={formData.location_city} onChange={handleChange} disabled={!isEditable} />
                        </div>
                        
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label>Full Address <span className={styles.required}>*</span></label>
                            <input name="address" value={formData.address} onChange={handleChange} disabled={!isEditable} />
                        </div>
                    </div>
                </div>
            )}

            {/* ================= STEP 2: TECHNICAL & MEDIA ================= */}
            {step === 2 && (
                <div className={styles.stepContainer}>
                    <h4 className={styles.sectionTitle} style={{marginTop: 0}}><FaBolt /> Technical Specifications</h4>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Capacity (Wp)</label>
                            <input name="panel_capacity_wp" type="number" step="0.01" value={formData.panel_capacity_wp} onChange={handleChange} disabled={!isEditable} placeholder="e.g. 5000" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Inverter Capacity (kW)</label>
                            <input name="inverter_capacity_kw" type="number" step="0.01" value={formData.inverter_capacity_kw} onChange={handleChange} disabled={!isEditable} placeholder="e.g. 5" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Area Size (m²)</label>
                            <input name="area_size_m2" type="number" step="0.01" value={formData.area_size_m2} onChange={handleChange} disabled={!isEditable} placeholder="e.g. 25" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Total Panels</label>
                            <input name="number_of_panels" type="number" value={formData.number_of_panels} onChange={handleChange} disabled={!isEditable} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Installation Date</label>
                            <input name="installation_date" type="date" value={formData.installation_date} onChange={handleChange} disabled={!isEditable} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Installation Type</label>
                            <select name="installation_type" value={formData.installation_type} onChange={handleChange} disabled={!isEditable}>
                                <option value="Rooftop">Rooftop</option>
                                <option value="Ground Mounted">Ground Mounted</option>
                                <option value="Floating">Floating</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Panel Brand</label>
                            <input name="panel_brand" type="text" value={formData.panel_brand} onChange={handleChange} disabled={!isEditable} placeholder="e.g. Longi, Jinko" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Inverter Brand</label>
                            <input name="inverter_brand" type="text" value={formData.inverter_brand} onChange={handleChange} disabled={!isEditable} placeholder="e.g. Huawei, Growatt" />
                        </div>
                    </div>

                    {isEditable && (
                    <>
                        <h4 className={styles.sectionTitle} style={{marginTop: '20px'}}><FaImage /> Media & Documents</h4>
                        <div className={styles.formGrid}>
                        
                        <div className={styles.formGroup}>
                            <label>Upload Gallery Photos</label>
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
                </div>
            )}
          </form>
        </div>

        <div className={styles.footer} style={{ justifyContent: 'space-between' }}>
          {step === 1 ? (
              <>
                  <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={isLoading}>Cancel</button>
                  <button type="button" className={styles.primaryButton} onClick={handleNextStep} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Next Step <FaArrowRight />
                  </button>
              </>
          ) : (
              <>
                  <button type="button" className={styles.secondaryButton} onClick={handlePrevStep} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaArrowLeft /> Back
                  </button>
                  {isEditable && (
                    <button type="submit" form="projectForm" className={styles.primaryButton} disabled={isLoading}>
                    {isLoading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
                    </button>
                  )}
              </>
          )}
        </div>

      </div>
    </div>
  );
}