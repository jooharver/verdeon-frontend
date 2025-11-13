'use client';

import React, { useState, useMemo } from 'react';
import styles from './User.module.css'; // Menggunakan CSS Module
import Topbar from '../../../components/Topbar';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch,
  FaUserShield, FaUserCheck, FaUser,
  FaChevronLeft, FaChevronRight,
  FaSort, FaSortUp, FaSortDown,
  FaExclamationTriangle
} from 'react-icons/fa';

// --- Data Dummy ---
const dummyUsers = [
  { id: 1, name: "Adi Sucipto", email: "adi.sucipto@verdeon.com", role: "Admin", createdAt: "2025-10-28" },
  { id: 2, name: "Budi Santoso", email: "budi.santoso@investor.com", role: "User", createdAt: "2025-11-05" },
  { id: 3, name: "Citra Lestari", email: "citra.lestari@project.com", role: "User", createdAt: "2025-11-10" },
  { id: 4, name: "Doni Haryanto", email: "doni.haryanto@gmail.com", role: "User", createdAt: "2025-10-15" },
  { id: 5, name: "Eka Wijaya", email: "eka.wijaya@verdeon.com", role: "Admin", createdAt: "2025-09-30" },
  { id: 6, name: "Fajar Nugroho", email: "fajar.n@yahoo.com", role: "User", createdAt: "2025-11-12" },
  { id: 7, name: "Gita Permata", email: "gita.permata@company.com", role: "User", createdAt: "2025-11-15" },
];

export default function UserManagementPage() {
  // Data untuk Topbar
  const pageTitle = "User Management";
  const pageBreadcrumbs = ["Admin", "Users"];

  // State
  const [users, setUsers] = useState(dummyUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, user: null });
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // --- LOGIKA DATA (FILTER > SORT > PAGINATE) ---
  const searchedUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'All') {
      return searchedUsers;
    }
    return searchedUsers.filter(user => user.role === roleFilter);
  }, [searchedUsers, roleFilter]);

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
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
  
  const renderRoleBadge = (role) => {
    const roleClasses = { "Admin": styles.badgeAdmin, "User": styles.badgeUser };
    const roleIcons = { "Admin": <FaUserShield />, "User": <FaUser /> };
    return <span className={`${styles.badge} ${roleClasses[role] || styles.badgeUser}`}>{roleIcons[role]} {role}</span>;
  };

  // --- Handlers ---
  const handleCreate = () => { setCurrentUser(null); setIsFormModalOpen(true); };
  const handleEdit = (user) => { setCurrentUser(user); setIsFormModalOpen(true); };
  
  const openDeleteModal = (user) => {
    setDeleteModalState({ isOpen: true, user: user });
  };
  const closeDeleteModal = () => {
    setDeleteModalState({ isOpen: false, user: null });
  };
  const handleConfirmDelete = () => {
    if (deleteModalState.user) {
      setUsers(users.filter(u => u.id !== deleteModalState.user.id));
      closeDeleteModal();
    }
  };
  
  const handleSave = (formData) => {
    if (currentUser) {
      setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...formData } : u));
    } else {
      const newUser = { 
        id: Date.now(), 
        ...formData, 
        createdAt: new Date().toISOString().split('T')[0] 
      };
      setUsers([newUser, ...users]);
    }
    setIsFormModalOpen(false);
  };

  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) { setCurrentPage(newPage); } };
  
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };
  
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

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>All Users</h3>
            <button className={styles.primaryButton} onClick={handleCreate}>
              <FaPlus /> <span>Create User</span>
            </button>
          </div>

          {/* --- CARD TOOLBAR (DIPERBARUI) --- */}
          <div className={styles.cardToolbar}>
            {/* Item 1: Search Bar (Rata Kiri) */}
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
            
            {/* Item 2: Filter Select (Rata Kanan) */}
            <select 
              className={styles.filterSelect} 
              value={roleFilter} 
              onChange={handleRoleFilterChange}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>

          {/* --- TABLE DATA --- */}
          <div className={styles.tableContainer}>
            <div className={styles.table}>
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('id')}>
                    <span>ID</span> <SortIcon columnKey="id" />
                  </button>
                </div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('name')}>
                    <span>Name</span> <SortIcon columnKey="name" />
                  </button>
                </div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('email')}>
                    <span>Email</span> <SortIcon columnKey="email" />
                  </button>
                </div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('role')}>
                    <span>Role</span> <SortIcon columnKey="role" />
                  </button>
                </div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('createdAt')}>
                    <span>Created At</span> <SortIcon columnKey="createdAt" />
                  </button>
                </div>
                <div className={styles.tableCell}>Actions</div>
              </div>

              {/* Table Body */}
              {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
                <div className={styles.tableRow} key={user.id}>
                  <div className={styles.tableCell} data-label="ID">
                    <span className={styles.userId}>{user.id}</span>
                  </div>
                  <div className={styles.tableCell} data-label="Name">
                    <span className={styles.userName}>{user.name}</span>
                  </div>
                  <div className={styles.tableCell} data-label="Email">{user.email}</div>
                  <div className={styles.tableCell} data-label="Role">{renderRoleBadge(user.role)}</div>
                  <div className={styles.tableCell} data-label="Created At">{user.createdAt}</div>
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

          {/* --- FOOTER PAGINASI --- */}
          <div className={styles.cardFooter}>
            <span className={styles.footerInfo}>
              Showing {startItem} - {endItem} of {totalItems} results
            </span>
            <div className={styles.footerControls}>
              <select className={styles.perPageSelect} value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={5}>5 per page</option> 
                <option value={10}>10 per page</option> 
                <option value={25}>25 per page</option>
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

      {/* --- MODAL FORM --- */}
      {isFormModalOpen && (
        <UserFormModal 
          user={currentUser} 
          onClose={() => setIsFormModalOpen(false)} 
          onSave={handleSave} 
        />
      )}

      {/* --- MODAL KONFIRMASI HAPUS --- */}
      {deleteModalState.isOpen && (
        <DeleteConfirmationModal
          user={deleteModalState.user}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

// --- Komponen Modal Form ---
function UserFormModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    email: user?.email || '',
    role: user?.role || 'User' 
  });
  
  const handleChange = (e) => { 
    const { name, value } = e.target; 
    setFormData(prev => ({ ...prev, [name]: value })); 
  };
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    onSave(formData); 
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{user ? 'Edit User' : 'Create New User'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.primaryButton}>{user ? 'Save Changes' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Komponen Modal Konfirmasi Hapus ---
function DeleteConfirmationModal({ user, onClose, onConfirm }) {
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
          Are you sure you want to delete the user <strong>{user?.name}</strong>? 
          This action cannot be undone.
        </p>

        <div className={styles.modalActions}>
          <button 
            type="button" 
            className={styles.secondaryButton} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={styles.dangerButton}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}