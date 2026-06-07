'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import styles from './Detail.module.css';
import { 
  FaCheckCircle, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, 
  FaPlus, FaMinus, FaExternalLinkAlt, FaFileAlt, FaInfoCircle, FaBuilding,
  FaSpinner, FaShieldAlt, FaSearch
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import Topbar from '../../../components/Topbar'; 
import { api } from '../../../../services/api';
import { getProjectContract } from '../../../utils/web3Config';
import { ethers } from 'ethers';

// 👉 Harga di-set $10 sesuai request
const DEFAULT_PRICE = 10.00;

export default function ProjectDetail() { 
  const params = useParams(); 
  
  const [activeTab, setActiveTab] = useState('deskripsi');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // States untuk data real
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockchainHistory, setBlockchainHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 1. FETCH DATA SPESIFIK BERDASARKAN ID
  useEffect(() => {
    const fetchProjectDetail = async () => {
      try {
        const res = await api(`/projects/${params.id}`);
        setProject(res.project);
        
        // Panggil history blockchain jika sudah punya tx_hash
        if (res.project?.tx_hash) {
          fetchBlockchainHistory(res.project.id);
        }
      } catch (error) {
        console.error("Gagal memuat detail proyek:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchProjectDetail();
  }, [params.id]);

  // 2. FETCH AUDIT TRAIL DARI POLYGON
  const fetchBlockchainHistory = async (projectId) => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    setIsLoadingHistory(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = getProjectContract(provider);
      const history = await contract.getProjectHistory(projectId);
      setBlockchainHistory(history);
    } catch (error) {
      console.error("Gagal menarik data dari Blockchain:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getFullUrl = (filePath) => {
    if (!filePath) return '';
    let cleanPath = filePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', '');
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return `${apiBaseUrl.replace(/\/api\/?$/, '')}/storage/${cleanPath}`;
  };

  const formatBlockchainTime = (epochTimestamp) => {
    const date = new Date(Number(epochTimestamp) * 1000);
    return date.toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
  };

  // Loading State
  if (isLoading) {
    return (
      <main>
        <Topbar title="Loading Market..." breadcrumbs={["Market", "Detail"]} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#0ea5e9' }}>
          <FaSpinner className="fa-spin" size={40} />
        </div>
      </main>
    );
  }

  // Not Found State
  if (!project) {
    return (
      <main>
        <Topbar title="Not Found" breadcrumbs={["Market", "Error"]} />
        <div style={{ padding: '40px', textAlign: 'center' }}>Proyek tidak ditemukan.</div>
      </main>
    );
  }

  // 3. MAP DATA DATABASE KE VARIABEL UI
  const version = project.active_version;
  const audit = version.audit_report || {};
  
  // Mencegah duplikasi gambar dan menghitung jumlah gambar riil
  const rawImages = version.documents?.filter(d => d.type === 'image') || [];
  const uniqueImages = [];
  const seenPaths = new Set();

  rawImages.forEach(img => {
    if (!seenPaths.has(img.file_path)) {
      seenPaths.add(img.file_path);
      uniqueImages.push({ type: 'image', url: getFullUrl(img.file_path) });
    }
  });

  const gallery = uniqueImages.length > 0 
    ? uniqueImages 
    : [{ type: 'image', url: 'https://placehold.co/800x500/cccccc/white?text=No+Image' }];
  
  // Setup Dokumen Publik
  const publicDocs = version.documents?.filter(d => d.type === 'document') || [];

  // Kalkulasi Token & Hiasan Stats
  const totalToken = parseFloat(audit.carbon_reduction_amount_ton) || 0;
  const tokenSold = 0; 
  const availableToken = totalToken - tokenSold;
  const availablePercentage = totalToken > 0 ? (availableToken / totalToken) * 100 : 0;

  // Hiasan SDGs
  const sdgs = [ 
    { id: 7, title: "Energi Bersih", img: "/images/sdgs-1.png" },
    { id: 9, title: "Inovasi & Infrastruktur", img: "/images/sdgs-2.png" },
    { id: 11, title: "Kota Berkelanjutan", img: "/images/sdgs-3.png" },
  ];

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
      const newQty = prev + amount;
      if (newQty < 1) return 1;
      if (newQty > availableToken) return Math.floor(availableToken);
      return newQty;
    });
  };

  const handleGalleryNav = (direction) => {
    setCurrentImageIndex(prev => {
      if (direction === 'prev') return prev === 0 ? gallery.length - 1 : prev - 1;
      return prev === gallery.length - 1 ? 0 : prev + 1;
    });
  };

  const handleDummyBuy = () => {
    Swal.fire({
      title: 'Pembelian Simulasi',
      text: `Anda berpura-pura me-retire ${quantity} VCT seharga $${(quantity * DEFAULT_PRICE).toFixed(2)}. Fitur pembayaran Payment Gateway belum diintegrasikan untuk versi demo ini.`,
      icon: 'success',
      confirmButtonText: 'Oke, Saya Paham'
    });
  };

  return (
    <main>
      <Topbar title="Carbon Market Detail" breadcrumbs={["Carbon Market", version.name]} />

      <div className={styles.detailPage}>
        {/* KOLOM KIRI - KONTEN UTAMA */}
        <div className={styles.mainContent}>
          
          <div className={styles.galleryContainer}>
            {gallery.length > 1 && (
              <button className={`${styles.galleryNav} ${styles.prev}`} onClick={() => handleGalleryNav('prev')}>
                <FaChevronLeft />
              </button>
            )}
            
            <div className={styles.galleryMainImage} style={{ width: '100%', height: '400px', backgroundColor: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
               <img 
                 src={gallery[currentImageIndex]?.url} 
                 alt={version.name} 
                 style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                 onError={(e) => e.target.src = 'https://placehold.co/800x500/cccccc/white?text=Image+Error'}
               />
            </div>

            {gallery.length > 1 && (
              <button className={`${styles.galleryNav} ${styles.next}`} onClick={() => handleGalleryNav('next')}>
                <FaChevronRight />
              </button>
            )}
          </div>

          {gallery.length > 1 && (
            <div className={styles.thumbnailContainer} style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {gallery.map((item, index) => (
                <div 
                  key={index} 
                  className={`${styles.thumbnail} ${index === currentImageIndex ? styles.activeThumbnail : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{ 
                    flex: 'none', 
                    width: '120px', 
                    height: '80px', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    cursor: 'pointer', 
                    border: index === currentImageIndex ? '2px solid #0d9488' : '2px solid transparent' 
                  }}
                >
                  <img 
                     src={item.url} 
                     alt={`Thumb ${index}`} 
                     style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                     onError={(e) => e.target.src = 'https://placehold.co/100x100/cccccc/white?text=Error'}
                  />
                </div>
              ))}
            </div>
          )}

          <div className={styles.tabContainer}>
            <button className={activeTab === 'deskripsi' ? styles.activeTab : ''} onClick={() => setActiveTab('deskripsi')}>Deskripsi</button>
            <button className={activeTab === 'detail' ? styles.activeTab : ''} onClick={() => setActiveTab('detail')}>Detail</button>
            <button className={activeTab === 'audit' ? styles.activeTab : ''} onClick={() => setActiveTab('audit')}>Audit Trail</button>
            <button className={activeTab === 'dokumen' ? styles.activeTab : ''} onClick={() => setActiveTab('dokumen')}>Dokumen</button>
          </div>

          <div className={styles.tabContent}>
            
            {activeTab === 'deskripsi' && (
              <div>
                <h3>Tentang Proyek</h3>
                <p>{version.description || "Tidak ada deskripsi yang diberikan untuk proyek ini."}</p>
                
                <h3>Manfaat & Dampak</h3>
                <p>
                  Proyek {version.project_type || 'Energi'} ini berlokasi di {version.kota?.nama}. 
                  Kehadiran proyek ini berkontribusi langsung dalam menurunkan emisi gas rumah kaca sebesar {totalToken.toLocaleString('id-ID')} Ton CO2e per tahun. 
                  Serta mendukung pencapaian Net Zero Emission yang ditargetkan pemerintah.
                </p>

                <h3>Verifikasi dan Transparansi</h3>
                <p>Proyek diverifikasi sesuai standar ISO/Verra dan dicatat dalam ekosistem Blockchain Polygon secara permanen. Laporan pemantauan dan verifikasi emisi dapat diakses melalui tab dokumen dan audit trail.</p>
              </div>
            )}

            {activeTab === 'detail' && (
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}><strong>Lokasi</strong><span>{version.kota?.nama || '-'}, {version.provinsi?.nama || '-'}</span></div>
                <div className={styles.detailItem}><strong>Tipe Proyek</strong><span>{version.project_type || '-'}</span></div>
                <div className={styles.detailItem}><strong>Metodologi MRV</strong><span>{audit.calculation_method === 'system_estimated' ? 'System Estimation' : 'Inverter Actual'}</span></div>
                <div className={styles.detailItem}><strong>Auditor</strong><span>{audit.auditor?.name || 'Verideon Internal Auditor'}</span></div>
                <div className={styles.detailItem}><strong>Tanggal Instalasi</strong><span>{version.installation_date ? new Date(version.installation_date).toLocaleDateString('id-ID') : '-'}</span></div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div>
                <h3><FaShieldAlt style={{ color: '#0d9488', marginRight: '8px' }} /> Rekam Jejak Polygon</h3>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '20px' }}>Data di bawah ini ditarik langsung dari jaringan blockchain publik, menjamin tidak ada manipulasi data.</p>
                
                {isLoadingHistory ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', fontSize: '0.9rem' }}>
                    <FaSpinner className="fa-spin" /> Fetching immutable ledger...
                  </div>
                ) : blockchainHistory.length > 0 ? (
                  <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {blockchainHistory.map((log, index) => {
                      let statusColor = '#3b82f6'; 
                      if (log.status === 'listed') statusColor = '#22c55e'; 
                      else if (log.status.includes('reject')) statusColor = '#ef4444'; 
                      else if (log.status === 'auditor_verified') statusColor = '#0ea5e9'; 

                      return (
                        <div key={index} style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: statusColor, border: '2px solid white', boxShadow: '0 0 0 1px #cbd5e1' }}></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <strong style={{ fontSize: '0.95rem', color: '#1f2937' }}>{log.eventName}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatBlockchainTime(log.timestamp)}</span>
                            </div>
                            <div style={{ marginTop: '4px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>Data Hash: </span>
                              <code style={{ fontSize: '0.75rem', color: '#334155' }}>{log.dataHash.substring(0, 20)}...</code>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <a href={`https://amoy.polygonscan.com/address/${log.actor}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none' }}><FaSearch /> View Actor</a>
                              <a href={`/snapshot?url=${encodeURIComponent(log.metadataUri)}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0d9488', backgroundColor: '#ccfbf1', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none' }}><FaFileAlt /> Data Snapshot</a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>Tidak ada riwayat on-chain ditemukan.</p>
                )}
              </div>
            )}

            {activeTab === 'dokumen' && (
              <ul className={styles.documentList}>
                {publicDocs.length > 0 ? publicDocs.map((doc, i) => (
                  <li key={i}>
                    <FaFileAlt />
                    <div className={styles.docInfo}>
                      <strong>{doc.original_filename}</strong>
                      <span>Dokumen Publik Proyek</span>
                    </div>
                    <a href={getFullUrl(doc.file_path)} target="_blank" rel="noreferrer" className={styles.downloadButton}>View File</a>
                  </li>
                )) : (
                  <p>Tidak ada dokumen publik yang tersedia.</p>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* KOLOM KANAN - SIDEBAR PEMBELIAN (STICKY) */}
        <div className={styles.sidebar}>
          <div className={styles.buyCard}>
            <h2>{version.name}</h2>
            <div className={styles.verifiedBadge}>
              <FaCheckCircle /> Verified Blockchain Listing
            </div>

            <div className={styles.priceInfo}>
              <div className={styles.price}>
                <span>Price</span>
                <strong>USD ${DEFAULT_PRICE.toFixed(2)}/VCT</strong>
              </div>
              <div className={styles.infoGrid}>
                <div>
                  <span>Available Token</span>
                  <strong>{availableToken.toLocaleString('id-ID')}</strong>
                </div>
                {/* 👉 FIX: Tombol Asset dipindah ke bawah */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Asset</span>
                  <strong>VCT-{(project.id).toString().padStart(4, '0')}</strong>
                  <a href={`https://amoy.polygonscan.com/token/0xYourContractAddressHere?a=${project.id}`} target="_blank" rel="noreferrer" className={styles.polygonscanBtn}>
                    View on Polygonscan <FaExternalLinkAlt size={10} />
                  </a>
                </div>
                <div>
                  <span>Vintage</span>
                  <strong>{version.period_end ? new Date(version.period_end).getFullYear() : 2026}</strong>
                </div>
              </div>
              <div className={styles.conversionInfo}>
                <FaInfoCircle /> 1 VCT = 1 Tonne CO2e Reduction
              </div>
            </div>

            <div className={styles.quantitySelector}>
              <span>Quantity to Retire</span>
              <div className={styles.quantityControls}>
                <button onClick={() => handleQuantityChange(-1)}><FaMinus /></button>
                <input type="number" value={quantity} readOnly />
                <button onClick={() => handleQuantityChange(1)}><FaPlus /></button>
              </div>
            </div>
            
            <button className={styles.buyButton} onClick={handleDummyBuy}>
              Retire Carbon Token
            </button>
            
            <div className={styles.totalPrice}>
              Total <span>USD ${(quantity * DEFAULT_PRICE).toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Issuer</h3>
            <div className={styles.issuerInfo}>
              <div className={styles.issuerLogo} style={{ backgroundColor: '#e2e8f0', display: 'flex', alignItems:'center', justifyContent:'center', color:'#64748b', width:'40px', height:'40px', borderRadius:'8px' }}>
                <FaBuilding />
              </div>
              <div className={styles.issuerName}>
                {/* 👉 FIX: Tombol Issuer pindah ke samping */}
                <div className={styles.nameRow}>
                  <strong>{project.issuer?.name}</strong>
                  {project.issuer?.wallet_address && (
                    <a href={`https://amoy.polygonscan.com/address/${project.issuer.wallet_address}`} target="_blank" rel="noreferrer" className={styles.polygonscanBtn}>
                      View on Polygonscan <FaExternalLinkAlt size={10} />
                    </a>
                  )}
                </div>
                <span style={{ marginTop: '4px', display: 'inline-block' }}><FaCheckCircle /> Verified Partner</span>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Project Assessment</h3>
            <div className={styles.assessmentItem}>
              <span>Auditor</span>
              <div className={styles.auditorInfo}>
                <FaShieldAlt color="#4f46e5" size={20} />
                {/* 👉 FIX: Tombol Auditor pindah ke samping */}
                <div className={styles.nameRow}>
                  <strong>{audit.auditor?.name || 'Verideon Internal Auditor'}</strong>
                  {audit.auditor?.wallet_address && (
                    <a href={`https://amoy.polygonscan.com/address/${audit.auditor.wallet_address}`} target="_blank" rel="noreferrer" className={styles.polygonscanBtn}>
                       View on Polygonscan <FaExternalLinkAlt size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.assessmentItem} style={{ marginTop: '16px' }}>
              <span>Standard</span>
              <strong>{audit.baseline_emission_factor ? 'ISO 14064-2' : 'Internal MRV'}</strong>
            </div>
            <div className={styles.assessmentItem}>
              <span>Emission Factor</span>
              <strong>{audit.baseline_emission_factor || '-'} tCO2e/MWh</strong>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Project Specification</h3>
            <div className={styles.specGrid}>
              <div><span>Kapasitas</span><strong>{version.total_system_capacity_kwp || 0} kWp</strong></div>
              <div><span>Merk Panel</span><strong>{version.panel_brand || '-'}</strong></div>
              <div><span>Merk Inverter</span><strong>{version.inverter_brand || '-'}</strong></div>
              <div><span>Estimasi Listrik</span><strong>{audit.verified_generation_kwh || 0} kWh/yr</strong></div>
              <div><span>Total Offset</span><strong>{totalToken.toLocaleString('id-ID')} tCO2e</strong></div>
            </div>
          </div>

          {/* Hiasan Stats Bar */}
          <div className={styles.infoCard}>
            <h3>Stats</h3>
            <div className={styles.statsBar}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${availablePercentage}%` }}></div>
              </div>
              <div className={styles.statsLabel}>
                <span>Token Available</span>
                <span>Token Sold</span>
              </div>
              <div className={styles.statsValue}>
                <strong>{availableToken.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</strong>
                <strong>{tokenSold.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          {/* Hiasan SDGs */}
          <div className={styles.infoCard}>
            <h3>Sustainable Development Goals</h3>
            <div className={styles.sdgBox}>
              {sdgs.map(sdg => (
                <Image 
                  key={sdg.id} 
                  src={sdg.img} 
                  alt={sdg.title} 
                  title={sdg.title} 
                  width={60} 
                  height={60} 
                  className={styles.sdgIcon}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}