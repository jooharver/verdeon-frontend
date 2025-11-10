'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link'; // <-- 1. TAMBAHKAN IMPORT INI
import styles from './CarbonMarket.module.css';
import Topbar from '../../components/Topbar';
import { 
  FaSearch, FaChevronLeft, FaChevronRight, 
  FaFilter, FaTimes, FaMapMarkerAlt, FaSyncAlt
} from 'react-icons/fa';

// --- Data Dummy (Tidak Berubah) ---
const dummyTokens = [
  { id: 1, name: "Solar Panel Green Renewable Energy PT.GNE", location: "Malang", price: 3.50, available: 15720, type: "Solar", verifier: "Verra", imageUrl: "/images/pv-1.jpg" },
  { id: 2, name: "Mentari Jaya Abadi Solar Panel Indonesia", location: "Banyuwangi", price: 2.50, available: 15720, type: "Solar", verifier: "Gold Standard", imageUrl: "/images/pv-2.jpg" },
  { id: 3, name: "Goldi Solar Panel Jaya Hijau Asri", location: "Kalimantan Tengah", price: 2.70, available: 15720, type: "Solar", verifier: "Verra", imageUrl: "/images/pv-3.jpg" },
  { id: 4, name: "Surya Pama Jagat Sentosa Raya PV", location: "Bekasi", price: 3.10, available: 15720, type: "Solar", verifier: "Gold Standard", imageUrl: "/images/pv-4.jpg" },
  { id: 5, name: "Takamura Proyek Solar Panel", location: "Ponorogo", price: 3.60, available: 15720, type: "Solar", verifier: "Verra", imageUrl: "/images/pv-5.jpg" },
  { id: 6, name: "Relion Daya Abadi Nusantara", location: "Sulawesi Tenggara", price: 3.80, available: 15720, type: "Solar", verifier: "Gold Standard", imageUrl: "/images/pv-6.jpg" },
  { id: 7, name: "PT Makmur Hijau Sentosa Solar Panel", location: "Kabupaten Riau", price: 3.00, available: 15720, type: "Solar", verifier: "Verra", imageUrl: "/images/pv-7.jpg" },
  { id: 8, name: "PV Indonesia Bebas Karbon", location: "Lampung Utara", price: 2.35, available: 15720, type: "Solar", verifier: "Gold Standard", imageUrl: "/images/pv-8.jpg" },
  { id: 9, name: "Kalimantan Peatland Restoration", location: "Kalimantan", price: 18.50, available: 1200, type: "Reforestation", verifier: "Verra", imageUrl: "/images/pv-1.jpg" },
  { id: 10, name: "Java Geothermal Plant", location: "Jawa Barat", price: 22.00, available: 5000, type: "Geothermal", verifier: "Gold Standard", imageUrl: "/images/pv-2.jpg" },
  { id: 11, name: "Bali Wind Turbine Array", location: "Bali", price: 19.75, available: 3500, type: "Wind", verifier: "Verra", imageUrl: "/images/pv-5.jpg" },
];

// Opsi filter (Tidak Berubah)
const LOCATIONS = ["Malang", "Banyuwangi", "Kalimantan Tengah", "Bekasi", "Ponorogo", "Sulawesi Tenggara", "Kabupaten Riau", "Lampung Utara", "Kalimantan", "Jawa Barat", "Bali"];
const TYPES = ["Solar", "Reforestation", "Geothermal", "Wind"];
const VERIFIERS = ["Verra", "Gold Standard"];

const ITEMS_PER_PAGE = 8;

export default function CarbonMarketPage() {
  // Data untuk Topbar (Tidak Berubah)
  const pageTitle = "Carbon Market";
  const pageBreadcrumbs = ["Dashboard", "Carbon Market"];

  // --- States (Tidak Berubah) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const initialFilters = {
    location: [],
    type: [],
    verifier: [],
    priceMin: '',
    priceMax: '',
    tokenMin: '',
    tokenMax: '',
  };
  const [filters, setFilters] = useState(initialFilters);

  // --- Handlers (Tidak Berubah) ---

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFilters(prev => {
        const list = prev[name] ? [...prev[name]] : [];
        if (checked) {
          list.push(value);
        } else {
          const index = list.indexOf(value);
          if (index > -1) list.splice(index, 1);
        }
        return { ...prev, [name]: list };
      });
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchTerm('');
    setSortOrder('newest');
    setCurrentPage(1);
  };

  // --- Logika Filtering, Sorting, Pagination (Tidak Berubah) ---

  const processedTokens = useMemo(() => {
    let filteredTokens = [...dummyTokens];

    // 1. Filtering
    filteredTokens = filteredTokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = filters.location.length === 0 || filters.location.includes(token.location);
      const matchesType = filters.type.length === 0 || filters.type.includes(token.type);
      const matchesVerifier = filters.verifier.length === 0 || filters.verifier.includes(token.verifier);

      const priceMin = parseFloat(filters.priceMin);
      const priceMax = parseFloat(filters.priceMax);
      const matchesPriceMin = !priceMin || token.price >= priceMin;
      const matchesPriceMax = !priceMax || token.price <= priceMax;

      const tokenMin = parseFloat(filters.tokenMin);
      const tokenMax = parseFloat(filters.tokenMax);
      const matchesTokenMin = !tokenMin || token.available >= tokenMin;
      const matchesTokenMax = !tokenMax || token.available <= tokenMax;

      return matchesSearch && matchesLocation && matchesType && matchesVerifier && 
             matchesPriceMin && matchesPriceMax && matchesTokenMin && matchesTokenMax;
    });

    // 2. Sorting
    filteredTokens.sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'newest':
        default:
          return b.id - a.id;
      }
    });

    return filteredTokens;
  }, [searchTerm, filters, sortOrder]);

  // 3. Pagination
  const totalItems = processedTokens.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return processedTokens.slice(start, end);
  }, [processedTokens, currentPage]);

  // --- Komponen Internal (Tidak Berubah) ---
  const FilterSidebar = () => (
    <aside className={`${styles.filterSidebar} ${isFilterOpen ? styles.filterSidebarOpen : ''}`}>
      <div className={styles.filterHeader}>
        <h4><FaFilter /> Filter</h4>
        <button className={styles.filterCloseButton} onClick={() => setIsFilterOpen(false)}><FaTimes /></button>
      </div>

      <div className={styles.filterBody}>
        {/* Filter Group: Lokasi */}
        <div className={styles.filterGroup}>
          <h5 className={styles.filterTitle}>Lokasi</h5>
          {LOCATIONS.slice(0, 5).map(loc => (
            <div className={styles.filterOption} key={loc}>
              <input type="checkbox" id={`loc-${loc}`} name="location" value={loc} onChange={handleFilterChange} checked={filters.location.includes(loc)} />
              <label htmlFor={`loc-${loc}`}>{loc}</label>
            </div>
          ))}
        </div>

        {/* Filter Group: Tipe Proyek */}
        <div className={styles.filterGroup}>
          <h5 className={styles.filterTitle}>Tipe Proyek</h5>
          {TYPES.map(type => (
            <div className={styles.filterOption} key={type}>
              <input type="checkbox" id={`type-${type}`} name="type" value={type} onChange={handleFilterChange} checked={filters.type.includes(type)} />
              <label htmlFor={`type-${type}`}>{type}</label>
            </div>
          ))}
        </div>

        {/* Filter Group: Verifier */}
        <div className={styles.filterGroup}>
          <h5 className={styles.filterTitle}>Verifier</h5>
          {VERIFIERS.map(v => (
            <div className={styles.filterOption} key={v}>
              <input type="checkbox" id={`v-${v}`} name="verifier" value={v} onChange={handleFilterChange} checked={filters.verifier.includes(v)} />
              <label htmlFor={`v-${v}`}>{v}</label>
            </div>
          ))}
        </div>

        {/* Filter Group: Rentang Harga */}
        <div className={styles.filterGroup}>
          <h5 className={styles.filterTitle}>Rentang Harga (USD)</h5>
          <div className={styles.rangeInputs}>
            <input type="number" name="priceMin" placeholder="Minimum" value={filters.priceMin} onChange={handleFilterChange} className={styles.rangeInput} />
            <input type="number" name="priceMax" placeholder="Maksimum" value={filters.priceMax} onChange={handleFilterChange} className={styles.rangeInput} />
          </div>
        </div>

        {/* Filter Group: Rentang Token */}
        <div className={styles.filterGroup}>
          <h5 className={styles.filterTitle}>Rentang Token Tersedia</h5>
          <div className={styles.rangeInputs}>
            <input type="number" name="tokenMin" placeholder="Minimum" value={filters.tokenMin} onChange={handleFilterChange} className={styles.rangeInput} />
            <input type="number" name="tokenMax" placeholder="Maksimum" value={filters.tokenMax} onChange={handleFilterChange} className={styles.rangeInput} />
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className={styles.filterFooter}>
        <button className={styles.resetButton} onClick={resetFilters}>
          <FaSyncAlt /> Hapus Filter
        </button>
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

          {/* Toolbar: Search, Sort */}
          <section className={styles.toolbar}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search for carbon token" 
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className={styles.controlsContainer}>
              {/* Tombol filter untuk mobile */}
              <button className={styles.filterToggleButton} onClick={() => setIsFilterOpen(true)}>
                <FaFilter /> Filter
              </button>
              
              <select 
                className={styles.sortSelect} 
                value={sortOrder} 
                onChange={handleSortChange}
              >
                <option value="newest">Urutkan: Terbaru</option>
                <option value="price-asc">Urutkan: Harga (Rendah ke Tinggi)</option>
                <option value="price-desc">Urutkan: Harga (Tinggi ke Rendah)</option>
                <option value="name-asc">Urutkan: Nama (A-Z)</option>
                <option value="name-desc">Urutkan: Nama (Z-A)</option>
              </select>
            </div>
          </section>

          {/* Result Bar */}
          <section className={styles.resultBar}>
            <div className={styles.resultInfo}>
              <span>Menampilkan {paginatedTokens.length} dari {totalItems} hasil</span>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.paginationButton} 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft />
                </button>
                
                <span className={styles.pageInfo}>
                  {currentPage} / {totalPages}
                </span>

                <button 
                  className={styles.paginationButton} 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </section>


          {/* Grid Produk */}
          <section className={styles.productGrid}>
            {paginatedTokens.length > 0 ? (
              paginatedTokens.map(token => (
                
                // --- 👇 2. INI PERUBAHANNYA ---
                <Link 
                  href={`/carbon-market/${token.id}`} // <- Mengarahkan ke detail
                  key={token.id} // <- Key dipindah ke Link
                  className={styles.productLink} // <- Class untuk styling
                >
                  <div className={styles.productCard}> {/* <- Key dihapus dari sini */}
                    <img 
                      src={token.imageUrl} 
                      alt={token.name} 
                      className={styles.productImage} 
                      onError={(e) => e.target.src = 'https://placehold.co/600x400/cccccc/white?text=Image+Error'}
                    />
                    <div className={styles.productContent}>
                      <h4 className={styles.productTitle}>{token.name}</h4>
                      
                      <span className={styles.productPrice}>
                        USD ${token.price.toFixed(2)}
                      </span>
                      
                      <span className={styles.productTag}>
                        {token.available.toLocaleString()} token available
                      </span>
                      
                      <div className={styles.productLocation}>
                        <FaMapMarkerAlt />
                        <span>{token.location}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                // --- 👆 AKHIR PERUBAHAN ---

              ))
            ) : (
              <div className={styles.emptyState}>
                <h5>Hasil Tidak Ditemukan</h5>
                <p>Coba sesuaikan pencarian atau filter Anda.</p>
              </div>
            )}
          </section>
          
        </main>
      </div>
    </div>
  );
}