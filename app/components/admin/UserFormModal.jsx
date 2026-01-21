'use client';

import React, { useState, useEffect } from 'react';
// --- [PERUBAHAN] ---
// Impor file CSS baru yang khusus untuk modal
import styles from './UserModal.module.css'; 
import { FaSpinner } from 'react-icons/fa';

const UserRole = {
  BUYER: 'buyer',
  ISSUER: 'issuer',
  ADMIN: 'admin',
  AUDITOR: 'auditor',
};

export default function UserFormModal({ user, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.BUYER,
    password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || UserRole.BUYER,
        password: '', 
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: UserRole.BUYER,
        password: '',
      });
    }
  }, [user]); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (user && !dataToSave.password) {
      delete dataToSave.password;
    }
    onSave(dataToSave);
  };

  const isEditMode = !!user;

  // 'styles.' di sini mengacu pada file UserModal.module.css
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>
          {isEditMode ? 'Edit User' : 'Create New User'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              disabled={isSaving}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              disabled={isSaving}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">
              {isEditMode ? 'New Password (Optional)' : 'Password'}
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password} 
              onChange={handleChange} 
              required={!isEditMode} 
              disabled={isSaving}
              placeholder={isEditMode ? 'Leave blank to keep unchanged' : ''}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="role">Role</label>
            <select 
              id="role" 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              disabled={isSaving}
            >
              <option value={UserRole.BUYER}>Buyer</option>
              <option value={UserRole.ISSUER}>Issuer</option>
              <option value={UserRole.AUDITOR}>Auditor</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
          <div className={styles.modalActions}>
            <button 
              type="button" 
              className={styles.secondaryButton} 
              onClick={onClose} 
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.primaryButton} 
              disabled={isSaving}
            >
              {isSaving ? (
                <FaSpinner className={styles.spinnerIconSmall} />
              ) : (
                isEditMode ? 'Save Changes' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}