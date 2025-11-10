// app/(dashboard)/my-project/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import styles from './MyProject.module.css';
import Topbar from '../../components/Topbar';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFileAlt, 
  FaCheckCircle, FaClock, FaLayerGroup, FaExclamationCircle,
  FaChevronLeft, FaChevronRight,
  FaSort, FaSortUp, FaSortDown
} from 'react-icons/fa';

// Data Dummy (Sama seperti sebelumnya, 11 item)
const dummyProjects = [
  { id: 1, name: "PT Green Energy Solar Farm", status: "Published", tokens: 50000, createdAt: "2025-10-28" },
  { id: 2, name: "Java Geothermal Plant", status: "In Review", tokens: 15000, createdAt: "2025-11-05" },
  { id: 3, name: "Sumatra Hydro Power", status: "Draft", tokens: 0, createdAt: "2025-11-10" },
  { id: 4, name: "Kalimantan Peatland Restoration", status: "Published", tokens: 120000, createdAt: "2025-10-15" },
  { id: 5, name: "Bali Wind Turbine Array", status: "Failed", tokens: 0, createdAt: "2025-09-30" },
  { id: 6, name: "Sulawesi Wind Farm", status: "Published", tokens: 75000, createdAt: "2025-11-12" },
  { id: 7, name: "Papua Sago Forest", status: "In Review", tokens: 20000, createdAt: "2025-11-15" },
  { id: 8, name: "Lombok Solar Initiative", status: "Draft", tokens: 0, createdAt: "2025-11-18" },
  { id: 9, name: "Borneo Mangrove Project", status: "Published", tokens: 95000, createdAt: "2025-10-20" },
  { id: 10, name: "Nusa Tenggara Wave Energy", status: "Failed", tokens: 0, createdAt: "2025-10-01" },
  { id: 11, name: "Flores Geothermal II", status: "In Review", tokens: 30000, createdAt: "2025-11-20" },
];

export default function MyProjectPage() {
  // Data untuk Topbar
  const pageTitle = "My Project";
  const pageBreadcrumbs = ["Dashboard", "My Project"];

  // State
  const [projects, setProjects] = useState(dummyProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Logika untuk widget
  const stats = useMemo(() => ({
    total: projects.length,
    published: projects.filter(p => p.status === 'Published').length,
    inReview: projects.filter(p => p.status === 'In Review').length,
  }), [projects]);

  // --- LOGIKA DATA (FILTER > SORT > PAGINATE) ---
  const searchedProjects = useMemo(() => {
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const sortedProjects = useMemo(() => {
    let sortableProjects = [...searchedProjects];
    if (sortConfig.key) {
      sortableProjects.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableProjects;
  }, [searchedProjects, sortConfig]);

  const totalItems = sortedProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedProjects.slice(start, end);
  }, [sortedProjects, currentPage, itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // Helper render status
  const renderStatusBadge = (status) => {
    const statusClasses = { "Published": styles.badgePublished, "In Review": styles.badgeInReview, "Draft": styles.badgeDraft, "Failed": styles.badgeFailed };
    const statusIcons = { "Published": <FaCheckCircle />, "In Review": <FaClock />, "Draft": <FaFileAlt />, "Failed": <FaExclamationCircle /> };
    return <span className={`${styles.badge} ${statusClasses[status] || styles.badgeDraft}`}>{statusIcons[status]} {status}</span>;
  };

  // --- Handlers ---
  const handleCreate = () => { setCurrentProject(null); setIsModalOpen(true); };
  const handleEdit = (project) => { setCurrentProject(project); setIsModalOpen(true); };
  const handleDelete = (id) => { if (confirm("...")) { setProjects(projects.filter(p => p.id !== id)); } };
  const handleSave = (formData) => {
    if (currentProject) {
      setProjects(projects.map(p => p.id === currentProject.id ? { ...p, ...formData } : p));
    } else {
      const newProject = { id: Date.now(), ...formData, tokens: 0, createdAt: new Date().toISOString().split('T')[0] };
      setProjects([newProject, ...projects]);
    }
    setIsModalOpen(false);
  };
  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) { setCurrentPage(newPage); } };
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Helper Ikon Sort
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FaSort className={styles.sortIcon} />;
    if (sortConfig.direction === 'asc') return <FaSortUp className={styles.sortIconActive} />;
    return <FaSortDown className={styles.sortIconActive} />;
  };

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <main className={styles.container}>
        
        {/* --- 1. WIDGET BANTU (JSX DIPERBARUI) --- */}
        <section className={styles.widgetsGrid}>
          
          {/* Widget 1 */}
          <div className={styles.widgetCard}>
            {/* INI PERBAIKANNYA: Ikon dibungkus div */}
            <div className={styles.widgetIconBox}>
              <FaLayerGroup className={styles.widgetIcon} />
            </div>
            <div className={styles.widgetText}>
              <span className={styles.widgetLabel}>Total Projects</span>
              <span className={styles.widgetValue}>{stats.total}</span>
            </div>
          </div>
          
          {/* Widget 2 */}
          <div className={styles.widgetCard}>
            {/* INI PERBAIKANNYA: Ikon dibungkus div */}
            <div className={styles.widgetIconBox}>
              <FaCheckCircle className={`${styles.widgetIcon} ${styles.iconPublished}`} />
            </div>
            <div className={styles.widgetText}>
              <span className={styles.widgetLabel}>Published</span>
              <span className={styles.widgetValue}>{stats.published}</span>
            </div>
          </div>

          {/* Widget 3 */}
          <div className={styles.widgetCard}>
            {/* INI PERBAIKANNYA: Ikon dibungkus div */}
            <div className={styles.widgetIconBox}>
              <FaClock className={`${styles.widgetIcon} ${styles.iconInReview}`} />
            </div>
            <div className={styles.widgetText}>
              <span className={styles.widgetLabel}>In Review</span>
              <span className={styles.widgetValue}>{stats.inReview}</span>
            </div>
          </div>
        </section>

        {/* --- 2. KARTU CRUD UTAMA --- */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Your Projects</h3>
            <button className={styles.primaryButton} onClick={handleCreate}>
              <FaPlus /> <span>Create Project</span>
            </button>
          </div>

          <div className={styles.cardToolbar}>
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Search projects..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {/* --- 3. TABLE DATA (HEADER SORTING) --- */}
          <div className={styles.tableContainer}>
            <div className={styles.table}>
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('name')}>
                    <span>Project Name</span> <SortIcon columnKey="name" />
                  </button>
                </div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('status')}>
                    <span>Status</span> <SortIcon columnKey="status" />
                  </button>
                </div>
                <div className={`${styles.tableCell} ${styles.tableCellSortable}`}>
                  <button onClick={() => handleSort('tokens')}>
                    <span>Tokens</span> <SortIcon columnKey="tokens" />
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
              {paginatedProjects.length > 0 ? paginatedProjects.map(project => (
                <div className={styles.tableRow} key={project.id}>
                  <div className={styles.tableCell}><span className={styles.projectName}>{project.name}</span></div>
                  <div className={styles.tableCell}>{renderStatusBadge(project.status)}</div>
                  <div className={styles.tableCell}>{project.tokens.toLocaleString()}</div>
                  <div className={styles.tableCell}>{project.createdAt}</div>
                  <div className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <button className={styles.iconButton} onClick={() => handleEdit(project)}><FaEdit /></button>
                    <button className={`${styles.iconButton} ${styles.iconDelete}`} onClick={() => handleDelete(project.id)}><FaTrash /></button>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>
                  <p>No projects found matching "{searchTerm}".</p>
                </div>
              )}
            </div>
          </div>

          {/* --- 4. FOOTER PAGINASI --- */}
          <div className={styles.cardFooter}>
            <span className={styles.footerInfo}>
              Menampilkan {startItem} - {endItem} dari {totalItems} data
            </span>
            <div className={styles.footerControls}>
              <select className={styles.perPageSelect} value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={5}>5</option> <option value={10}>10</option> <option value={25}>25</option>
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

      {/* --- 5. MODAL FORM --- */}
      {isModalOpen && (
        <ProjectFormModal 
          project={currentProject} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

// --- Komponen Modal Form (tidak berubah) ---
function ProjectFormModal({ project, onClose, onSave }) {
  const [formData, setFormData] = useState({ name: project?.name || '', status: project?.status || 'Draft' });
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{project ? 'Edit Project' : 'Create New Project'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}><label htmlFor="name">Project Name</label><input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required /></div>
          <div className={styles.formGroup}><label htmlFor="status">Status</label><select id="status" name="status" value={formData.status} onChange={handleChange}><option value="Draft">Draft</option><option value="In Review">In Review</option><option value="Published">Published</option><option value="Failed">Failed</option></select></div>
          <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button><button type="submit" className={styles.primaryButton}>{project ? 'Save Changes' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}