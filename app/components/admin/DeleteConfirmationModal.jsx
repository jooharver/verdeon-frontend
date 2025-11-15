'use client';

import React from 'react';
// --- [PERUBAHAN] ---
// Impor file CSS baru yang khusus untuk modal
import styles from './UserModal.module.css'; 
import { FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

export default function DeleteConfirmationModal({ user, onClose, onConfirm, isDeleting }) {
  if (!user) return null; 

  // 'styles.' di sini mengacu pada file UserModal.module.css
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        <div className={styles.confirmHeader}>
          <div className={styles.confirmIconWrapper}>
            <FaExclamationTriangle />
          </div>
          <h3 className={styles.modalTitle}>Delete User</h3>
        </div>

        <p className={styles.confirmText}>
          Are you sure you want to delete the user{' '}
          <strong>{user?.name}</strong>? 
          This action cannot be undone.
        </p>

        <div className={styles.modalActions}>
          <button 
            type="button" 
            className={styles.secondaryButton} 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={styles.dangerButton}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <FaSpinner className={styles.spinnerIconSmall} />
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}