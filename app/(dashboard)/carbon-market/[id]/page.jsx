'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import styles from './Detail.module.css';
import { 
  FaCheckCircle, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, 
  FaPlus, FaMinus, FaExternalLinkAlt, FaFileAlt, FaInfoCircle, FaBuilding
} from 'react-icons/fa';

// --- TAMBAHAN: Import Topbar ---
// Sesuaikan path ini jika beda. Asumsinya dari app/(dashboard)/detail/[id]/
import Topbar from '../../../components/Topbar'; 

// --- DATA DUMMY UNTUK ID: 1 ---
const getProjectById = (id) => {
  if (id === '1') {
    return {
      id: 1,
      name: "Solar Panel Green Renewable Energy PT.GNE",
      breadcrumb: "Solar Panel Green Renewable Energy PT.GNE", // Kita akan gunakan name
      asset: "PT_GNE_2025",
      vintage: 2025,
      price: 3.50,
      tokenSold: 889.80,
      totalToken: 1000, 
      availableToken: 110.20,
      conversion: "1 Token = 1 tonnes CO2e",
      issuer: {
        name: "PT Green Renewable Energy",
        logo: '/images/project-logo-3.png', 
        verified: true,
        website: "https://example.com"
      },
      mainImage: "/placeholder/solar-panel-large.jpg", 
      gallery: [
        { type: 'image', url: '/images/pv-8.jpg' },
        { type: 'map', url: '/images/map.jpg', label: 'Lokasi Proyek' },
        { type: 'image', url: '/images/pv-3.jpg' },
        { type: 'image', url: '/images/pv-4.jpg' },
        { type: 'image', url: '/images/pv-2.jpg' },
      ],
      assessment: {
        auditor: "EDGE Green Building Certification",
        auditorLogo: "/images/edges.png", // <-- PERUBAHAN: Logo auditor
        standard: "ISO 14064-2",
        verification: "Accredia",
      },
      specs: {
        kapasitas: "3000 kWp",
        jumlahUnit: 30,
        jenisModul: "Monocrystalline",
        luasArea: "60 m²",
        estimasi: "157.480 MWh/year",
        totalOffset: "149.480 tCO2e/year",
      },
      sdgs: [ // Path gambar ini dari kode yang kamu paste
        { id: 7, title: "Energi Bersih", img: "/images/sdgs-1.png" },
        { id: 9, title: "Inovasi & Infrastruktur", img: "/images/sdgs-2.png" },
        { id: 11, title: "Kota Berkelanjutan", img: "/images/sdgs-3.png" },
      ],
      tabs: {
        deskripsi: {
          tentang: "Proyek Solar Panel Green Renewable Energy PT. GNE merupakan proyek energi terbarukan di Malang, Jawa Timur dengan kapasitas 3000 kWp dari 30 unit modul monocrystalline. Proyek ini berkontribusi terhadap pengurangan emisi sekitar 149.480 tCO2 per tahun serta mendukung target Net Zero Emission 2060.",
          manfaat: [
            "Menggantikan listrik berbasis batubara dengan energi surya.",
            "Menghasilkan token karbon digital (1 token = 1 ton CO2e) yang dapat digunakan untuk offset emisi.",
            "Memberdayakan masyarakat sekitar melalui pelatihan dan pengelolaan sistem PLTS.",
          ],
          dampak: "Mendukung SDG 7 (Energi Bersih), SDG 9 (Inovasi & Infrastruktur), SDG 11 (Kota & Komunitas), dan SDG 12 (Konsumsi & Produksi). Setiap pembelian token berarti kontribusi nyata terhadap pengurangan emisi karbon dan peningkatan energi terbarukan di Indonesia.",
          verifikasi: "Proyek diverifikasi oleh EDGE Green Building Certification sesuai standar ISO 14064-2 dan diakreditasi oleh Accredia. Laporan pemantauan dan verifikasi emisi diperbarui secara berkala dan dapat diakses melalui tab dokumen.",
        },
        detail: [
          { label: "Lokasi", value: "Malang, Jawa Timur, Indonesia" },
          { label: "Tipe Proyek", value: "Energi Terbarukan (Solar)" },
          { label: "Metodologi", value: "AMS-I.D. (Grid-connected renewable electricity generation)" },
          { label: "Auditor", value: "EDGE Green Building Certification" },
          { label: "StandAR", value: "ISO 14064-2" },
        ],
        dokumen: [
          { name: "Laporan Verifikasi Proyek.pdf", type: "pdf", size: "2.4 MB" },
          { name: "Sertifikat ISO 14064-2.pdf", type: "pdf", size: "1.1 MB" },
          { name: "Project Design Document (PDD).pdf", type: "pdf", size: "5.8 MB" },
        ]
      }
    };
  }
  return null; 
};

export default function ProjectDetail() { 
  const params = useParams(); 
  
  const [activeTab, setActiveTab] = useState('deskripsi');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const project = getProjectById(params.id); 

  if (!project) {
    return <div>Memuat data proyek...</div>;
  }
  
  // --- TAMBAHAN: Data untuk Topbar ---
  const pageTitle = "Carbon Market Detail";
  const pageBreadcrumbs = ["Detail", "Solar Panel PT GNE"];

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (newQuantity > project.availableToken) return Math.floor(project.availableToken);
      return newQuantity;
    });
  };

  const handleGalleryNav = (direction) => {
    setCurrentImageIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? project.gallery.length - 1 : prev - 1;
      } else {
        return prev === project.gallery.length - 1 ? 0 : prev + 1;
      }
    });
  };

  const soldPercentage = (project.tokenSold / project.totalToken) * 100;

  return (
    // --- TAMBAHAN: Wrapper <main> ---
    <main>
      {/* --- TAMBAHAN: Komponen Topbar --- */}
      <Topbar title={pageTitle} breadcrumbs={pageBreadcrumbs} />

      <div className={styles.detailPage}>
        {/* Kolom Kiri - Konten Utama */}
        <div className={styles.mainContent}>
          
          {/* --- DIHAPUS: Breadcrumb manual diganti Topbar ---
          <div className={styles.breadcrumb}>
            Carbon Market / <strong>{project.breadcrumb}</strong>
          </div>
          */}

          <div className={styles.galleryContainer}>
            <button 
              className={`${styles.galleryNav} ${styles.prev}`}
              onClick={() => handleGalleryNav('prev')}
            >
              <FaChevronLeft />
            </button>
            <div className={styles.galleryMainImage}>
              {project.gallery[currentImageIndex].type === 'map' ? (
                <div className={styles.mapPlaceholder}>
                  <Image 
                    src={project.gallery[currentImageIndex].url} 
                    alt="Lokasi Proyek" 
                    layout="fill" 
                    objectFit="cover" 
                  />
                  <div className={styles.mapLabel}>
                    <FaMapMarkerAlt /> {project.gallery[currentImageIndex].label}
                  </div>
                </div>
              ) : (
                <Image 
                  src={project.gallery[currentImageIndex].url} 
                  alt={project.name} 
                  layout="fill" 
                  objectFit="cover" 
                />
              )}
            </div>
            <button 
              className={`${styles.galleryNav} ${styles.next}`}
              onClick={() => handleGalleryNav('next')}
            >
              <FaChevronRight />
            </button>
          </div>

          <div className={styles.thumbnailContainer}>
            {project.gallery.map((item, index) => (
              <div 
                key={index} 
                className={`${styles.thumbnail} ${index === currentImageIndex ? styles.activeThumbnail : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <Image 
                  src={item.url} 
                  alt={item.label || `Gallery image ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
                {item.type === 'map' && <FaMapMarkerAlt className={styles.mapIcon} />}
              </div>
            ))}
          </div>

          <div className={styles.tabContainer}>
            <button 
              className={activeTab === 'deskripsi' ? styles.activeTab : ''}
              onClick={() => setActiveTab('deskripsi')}
            >
              Deskripsi
            </button>
            <button 
              className={activeTab === 'detail' ? styles.activeTab : ''}
              onClick={() => setActiveTab('detail')}
            >
              Detail
            </button>
            <button 
              className={activeTab === 'dokumen' ? styles.activeTab : ''}
              onClick={() => setActiveTab('dokumen')}
            >
              Dokumen
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'deskripsi' && (
              <div>
                <h3>Tentang Proyek</h3>
                <p>{project.tabs.deskripsi.tentang}</p>
                
                <h3>Tujuan dan Manfaat</h3>
                <ul>
                  {project.tabs.deskripsi.manfaat.map((item, i) => <li key={i}>{item}</li>)}
                </ul>

                <h3>Dampak Keberlanjutan</h3>
                <p>{project.tabs.deskripsi.dampak}</p>

                <h3>Verifikasi dan Transparansi</h3>
                <p>{project.tabs.deskripsi.verifikasi}</p>
              </div>
            )}

            {activeTab === 'detail' && (
              <div className={styles.detailGrid}>
                {project.tabs.detail.map((item, i) => (
                  <div key={i} className={styles.detailItem}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'dokumen' && (
              <ul className={styles.documentList}>
                {project.tabs.dokumen.map((doc, i) => (
                  <li key={i}>
                    <FaFileAlt />
                    <div className={styles.docInfo}>
                      <strong>{doc.name}</strong>
                      <span>{doc.type} - {doc.size}</span>
                    </div>
                    <a href="#" className={styles.downloadButton}>Download</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Kolom Kanan - Sidebar Pembelian (Sticky) */}
        <div className={styles.sidebar}>
          <div className={styles.buyCard}>
            <h2>{project.name}</h2>
            <div className={styles.verifiedBadge}>
              <FaCheckCircle /> Verified seller listing
            </div>

            <div className={styles.priceInfo}>
              <div className={styles.price}>
                <span>Price</span>
                <strong>USD ${project.price.toFixed(2)}/Token</strong>
              </div>
              <div className={styles.infoGrid}>
                <div>
                  <span>Available Token</span>
                  <strong>{project.availableToken.toLocaleString('en-US')}</strong>
                </div>
                <div>
                  <span>Asset</span>
                  <strong>{project.asset}</strong>
                </div>
                <div>
                  <span>Vintage</span>
                  <strong>{project.vintage}</strong>
                </div>
              </div>
              <div className={styles.conversionInfo}>
                <FaInfoCircle /> {project.conversion}
              </div>
            </div>

            <div className={styles.quantitySelector}>
              <span>Quantity</span>
              <div className={styles.quantityControls}>
                <button onClick={() => handleQuantityChange(-1)}><FaMinus /></button>
                <input type="number" value={quantity} readOnly />
                <button onClick={() => handleQuantityChange(1)}><FaPlus /></button>
              </div>
            </div>
            
            <button className={styles.buyButton}>
              Buy
            </button>
            
            <div className={styles.totalPrice}>
              Total <span>USD ${(quantity * project.price).toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Issuer</h3>
            <div className={styles.issuerInfo}>
              <div className={styles.issuerLogo}>
                {project.issuer.logo ? (
                  <Image src={project.issuer.logo} alt={project.issuer.name} width={40} height={40} />
                ) : (
                  <FaBuilding />
                )}
              </div>
              <div className={styles.issuerName}>
                <strong>{project.issuer.name}</strong>
                {project.issuer.verified && <span><FaCheckCircle /> Verified</span>}
              </div>
              <a href={project.issuer.website} target="_blank" rel="noopener noreferrer" className={styles.visitButton}>
                Visit <FaExternalLinkAlt />
              </a>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Project Assessment</h3>
            
            {/* --- PERUBAHAN: JSX untuk Logo Auditor --- */}
            <div className={styles.assessmentItem}>
              <span>Auditor</span>
              <div className={styles.auditorInfo}>
                <Image
                  src={project.assessment.auditorLogo}
                  alt={project.assessment.auditor}
                  width={40}
                  height={40}
                  className={styles.auditorLogo}
                />
                <strong>{project.assessment.auditor}</strong>
              </div>
            </div>
            {/* --- AKHIR PERUBAHAN --- */}

            <div className={styles.assessmentItem}>
              <span>Standar</span>
              <strong>{project.assessment.standard}</strong>
            </div>
            <div className={styles.assessmentItem}>
              <span>Verification</span>
              <strong>{project.assessment.verification}</strong>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Project Specification</h3>
            <div className={styles.specGrid}>
              <div><span>Kapasitas</span><strong>{project.specs.kapasitas}</strong></div>
              <div><span>Jumlah Unit</span><strong>{project.specs.jumlahUnit}</strong></div>
              <div><span>Jenis Modul</span><strong>{project.specs.jenisModul}</strong></div>
              <div><span>Luas Area</span><strong>{project.specs.luasArea}</strong></div>
              <div><span>Estimasi</span><strong>{project.specs.estimasi}</strong></div>
              <div><span>Total Offset</span><strong>{project.specs.totalOffset}</strong></div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Stats</h3>
            <div className={styles.statsBar}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${soldPercentage}%` }}></div>
              </div>
              <div className={styles.statsLabel}>
                <span>Token Available</span>
                <span>Token Sold</span>
              </div>
              <div className={styles.statsValue}>
                <strong>{project.availableToken.toLocaleString('en-US')}</strong>
                <strong>{project.tokenSold.toLocaleString('en-US')}</strong>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Sustainable Development Goals</h3>
            <div className={styles.sdgBox}>
              
              {/* --- PERBAIKAN: Menggunakan sdg.img & Komponen Image --- */}
              {project.sdgs.map(sdg => (
                <Image 
                  key={sdg.id} 
                  src={sdg.img} // <-- Menggunakan path dari data
                  alt={sdg.title} 
                  title={sdg.title} 
                  width={60} // <-- Wajib untuk Next.js Image
                  height={60} // <-- Wajib untuk Next.js Image
                  className={styles.sdgIcon}
                />
              ))}
              {/* --- AKHIR PERBAIKAN --- */}

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}