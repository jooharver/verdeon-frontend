'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectForm.module.css';
import { 
  FaTimes, FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle, 
  FaFilePdf, FaImage, FaArrowRight, FaArrowLeft, FaBolt, FaCalendarAlt
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { projectService } from '../../../../services/projectService';
import { api } from '../../../../services/api';

export default function ModalProjectForm({ project, onClose, onSave }) {
  const activeVersion = project?.active_version;

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    kode_provinsi: '',
    kode_kota: '',
    kode_kecamatan: '',
    kode_kelurahan: '',
    address: '',
    project_type: 'solar',
    total_system_capacity_kwp: '',
    inverter_capacity_kw: '',
    installation_date: '',
    panel_brand: '',
    inverter_brand: '',
    // 👉 NEW: Tambahkan state untuk claim period
    period_start: '',
    period_end: ''
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [newImages, setNewImages] = useState([]);
  const [newDocs, setNewDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditable = !activeVersion || ['draft', 'rejected', 'revision'].includes(activeVersion.status);

  useEffect(() => {
    if (project && activeVersion) {
      // Potong format timestamp ISO (YYYY-MM-DDTHH:mm:ss.sssZ) menjadi YYYY-MM-DD untuk input type date
      const formatForInput = (dateStr) => dateStr ? dateStr.split('T')[0] : '';
      
      setFormData({
        name: activeVersion.name || '',
        description: activeVersion.description || '',
        kode_provinsi: activeVersion.kode_provinsi || '',
        kode_kota: activeVersion.kode_kota || '',
        kode_kecamatan: activeVersion.kode_kecamatan || '',
        kode_kelurahan: activeVersion.kode_kelurahan || '',
        address: activeVersion.address || '',
        project_type: activeVersion.project_type || 'solar',
        total_system_capacity_kwp: activeVersion.total_system_capacity_kwp || '',
        inverter_capacity_kw: activeVersion.inverter_capacity_kw || '',
        installation_date: formatForInput(activeVersion.installation_date),
        panel_brand: activeVersion.panel_brand || '',
        inverter_brand: activeVersion.inverter_brand || '',
        // 👉 NEW: Set state dari data existing
        period_start: formatForInput(activeVersion.period_start),
        period_end: formatForInput(activeVersion.period_end),
      });
    }
  }, [project, activeVersion]);

  // Fetch Wilayah
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await api('/wilayah/provinsi'); 
        setProvinces(res || []);
      } catch (err) {
        console.error("Gagal memuat provinsi", err);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (formData.kode_provinsi) {
      api(`/wilayah/kota?provinsi=${formData.kode_provinsi}`)
        .then(res => setCities(res || [])).catch(() => setCities([]));
    } else {
      setCities([]);
    }
  }, [formData.kode_provinsi]);

  useEffect(() => {
    if (formData.kode_kota) {
      api(`/wilayah/kecamatan?kota=${formData.kode_kota}`)
        .then(res => setDistricts(res || [])).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [formData.kode_kota]);

  useEffect(() => {
    if (formData.kode_kecamatan) {
      api(`/wilayah/kelurahan?kecamatan=${formData.kode_kecamatan}`)
        .then(res => setVillages(res || [])).catch(() => setVillages([]));
    } else {
      setVillages([]);
    }
  }, [formData.kode_kecamatan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegionChange = (e) => {
    const { name, value } = e.target;
    if (!isEditable) return;

    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'kode_provinsi') {
        newData.kode_kota = ''; newData.kode_kecamatan = ''; newData.kode_kelurahan = '';
      } else if (name === 'kode_kota') {
        newData.kode_kecamatan = ''; newData.kode_kelurahan = '';
      } else if (name === 'kode_kecamatan') {
        newData.kode_kelurahan = '';
      }
      return newData;
    });
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
    if (!formData.name || !formData.kode_provinsi || !formData.kode_kota || !formData.kode_kecamatan || !formData.kode_kelurahan || !formData.address) {
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
                            <select name="kode_provinsi" value={formData.kode_provinsi} onChange={handleRegionChange} disabled={!isEditable}>
                                <option value="">Pilih Provinsi</option>
                                {provinces.map(prov => (
                                    <option key={prov.kode} value={prov.kode}>{prov.nama}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label>City <span className={styles.required}>*</span></label>
                            <select name="kode_kota" value={formData.kode_kota} onChange={handleRegionChange} disabled={!isEditable || !formData.kode_provinsi}>
                                <option value="">Pilih Kota/Kabupaten</option>
                                {cities.map(city => (
                                    <option key={city.kode} value={city.kode}>{city.nama}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>District <span className={styles.required}>*</span></label>
                            <select name="kode_kecamatan" value={formData.kode_kecamatan} onChange={handleRegionChange} disabled={!isEditable || !formData.kode_kota}>
                                <option value="">Pilih Kecamatan</option>
                                {districts.map(dist => (
                                    <option key={dist.kode} value={dist.kode}>{dist.nama}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Village <span className={styles.required}>*</span></label>
                            <select name="kode_kelurahan" value={formData.kode_kelurahan} onChange={handleRegionChange} disabled={!isEditable || !formData.kode_kecamatan}>
                                <option value="">Pilih Kelurahan/Desa</option>
                                {villages.map(vill => (
                                    <option key={vill.kode} value={vill.kode}>{vill.nama}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label>Full Address <span className={styles.required}>*</span></label>
                            <input name="address" value={formData.address} onChange={handleChange} disabled={!isEditable} placeholder="Nama jalan, RT/RW, Patokan..." />
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className={styles.stepContainer}>
                    <h4 className={styles.sectionTitle} style={{marginTop: 0}}><FaBolt /> Technical Specifications</h4>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Total System Capacity (kWp)</label>
                            <input name="total_system_capacity_kwp" type="number" step="0.01" value={formData.total_system_capacity_kwp} onChange={handleChange} disabled={!isEditable} placeholder="e.g. 5.5" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Inverter Capacity (kW)</label>
                            <input name="inverter_capacity_kw" type="number" step="0.01" value={formData.inverter_capacity_kw} onChange={handleChange} disabled={!isEditable} placeholder="e.g. 5" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Installation Date</label>
                            <input name="installation_date" type="date" value={formData.installation_date} onChange={handleChange} disabled={!isEditable} />
                        </div>
                        <div className={styles.formGroup}></div> {/* Spacer */}
                        
                        <div className={styles.formGroup}>
                            <label>Panel Brand</label>
                            <input name="panel_brand" type="text" value={formData.panel_brand} onChange={handleChange} disabled={!isEditable} placeholder="e.g. Longi, Jinko" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Inverter Brand</label>
                            <input name="inverter_brand" type="text" value={formData.inverter_brand} onChange={handleChange} disabled={!isEditable} placeholder="e.g. Huawei, Growatt" />
                        </div>
                    </div>
                    
                    {/* 👉 NEW: Claim Period Section */}
                    <h4 className={styles.sectionTitle} style={{marginTop: '20px'}}><FaCalendarAlt /> Claim Verification Period</h4>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Period Start Date</label>
                            <input name="period_start" type="date" value={formData.period_start} onChange={handleChange} disabled={!isEditable} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Period End Date</label>
                            <input name="period_end" type="date" value={formData.period_end} onChange={handleChange} disabled={!isEditable} />
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