'use client';

import React, { useState, useMemo } from 'react';
// Impor CSS sudah benar
import styles from './User.module.css'; 
import Topbar from '../../../components/Topbar';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch,
  FaUserShield, FaUserTie, FaUserCog, FaUser,
  FaChevronLeft, FaChevronRight,
  FaSort, FaSortUp, FaSortDown,
  FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';

// SWR dan API Client (Path sudah benar)
import useSWR from 'swr';
import { getUsers, createUser, updateUser, deleteUser } from '../../../../lib/apiClient';

// Import Modal (Path sudah benar)
import UserFormModal from '../../../components/admin/UserFormModal';
import DeleteConfirmationModal from '../../../components/admin/DeleteConfirmationModal';

// (Opsional) Notifikasi
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Definisikan Enum Role
const UserRole = {
  BUYER: 'buyer',
  ISSUER: 'issuer',
  ADMIN: 'admin',
  AUDITOR: 'auditor',
};

export default function UserManagementPage() {
  const pageTitle = "User Management";
  const pageBreadcrumbs = ["Admin", "Users"];

  const { 
    data: rawUsers,
    error: swrError,
    isLoading: swrIsLoading,
    mutate 
  } = useSWR('/user', getUsers);

  const users = rawUsers || [];

  // State UI
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [itemsPerPage, setItemsPerPage] = useState(5); // <-- Saya ubah jadi 5, sesuai gambar
  
  const [currentPage, setCurrentPage] = useState(1); 
  
  // --- [PERBAIKAN] ---
  // Default sort diubah dari 'name' menjadi 'id'
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  // State Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [isMutating, setIsMutating] = useState(false); 

  // --- LOGIKA DATA (Filter > Sort > Paginate) ---
  const searchedUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'All') return searchedUsers;
    return searchedUsers.filter(user => user.role === roleFilter);
  }, [searchedUsers, roleFilter]);

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        // [PERBAIKAN KECIL] - Logika sort untuk angka (ID)
        if (sortConfig.key === 'id') {
          return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
        }
        // Logika sort untuk string (nama, email, role)
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);

  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedUsers.slice(start, end);
  }, [sortedUsers, currentPage, itemsPerPage]);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // --- Fungsi Render Badge ---
  const renderRoleBadge = (role) => {
    const roleClasses = { 
      [UserRole.ADMIN]: styles.badgeAdmin, 
      [UserRole.ISSUER]: styles.badgeIssuer, 
      [UserRole.AUDITOR]: styles.badgeAuditor, 
      [UserRole.BUYER]: styles.badgeBuyer 
    };
    const roleIcons = { 
      [UserRole.ADMIN]: <FaUserShield />, 
      [UserRole.ISSUER]: <FaUserTie />, 
      [UserRole.AUDITOR]: <FaUserCog />, 
      [UserRole.BUYER]: <FaUser /> 
    };
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    return (
      <span className={`${styles.badge} ${roleClasses[role] || styles.badgeBuyer}`}>
        {roleIcons[role]} {roleName}
      </span>
    );
  };

  // --- Handlers UI (Paginasi, Sort, Filter) ---
  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) { setCurrentPage(newPage); } };
  const handleRoleFilterChange = (e) => { setRoleFilter(e.target.value); setCurrentPage(1); };
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FaSort className={styles.sortIcon} />;
    if (sortConfig.direction === 'asc') return <FaSortUp className={styles.sortIconActive} />;
    return <FaSortDown className={styles.sortIconActive} />;
  };

  // --- Handlers Modal (CUD) ---
  // (Tidak ada perubahan di sini)
  const handleCreate = () => { setCurrentUser(null); setIsFormModalOpen(true); };
  const handleEdit = (user) => { setCurrentUser(user); setIsFormModalOpen(true); };
  const openDeleteModal = (user) => { setCurrentUser(user); setIsDeleteModalOpen(true); };
  const closeModals = () => { setIsFormModalOpen(false); setIsDeleteModalOpen(false); setCurrentUser(null); };
  const handleSave = async (formData) => {
    setIsMutating(true);
    try {
      if (currentUser) {
        await updateUser(currentUser.id, formData);
        toast.success("User updated successfully!");
      } else {
        await createUser(formData);
        toast.success("User created successfully!");
      }
      mutate(); 
      closeModals();
    } catch (err) {
      console.error("Failed to save user:", err);
      toast.error(err.response?.data?.message || "Failed to save user.");
    } finally {
      setIsMutating(false);
    }
  };
  const handleConfirmDelete = async () => {
    if (!currentUser) return;
    setIsMutating(true);
    try {
      await deleteUser(currentUser.id);
      toast.success("User deleted successfully!");
      mutate(); 
      closeModals();
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setIsMutating(false);
    }
  };

  // --- Loading & Error State ---
  // (Tidak ada perubahan di sini)
  if (swrIsLoading) {
    return (
      <div>
        <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
        <main className={styles.container}>
          <div className={styles.loadingState}>
            <FaSpinner className={styles.spinnerIcon} />
            <p>Loading users...</p>
          </div>
        </main>
      </div>
    );
  }
  if (swrError) {
    return (
      <div>
        <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
        <main className={styles.container}>
          <div className={styles.emptyState}>
            <FaExclamationTriangle />
            <p>Failed to load user data. Please try again later.</p>
            <p><i>{swrError.message}</i></p>
          </div>
        </main>
      </div>
    );
  }

  // --- Render Halaman Utama ---
  return (
    <div>
      <ToastContainer theme="light" position="top-right" autoClose={3000} />
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>All Users</h3>
            {/* Tombol ini sekarang akan mendapat style dari CSS di bawah */}
            <button className={styles.primaryButton} onClick={handleCreate}>
              <FaPlus /> <span>Create User</span>
            </button>
          </div>

          {/* Toolbar (Filter) */}
          <div className={styles.cardToolbar}>
          {/* (Tidak ada perubahan di sini) */}
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                className={styles.searchInput} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <select 
              className={styles.filterSelect} 
              value={roleFilter} 
              onChange={handleRoleFilterChange}
            >
              <option value="All">All Roles</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.ISSUER}>Issuer</option>
              <option value={UserRole.AUDITOR}>Auditor</option>
              <option value={UserRole.BUYER}>Buyer</option>
            </select>
          </div>

          {/* Table Data */}
          <div className={styles.tableContainer}>
          {/* (Tidak ada perubahan di sini) */}
            <div className={styles.table}>
              {/* Table Header */}
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}><button onClick={() => handleSort('id')}><span>ID</span> <SortIcon columnKey="id" /></button></div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}><button onClick={() => handleSort('name')}><span>Name</span> <SortIcon columnKey="name" /></button></div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}><button onClick={() => handleSort('email')}><span>Email</span> <SortIcon columnKey="email" /></button></div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}><button onClick={() => handleSort('role')}><span>Role</span> <SortIcon columnKey="role" /></button></div>
                <div className={styles.tableCell}>Actions</div>
              </div>

              {/* Table Body */}
              {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
                <div className={styles.tableRow} key={user.id}>
                  <div className={styles.tableCell} data-label="ID"><span className={styles.userId}>{user.id}</span></div>
                  <div className={styles.tableCell} data-label="Name"><span className={styles.userName}>{user.name}</span></div>
                  <div className={styles.tableCell} data-label="Email">{user.email}</div>
                  <div className={styles.tableCell} data-label="Role">{renderRoleBadge(user.role)}</div>
                  <div className={`${styles.tableCell} ${styles.actionsCell}`} data-label="Actions">
                    <button className={styles.iconButton} onClick={() => handleEdit(user)} title="Edit"><FaEdit /></button>
                    <button className={`${styles.iconButton} ${styles.iconDelete}`} onClick={() => openDeleteModal(user)} title="Delete"><FaTrash /></button>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>
              
                  <p>No users found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Paginasi */}
          <div className={styles.cardFooter}>
          {/* (Tidak ada perubahan di sini) */}
            <span className={styles.footerInfo}>
              Showing {startItem} - {endItem} of {totalItems} results
            </span>
            <div className={styles.footerControls}>
              <select className={styles.perPageSelect} value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={5}>5 per page</option> 
                <option value={10}>10 per page</option> 
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <div className={styles.pagination}>
                <button className={styles.paginationButton} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <FaChevronLeft /> <span>Previous</span>
                </button>
                <button className={styles.paginationButton} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalItems === 0}>
                  <span>Next</span> <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- MODALS --- */}
      {isFormModalOpen && (
        <UserFormModal
          user={currentUser}
          onClose={closeModals}
          onSave={handleSave}
          isSaving={isMutating}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          user={currentUser}
          onClose={closeModals}
          onConfirm={handleConfirmDelete}
          isDeleting={isMutating}
        />
      )}
    </div>
  );
}