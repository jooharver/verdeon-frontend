'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import styles from './CarbonMarket.module.css';
import Topbar from '../../components/Topbar';
import { 
  FaSearch, FaChevronLeft, FaChevronRight, 
  FaFilter, FaTimes, FaMapMarkerAlt, FaSyncAlt, FaSpinner
} from 'react-icons/fa';

// 👉 IMPORT SERVICE API
import { projectService } from '../../../services/projectService'; 
import { api } from '../../../services/api';

const ITEMS_PER_PAGE = 8;
const DEFAULT_PRICE = 15.00; // Harga statis dummy per token (karena tidak ada fitur pricing engine)

// 👉 FIX: Daftar Provinsi Statis agar filter tidak pernah hilang walau data kosong
const STATIC_LOCATIONS = [
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur", 
  "Bali", "Banten", "Sumatera Utara", "Kalimantan Timur", "Sulawesi Selatan"
];
const TYPES = ["Solar", "Wind", "Geothermal", "Biomass"]; 

export default function CarbonMarketPage() {
  const pageTitle = "Carbon Market";
  const pageBreadcrumbs = ["Dashboard", "Carbon Market"];

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const initialFilters = { location: [], type: [] };
  const [filters, setFilters] = useState(initialFilters);

  // 👉 FETCH REAL DATA DARI DATABASE
  useEffect(() => {
      const fetchMarketProjects = async () => {
        try {
          // 👉 Gunakan service khusus market yang baru
          const data = await projectService.getMarketProjects(); 
          
          // Data sudah difilter di backend (hanya listed), 
          // jadi kita bisa langsung set ke state.
          setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Gagal memuat pasar karbon:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMarketProjects();
  }, []);

  // Gabungkan Provinsi dari Database + Provinsi Statis
  const LOCATIONS = useMemo(() => {
    const dynamicLocs = projects.map(p => p.active_version?.provinsi?.nama).filter(Boolean);
    return [...new Set([...STATIC_LOCATIONS, ...dynamicLocs])].sort();
  }, [projects]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFilters(prev => {
        const list = prev[name] ? [...prev[name]] : [];
        if (checked) list.push(value);
        else list.splice(list.indexOf(value), 1);
        return { ...prev, [name]: list };
      });
    }
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchTerm('');
    setSortOrder('newest');
    setCurrentPage(1);
  };

  // LOGIKA PENCARIAN & FILTERING
  const processedProjects = useMemo(() => {
    let result = [...projects];

    result = result.filter(p => {
      const v = p.active_version;
      const name = v?.name || '';
      const location = v?.provinsi?.nama || 'Unknown';
      const type = v?.project_type || 'Solar';

      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = filters.location.length === 0 || filters.location.includes(location);
      const matchesType = filters.type.length === 0 || filters.type.includes(type);

      return matchesSearch && matchesLocation && matchesType;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      const nameA = a.active_version?.name || '';
      const nameB = b.active_version?.name || '';

      switch (sortOrder) {
        case 'name-asc': return nameA.localeCompare(nameB);
        case 'name-desc': return nameB.localeCompare(nameA);
        case 'newest': default: return dateB - dateA;
      }
    });

    return result;
  }, [projects, searchTerm, filters, sortOrder]);

  const totalItems = processedProjects.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [processedProjects, currentPage]);

  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    let cleanPath = filePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', '');
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return `${apiBaseUrl.replace(/\/api\/?$/, '')}/storage/${cleanPath}`;
  };

  const FilterSidebar = () => (
    <aside className={`${styles.filterSidebar} ${isFilterOpen ? styles.filterSidebarOpen : ''}`}>
      <div className={styles.filterHeader}>
        <h4><FaFilter /> Filter</h4>
        <button className={styles.filterCloseButton} onClick={() => setIsFilterOpen(false)}><FaTimes /></button>
      </div>
      <div className={styles.filterBody}>
        <div className={styles.filterGroup}>
          <h5 className={styles.filterTitle}>Provinsi</h5>
          {LOCATIONS.map(loc => (
            <div className={styles.filterOption} key={loc}>
              <input type="checkbox" id={`loc-${loc}`} name="location" value={loc} onChange={handleFilterChange} checked={filters.location.includes(loc)} />
              <label htmlFor={`loc-${loc}`}>{loc}</label>
            </div>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <h5 className={styles.filterTitle}>Tipe Proyek</h5>
          {TYPES.map(type => (
            <div className={styles.filterOption} key={type}>
              <input type="checkbox" id={`type-${type}`} name="type" value={type} onChange={handleFilterChange} checked={filters.type.includes(type)} />
              <label htmlFor={`type-${type}`}>{type}</label>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.filterFooter}>
        <button className={styles.resetButton} onClick={resetFilters}><FaSyncAlt /> Hapus Filter</button>
      </div>
    </aside>
  );

  return (
    <div>
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />
      <div className={styles.pageContainer}>
        {isFilterOpen && <div className={styles.filterOverlay} onClick={() => setIsFilterOpen(false)}></div>}
        <FilterSidebar />

        <main className={styles.mainContent}>
          <section className={styles.toolbar}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Search for carbon token" className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className={styles.controlsContainer}>
              <button className={styles.filterToggleButton} onClick={() => setIsFilterOpen(true)}><FaFilter /> Filter</button>
              <select className={styles.sortSelect} value={sortOrder} onChange={handleSortChange}>
                <option value="newest">Urutkan: Terbaru</option>
                <option value="name-asc">Urutkan: Nama (A-Z)</option>
                <option value="name-desc">Urutkan: Nama (Z-A)</option>
              </select>
            </div>
          </section>

          {isLoading ? (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', color: '#0ea5e9' }}>
               <FaSpinner className="fa-spin" size={40} />
             </div>
          ) : (
            <>
              <section className={styles.resultBar}>
                <div className={styles.resultInfo}>
                  <span>Menampilkan {paginatedProjects.length} dari {totalItems} hasil</span>
                </div>
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button className={styles.paginationButton} onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}><FaChevronLeft /></button>
                    <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
                    <button className={styles.paginationButton} onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}><FaChevronRight /></button>
                  </div>
                )}
              </section>

              <section className={styles.productGrid}>
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map(project => {
                    const version = project.active_version;
                    
                    // Ambil gambar utama dari database
                    const mainImgDoc = version?.documents?.find(d => d.type === 'image');
                    const imgUrl = mainImgDoc ? getFullUrl(mainImgDoc.file_path) : 'https://placehold.co/600x400/cccccc/white?text=No+Image';
                    
                    // Ambil jumlah token yang di-generate oleh Auditor
                    const tokenAvailable = version?.audit_report?.carbon_reduction_amount_ton || 0;

                    return (
                      // 👉 FIX: Link kembali menggunakan ID asli dari database
                      <Link href={`/carbon-market/${project.id}`} key={project.id} className={styles.productLink}>
                        <div className={styles.productCard}>
                          <img src={imgUrl} alt={version.name} className={styles.productImage} onError={(e) => e.target.src = 'https://placehold.co/600x400/cccccc/white?text=Image+Error'} />
                          <div className={styles.productContent}>
                            <h4 className={styles.productTitle}>{version.name}</h4>
                            <span className={styles.productPrice}>USD ${DEFAULT_PRICE.toFixed(2)}</span>
                            
                            <span className={styles.productTag}>
                              {Number(tokenAvailable).toLocaleString('id-ID')} VCT Available
                            </span>
                            
                            <div className={styles.productLocation}>
                              <FaMapMarkerAlt /> 
                              <span>{version.kota?.nama || 'Unknown'}, {version.provinsi?.nama || ''}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className={styles.emptyState}>
                    <h5>Belum ada proyek yang dilisting</h5>
                    <p>Silakan selesaikan proses audit dan listing proyek Anda di halaman Dashboard.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}