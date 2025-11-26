'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalProjectForm.module.css';
import { 
  FaTimes, FaCloudUploadAlt, FaFilePdf, FaImage, 
  FaTrash, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import Service untuk hapus file
import { projectService } from '../../../../services/projectService';

export default function ModalProjectForm({ project, onClose, onSave }) {
  // --- STATE FORM DATA ---
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft',
    location_country: 'Indonesia',
    location_province: '',
    location_city: '',
    address: '',
    project_type: 'solar',
    panel_brand: '',
    panel_capacity_wp: 0,
    number_of_panels: 0,
    inverter_brand: '',
    inverter_capacity_kw: 0,
    installation_type: 'rooftop',
    area_size_m2: 0,
    installation_date: new Date().toISOString().split('T')[0],
    
    // File Baru (Uploadan User)
    image: null, 
    document: null 
  });

  // --- STATE EXISTING FILES ---
  const [existingImages, setExistingImages] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);

  // --- STATE GALLERY SLIDER ---
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // --- STATE PREVIEW NEW FILES ---
  const [newImagePreview, setNewImagePreview] = useState([]);
  const [newDocPreview, setNewDocPreview] = useState([]);

  // --- CHECK VERIFIED STATUS ---
  const isVerified = project?.status?.toLowerCase() === 'verified';

  // 1. POPULATE DATA SAAT EDIT
  useEffect(() => {
    if (project) {
      setFormData(prev => ({
        ...prev,
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'draft',
        location_province: project.location_province || '',
        location_city: project.location_city || '',
        address: project.address || '',
        panel_brand: project.issuerDetail?.panel_brand || '',
        panel_capacity_wp: project.issuerDetail?.panel_capacity_wp || 0,
        number_of_panels: project.issuerDetail?.number_of_panels || 0,
        inverter_brand: project.issuerDetail?.inverter_brand || '',
        inverter_capacity_kw: project.issuerDetail?.inverter_capacity_kw || 0,
        installation_type: project.issuerDetail?.installation_type || 'rooftop',
        area_size_m2: project.issuerDetail?.area_size_m2 || 0,
        installation_date: project.issuerDetail?.installation_date 
          ? new Date(project.issuerDetail.installation_date).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
      }));

      if (project.documents) {
        setExistingImages(project.documents.filter(d => d.type === 'image'));
        setExistingDocs(project.documents.filter(d => d.type === 'document'));
      }
    }
  }, [project]);

  // Helper URL
  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    
    // 1. Ganti semua backslash dengan forward slash
    let cleanPath = filePath.replace(/\\/g, '/');
    
    // 2. Jika path mengandung "uploads/", kita ambil bagian setelahnya
    // Ini penting jika Multer/Seeder menyimpan path yang berbeda.
    const uploadsIndex = cleanPath.indexOf('uploads/');
    if (uploadsIndex !== -1) {
      cleanPath = cleanPath.substring(uploadsIndex); // Ambil dari 'uploads/...'
    }

    // 3. Pastikan path yang digabungkan tidak memiliki double slash (//)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    
    // CleanPath seharusnya sekarang adalah 'uploads/projects/UUID-filename.jpg'
    // Hasilnya: http://localhost:3001/uploads/projects/UUID-filename.jpg
    return `${baseUrl}/${cleanPath}`;
  };

  // 2. HANDLE DELETE EXISTING FILE
  const handleDeleteExisting = async (docId, type) => {
    if (isVerified && type === 'document') {
       Swal.fire('Locked', 'Cannot delete legal documents of a verified project.', 'warning');
       return;
    }

    const result = await Swal.fire({
      title: 'Hapus File?',
      text: "File ini akan dihapus permanen dari server.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await projectService.deleteDocument(docId);
        Swal.fire('Terhapus!', 'File berhasil dihapus.', 'success');

        if (type === 'image') {
          const updated = existingImages.filter(img => img.id !== docId);
          setExistingImages(updated);
          if (activeImgIndex >= updated.length) {
            setActiveImgIndex(Math.max(0, updated.length - 1));
          }
        } else {
          setExistingDocs(prev => prev.filter(doc => doc.id !== docId));
        }
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire('Gagal', 'Gagal menghapus file (Mungkin terkunci).', 'error');
      }
    }
  };

  // 3. HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    // Jika Verified, cegah edit text/status (kecuali input file gambar)
    if (isVerified && type !== 'file' && name !== 'status') return;

    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files }));
      const fileNames = Array.from(files).map(f => f.name);
      if (name === 'image') setNewImagePreview(fileNames);
      if (name === 'document') setNewDocPreview(fileNames);
    } else {
      const val = type === 'number' ? parseFloat(value) || 0 : value;
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h3>{project ? `Edit: ${project.name}` : 'Create New Project'}</h3>
          <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
        </div>

        <div className={styles.body}>
          <form id="projectForm" onSubmit={handleSubmit}>
            
            {/* INFO VERIFIED */}
            {isVerified && (
              <div style={{ 
                marginBottom: '16px', padding: '12px', background: '#e0f2fe', 
                border: '1px solid #bae6fd', borderRadius: '8px', color: '#0369a1',
                fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <FaExclamationCircle /> 
                <span>Project is Verified. Only images can be updated.</span>
              </div>
            )}

            {/* --- 1. MEDIA SECTION --- */}
            <h4 className={styles.sectionTitle}>Project Media</h4>
            <div className={styles.mediaContainer}>
              
              {/* GALLERY */}
              <div className={styles.galleryColumn}>
                 <label className={styles.subLabel}>Current Gallery</label>
                 {existingImages.length > 0 ? (
                    <div className={styles.existingGalleryWrapper}>
                      <div className={styles.heroImageWrapper}>
                        <img 
                          src={getFullUrl(existingImages[activeImgIndex].file_path)} 
                          alt="Main Preview" 
                          className={styles.heroImg}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Error"; }}
                        />
                        <button 
                          type="button"
                          className={styles.deleteHeroBtn}
                          onClick={() => handleDeleteExisting(existingImages[activeImgIndex].id, 'image')}
                          title="Delete this image"
                        >
                          <FaTrash />
                        </button>
                        <div className={styles.heroCounter}>
                          {activeImgIndex + 1} / {existingImages.length}
                        </div>
                      </div>
                      {existingImages.length > 1 && (
                        <div className={styles.thumbnailStrip}>
                          {existingImages.map((img, idx) => (
                            <div 
                              key={img.id} 
                              className={`${styles.thumbItem} ${idx === activeImgIndex ? styles.thumbActive : ''}`}
                              onClick={() => setActiveImgIndex(idx)}
                            >
                              <img src={getFullUrl(img.file_path)} alt="thumb" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                 ) : (
                    <div className={styles.emptyBox}>
                       <FaExclamationCircle /> <span>No existing images. Upload below.</span>
                    </div>
                 )}
              </div>

              {/* UPLOAD IMAGE */}
              <div className={styles.uploadColumn}>
                <label className={styles.subLabel}>Upload New Images</label>
                <div className={styles.fileInputWrapper}>
                  <input 
                    type="file" name="image" id="imageInput"
                    accept="image/*" multiple onChange={handleChange}
                    className={styles.hiddenInput}
                  />
                  <label htmlFor="imageInput" className={styles.uploadBox}>
                    <FaCloudUploadAlt className={styles.uploadIcon} />
                    <span>Click to add new photos</span>
                  </label>
                </div>
                {newImagePreview.length > 0 && (
                  <div className={styles.newFileList}>
                    {newImagePreview.map((name, idx) => (
                      <span key={idx} className={styles.newFileBadge}>
                        <FaImage /> {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- 2. DOCUMENTS SECTION --- */}
            <h4 className={styles.sectionTitle}>Legal Documents</h4>
            <div className={styles.docsContainer}>
              <div className={styles.docColumn}>
                <label className={styles.subLabel}>Current Documents</label>
                {existingDocs.length > 0 ? (
                  <div className={styles.existingDocsList}>
                    {existingDocs.map((doc) => (
                      <div key={doc.id} className={styles.docItem}>
                        <div className={styles.docLeft}>
                          <FaFilePdf className={styles.pdfIcon} />
                          <span className={styles.docName}>{doc.original_filename}</span>
                        </div>
                        {!isVerified && (
                          <button 
                            type="button" 
                            className={styles.deleteDocBtn}
                            onClick={() => handleDeleteExisting(doc.id, 'document')}
                            title="Delete Document"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className={styles.emptyBoxSmall}>No documents uploaded</div>
                )}
              </div>

              <div className={styles.docColumn}>
                 {!isVerified ? (
                   <>
                     <label className={styles.subLabel}>Upload New (PDF)</label>
                     <input 
                        type="file" name="document" id="docInput"
                        accept=".pdf,.doc,.docx" multiple onChange={handleChange}
                        className={styles.hiddenInput}
                      />
                      <label htmlFor="docInput" className={styles.uploadBoxSmall}>
                        <FaCloudUploadAlt /> <span>Click to select files</span>
                      </label>
                      {newDocPreview.length > 0 && (
                        <div className={styles.newFileList}>
                          {newDocPreview.map((name, idx) => (
                            <span key={idx} className={styles.newFileBadge}>
                               <FaCheckCircle /> {name}
                            </span>
                          ))}
                        </div>
                      )}
                   </>
                 ) : (
                    <div className={styles.emptyBoxSmall} style={{background: '#f3f4f6', borderColor: '#d1d5db', cursor: 'not-allowed'}}>
                       <FaCheckCircle style={{color: 'green'}} /> 
                       <span> Documents are locked.</span>
                    </div>
                 )}
              </div>
            </div>

            {/* --- 3. DETAILS --- */}
            <h4 className={styles.sectionTitle}>General Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Project Name <span className={styles.required}>*</span></label>
                <input name="name" type="text" value={formData.name} onChange={handleChange} required disabled={isVerified} />
              </div>
              
              {/* STATUS SELECTION (PERBAIKAN UTAMA DI SINI) */}
              <div className={styles.formGroup}>
                <label>Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  disabled={isVerified} /* Hanya disable jika Verified */
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  
                  {/* Tampilkan option Verified/Rejected hanya jika status saat ini memang itu (biar tidak error value), tapi user tidak bisa memilihnya dari awal */ }
                  {['verified', 'rejected'].includes(formData.status) && (
                     <option value={formData.status} disabled>{formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}</option>
                  )}
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Description</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleChange} disabled={isVerified} />
              </div>

              <div className={styles.formGroup}>
                <label>Province <span className={styles.required}>*</span></label>
                <input name="location_province" value={formData.location_province} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={styles.formGroup}>
                <label>City <span className={styles.required}>*</span></label>
                <input name="location_city" value={formData.location_city} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Address <span className={styles.required}>*</span></label>
                <input name="address" value={formData.address} onChange={handleChange} required disabled={isVerified} />
              </div>
            </div>

            <h4 className={styles.sectionTitle}>Technical Specs</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Panel Brand <span className={styles.required}>*</span></label>
                <input name="panel_brand" value={formData.panel_brand} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={styles.formGroup}>
                <label>Capacity (Wp) <span className={styles.required}>*</span></label>
                <input name="panel_capacity_wp" type="number" value={formData.panel_capacity_wp} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={styles.formGroup}>
                <label>Total Panels <span className={styles.required}>*</span></label>
                <input name="number_of_panels" type="number" value={formData.number_of_panels} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={styles.formGroup}>
                <label>Inverter Brand <span className={styles.required}>*</span></label>
                <input name="inverter_brand" value={formData.inverter_brand} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={styles.formGroup}>
                <label>Inverter (kW) <span className={styles.required}>*</span></label>
                <input name="inverter_capacity_kw" type="number" value={formData.inverter_capacity_kw} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={styles.formGroup}>
                <label>Installation Type</label>
                <select name="installation_type" value={formData.installation_type} onChange={handleChange} disabled={isVerified}>
                  <option value="rooftop">Rooftop</option>
                  <option value="ground-mounted">Ground Mounted</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Area Size (m²) <span className={styles.required}>*</span></label>
                <input name="area_size_m2" type="number" value={formData.area_size_m2} onChange={handleChange} required disabled={isVerified} />
              </div>
              <div className={styles.formGroup}>
                <label>Installation Date <span className={styles.required}>*</span></label>
                <input name="installation_date" type="date" value={formData.installation_date} onChange={handleChange} required disabled={isVerified} />
              </div>
            </div>

          </form>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button>
          <button type="submit" form="projectForm" className={styles.primaryButton}>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}