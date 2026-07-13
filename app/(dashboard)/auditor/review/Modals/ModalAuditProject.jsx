'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModalAuditProject.module.css';
import { 
  FaTimes, FaClipboardCheck, FaFileUpload, FaSolarPanel, FaLeaf, FaCalendarAlt, FaPen, FaImage, FaInfoCircle, FaCheckSquare,
  FaExclamationTriangle
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ModalAuditProject({ project, onClose, onSave }) {
  const activeVersion = project?.active_version;
  const reportData = activeVersion?.audit_report || activeVersion?.auditReport || null;

  const [efSource, setEfSource] = useState('pln'); 

  const [formData, setFormData] = useState({
    action: '', 
    audit_notes: '',
    calculation_method: 'system_estimated',
    verified_generation_kwh: '', 
    baseline_emission_factor: '0.84',
    onsite_measurement_date: '',
  });

  const [checklistItems, setChecklistItems] = useState({
    location: { checked: false, label: `Kesesuaian Lokasi: ${activeVersion?.address || ''}, ${activeVersion?.kota?.nama || ''}` },
    capacity: { checked: false, label: `Kesesuaian Kapasitas Sistem: ${activeVersion?.total_system_capacity_kwp || 0} kWp` },
    brand: { checked: false, label: `Kesesuaian Spesifikasi Perangkat (Panel: ${activeVersion?.panel_brand || '-'}, Inv: ${activeVersion?.inverter_brand || '-'})` },
    period: { checked: false, label: `Validitas Periode Klaim Tidak Overlap` }
  });

  const [auditDocs, setAuditDocs] = useState([]);
  const [auditImages, setAuditImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const existingAuditDocs = activeVersion?.documents?.filter(d => ['audit_report', 'document', 'pdf'].includes(d.type) && d.uploader_role === 'auditor') || [];
  const existingAuditImages = activeVersion?.documents?.filter(d => ['audit_image', 'image', 'evidence'].includes(d.type) && d.uploader_role === 'auditor') || [];

  useEffect(() => {
    if (activeVersion?.status === 'returned_to_auditor' && reportData) {
      let oldEfSource = 'custom';
      if (reportData.baseline_emission_factor == '0.84') oldEfSource = 'pln';
      else if (reportData.baseline_emission_factor == '1.30' || reportData.baseline_emission_factor == '1.3') oldEfSource = 'generator';
      setEfSource(oldEfSource);

      setFormData({
        action: '', 
        audit_notes: reportData.audit_notes || '',
        calculation_method: reportData.calculation_method || 'system_estimated',
        verified_generation_kwh: reportData.verified_generation_kwh || '',
        baseline_emission_factor: reportData.baseline_emission_factor || '0.84',
        onsite_measurement_date: reportData.onsite_measurement_date ? reportData.onsite_measurement_date.substring(0, 10) : '',
      });

      if (reportData.verification_checklist && Array.isArray(reportData.verification_checklist)) {
        const checklistTxt = JSON.stringify(reportData.verification_checklist);
        setChecklistItems(prev => ({
          location: { ...prev.location, checked: checklistTxt.includes('Lokasi') },
          capacity: { ...prev.capacity, checked: checklistTxt.includes('Kapasitas') },
          brand: { ...prev.brand, checked: checklistTxt.includes('Spesifikasi') },
          period: { ...prev.period, checked: checklistTxt.includes('Periode') }
        }));
      }
    }
  }, [activeVersion, reportData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistToggle = (key) => {
    setChecklistItems(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }));
  };

  const handleFileChange = (e, type) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (type === 'document') setAuditDocs(filesArray);
      if (type === 'image') setAuditImages(filesArray);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.action) {
      Swal.fire('Warning', 'Silakan pilih keputusan audit (Verify / Reject).', 'warning');
      return;
    }
    
    const unverifiedItems = Object.keys(checklistItems).filter(k => !checklistItems[k].checked);
    const unverifiedLabels = unverifiedItems.map(k => checklistItems[k].label.split(':')[0]); 

    if (formData.action === 'verify' && unverifiedItems.length > 0) {
      const confirmAutoReject = await Swal.fire({
        title: 'Syarat Fisik Tidak Lengkap!',
        html: `Anda memilih "Verify", tetapi ada <b>${unverifiedItems.length} poin</b> yang belum dicentang.<br/><br/>Apakah Anda ingin mengubah keputusan ini menjadi <b>REJECT</b> secara otomatis?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Ya, Reject Proyek',
        cancelButtonText: 'Batal'
      });

      if (confirmAutoReject.isConfirmed) {
        const autoNotes = `Ditolak karena tidak sesuai kriteria berikut:\n- ${unverifiedLabels.join('\n- ')}\n\nCatatan Tambahan Auditor: ${formData.audit_notes}`;
        
        setIsLoading(true);
        try {
          await onSave(project.id, { action: 'reject', audit_notes: autoNotes.trim() });
          return;
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
      return; 
    }

    if (formData.action === 'reject') {
      let finalNotes = formData.audit_notes;
      if (unverifiedItems.length > 0 && !formData.audit_notes.includes('kriteria fisik')) {
         finalNotes = `Tidak sesuai kriteria fisik:\n- ${unverifiedLabels.join('\n- ')}\n\n${formData.audit_notes}`;
      }

      if (!finalNotes.trim()) {
        Swal.fire('Warning', 'Alasan penolakan (Notes) wajib diisi.', 'warning');
        return;
      }
      setIsLoading(true);
      try {
        await onSave(project.id, { action: 'reject', audit_notes: finalNotes.trim() });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (auditDocs.length === 0 && existingAuditDocs.length === 0) {
      Swal.fire('Warning', 'Dokumen Laporan Audit (PDF) wajib diunggah.', 'warning');
      return;
    }

    const payload = new FormData();
    payload.append('action', 'verify');
    payload.append('calculation_method', formData.calculation_method);
    payload.append('verified_installed_capacity_kwp', activeVersion?.total_system_capacity_kwp || 0);
    payload.append('baseline_emission_factor', formData.baseline_emission_factor);
    payload.append('audit_notes', formData.audit_notes);
    
    if (formData.onsite_measurement_date) {
      payload.append('onsite_measurement_date', formData.onsite_measurement_date);
    }

    if (formData.calculation_method === 'actual_inverter') {
      payload.append('verified_generation_kwh', formData.verified_generation_kwh);
    }

    Object.keys(checklistItems).forEach((key, index) => {
      payload.append(`verification_checklist[${index}]`, `[✓] Verified: ${checklistItems[key].label}`);
    });

    auditDocs.forEach(file => payload.append('audit_documents[]', file));
    auditImages.forEach(file => payload.append('audit_images[]', file));

    setIsLoading(true);
    try {
      await onSave(project.id, payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}><FaClipboardCheck /></div>
            <div>
              <h3 className={styles.modalTitle}>Submit Audit Decision</h3>
              <p className={styles.modalSubtitle}>Verifikasi Bukti Fisik & Otomatisasi Perhitungan Karbon MRV.</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
        </div>

        {/* BODY */}
        <div className={styles.body}>

          {activeVersion?.status === 'returned_to_auditor' && (
            <div style={{ backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '8px', color: '#991b1b', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '10px', border: '1px solid #fecaca', marginBottom: '20px' }}>
              <FaExclamationTriangle style={{fontSize: '1.2rem', flexShrink: 0, marginTop: '2px'}} />
              <div>
                <strong>Laporan Audit Dikembalikan oleh Admin!</strong>
                <p style={{ marginTop: '4px', marginBottom: 0 }}>
                  Catatan Admin: <i>"{activeVersion?.admin_notes || 'Silakan periksa kembali laporan komputasi Anda.'}"</i>
                </p>
              </div>
            </div>
          )}

          <div className={styles.projectCard}>
            <h4 className={styles.projectName}>{activeVersion?.name || 'Unnamed Project'}</h4>
            <div className={styles.projectMetaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Kapasitas (Issuer Claim)</span>
                <span className={styles.metaValue}>{activeVersion?.total_system_capacity_kwp || 0} kWp</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Periode Pengajuan Klaim</span>
                <span className={styles.metaValue} style={{ color: '#0284c7' }}>
                  {formatDate(activeVersion?.period_start)} - {formatDate(activeVersion?.period_end)}
                </span>
              </div>
            </div>
          </div>

          <form id="auditForm" onSubmit={handleSubmit} className={styles.formWrapper}>
            
            <div className={styles.decisionBox} style={{ marginBottom: '20px' }}>
              <label className={styles.decisionLabel}>Keputusan Hasil Pemeriksaan <span className={styles.req}>*</span></label>
              <select name="action" className={styles.decisionSelect} onChange={handleChange} value={formData.action}>
                <option value="">-- Pilih Keputusan --</option>
                <option value="verify">✅ PROYEK VALID (Terbitkan Sertifikat Audit & Mint NFT)</option>
                <option value="reject">❌ TOLAK SUBMISSION (Kembalikan ke Issuer untuk Revisi)</option>
              </select>
            </div>

            {formData.action === 'verify' && (
              <>
                {/* INTERACTIVE CHECKLIST */}
                <div className={styles.formSection}>
                  <h5 className={styles.sectionHeader}><FaCheckSquare className={styles.sectionIcon} /> Bukti Fisik & Administrasi (Wajib Dicocokkan)</h5>
                  <div className={styles.checklistGrid} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.keys(checklistItems).map((key) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', padding: '8px', background: checklistItems[key].checked ? '#f0fdf4' : '#f9fafb', border: '1px solid', borderColor: checklistItems[key].checked ? '#bbf7d0' : '#e5e7eb', borderRadius: '6px', transition: 'all 0.2s' }}>
                        <input type="checkbox" style={{ marginTop: '3px' }} checked={checklistItems[key].checked} onChange={() => handleChecklistToggle(key)} />
                        <span style={{ color: checklistItems[key].checked ? '#16a34a' : '#374151', fontWeight: checklistItems[key].checked ? '600' : '400' }}>
                          {checklistItems[key].label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* METODE & KALKULASI GENERATION */}
                <div className={styles.formSection}>
                  <h5 className={styles.sectionHeader}><FaSolarPanel className={styles.sectionIcon} /> Metodologi Komputasi Produksi Listrik</h5>
                  <div className={styles.gridTwo} style={{ marginBottom: '12px' }}>
                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                      <label>Metode Penghitungan kWh Listrik <span className={styles.req}>*</span></label>
                      <select name="calculation_method" className={styles.input} value={formData.calculation_method} onChange={handleChange} required>
                        <option value="system_estimated">System Estimation</option>
                        <option value="actual_inverter">Actual Inverter Data</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.gridTwo}>
                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                      <label>Verified Generation (kWh) <span className={styles.req}>*</span></label>
                      {formData.calculation_method === 'system_estimated' ? (
                        <div style={{ position: 'relative' }}>
                          <input type="text" className={styles.input} style={{ background: '#f3f4f6', color: '#9ca3af', fontStyle: 'italic' }} disabled value="Auto-Calculated" />
                          <FaInfoCircle style={{ position: 'absolute', right: '12px', top: '12px', color: '#9ca3af' }} title="Sistem otomatis mengalikan kapasitas klaim awal dengan akumulasi radiasi harian NASA." />
                        </div>
                      ) : (
                        <input type="number" step="0.01" name="verified_generation_kwh" className={styles.input} placeholder="Masukkan total kWh terverifikasi dari inverter" required onChange={handleChange} value={formData.verified_generation_kwh} />
                      )}
                    </div>
                  </div>
                </div>

                {/* EMISI & TANGGAL ONSITE */}
                <div className={styles.formSection}>
                  <h5 className={styles.sectionHeader}><FaLeaf className={styles.sectionIcon} /> Faktor Emisi & Validasi Lapangan</h5>
                  <div className={styles.gridTwo}>
                    
                    <div className={styles.inputGroup}>
                      <label>Sumber Listrik Baseline (Faktor Emisi) <span className={styles.req}>*</span></label>
                      <select 
                        className={styles.input} 
                        value={efSource} 
                        onChange={(e) => {
                          setEfSource(e.target.value);
                          if(e.target.value === 'pln') setFormData(p => ({...p, baseline_emission_factor: '0.84'}));
                          if(e.target.value === 'generator') setFormData(p => ({...p, baseline_emission_factor: '1.30'}));
                          if(e.target.value === 'custom') setFormData(p => ({...p, baseline_emission_factor: ''}));
                        }}
                      >
                        <option value="pln">Grid PLN (0.84 tCO2e/MWh)</option>
                        <option value="generator">Genset Diesel (1.30 tCO2e/MWh)</option>
                        <option value="custom">Input Manual / Kustom</option>
                      </select>
                      
                      {efSource === 'custom' && (
                        <input 
                          type="number" step="0.0001" name="baseline_emission_factor" 
                          className={styles.input} style={{marginTop: '8px'}} 
                          placeholder="Nilai kustom (tCO2e/MWh)" 
                          required onChange={handleChange} value={formData.baseline_emission_factor} 
                        />
                      )}
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label>On-site Visit Date {formData.calculation_method === 'actual_inverter' && <span className={styles.req}>*</span>}</label>
                      <div className={styles.iconInputWrapper}>
                        <FaCalendarAlt className={styles.fieldIcon} />
                        <input type="date" name="onsite_measurement_date" className={styles.inputWithIcon} required={formData.calculation_method === 'actual_inverter'} onChange={handleChange} value={formData.onsite_measurement_date} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* UPLOAD BUKTI */}
                <div className={styles.formSection}>
                  <h5 className={styles.sectionHeader}><FaFileUpload className={styles.sectionIcon} /> Dokumen Berita Acara & Foto Bukti</h5>
                  <div className={styles.gridTwo}>
                    <div className={styles.inputGroup}>
                      <label>Upload Laporan Audit (PDF) <span className={styles.req}>*</span></label>
                      <input type="file" accept=".pdf" id="auditDocs" className={styles.fileInput} style={{display:'none'}} onChange={(e) => handleFileChange(e, 'document')} />
                      
                      <label htmlFor="auditDocs" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '6px' }}>
                        <FaFileUpload color="#4b5563" />
                        <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                          {auditDocs.length > 0 
                            ? `${auditDocs.length} file baru dipilih` 
                            : (existingAuditDocs.length > 0 ? `Sudah ada ${existingAuditDocs.length} file (Pilih untuk menimpa)` : "Pilih File PDF...")}
                        </span>
                      </label>
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label>Upload Foto Dokumentasi Lapangan</label>
                      <input type="file" accept="image/*" id="auditImages" className={styles.fileInput} style={{display:'none'}} onChange={(e) => handleFileChange(e, 'image')} />
                      
                      <label htmlFor="auditImages" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '6px' }}>
                        <FaImage color="#4b5563"/>
                        <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                          {auditImages.length > 0 
                            ? `${auditImages.length} foto baru dipilih` 
                            : (existingAuditImages.length > 0 ? `Sudah ada ${existingAuditImages.length} foto (Pilih untuk menimpa)` : "Pilih Foto Lapangan...")}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* NOTES */}
            <div className={styles.inputGroup} style={{marginTop: '16px'}}>
              <label>Auditor Notes / Findings {formData.action === 'reject' && <span className={styles.req}> * (Wajib)</span>}</label>
              <div className={styles.iconInputWrapper}>
                <FaPen className={styles.fieldIconArea} />
                <textarea name="audit_notes" rows="3" className={styles.textarea} placeholder="Tulis rincian temuan audit atau alasan kuat penolakan di sini..." onChange={handleChange} value={formData.audit_notes} />
              </div>
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="submit" form="auditForm" className={styles.btnPrimary} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Audit Report'}
          </button>
        </div>

      </div>
    </div>
  );
}