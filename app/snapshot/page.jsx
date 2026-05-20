'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FaShieldAlt, FaCheckCircle, FaCopy, FaSpinner, 
  FaDatabase, FaLink, FaServer, FaInfoCircle, FaExternalLinkAlt,
  FaAlignLeft, FaAlignJustify
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import styles from './Snapshot.module.css';

function SnapshotContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 👉 NEW: State untuk mengatur format JSON (Pretty vs Minified)
  const [isPretty, setIsPretty] = useState(false);

  useEffect(() => {
    if (!url) {
      setError("URL Snapshot tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const fetchSnapshot = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil data dari server.");
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat snapshot. Pastikan URL valid dan server backend menyala.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, [url]);

  // 👉 NEW: Fungsi untuk mengambil HANYA objek metadata (Membuang hash_info)
  const getCleanData = () => {
    if (!data) return null;
    if (data.metadata) {
      return { metadata: data.metadata };
    }
    return data; // Fallback jika format dari server berbeda
  };

  const handleCopyRaw = () => {
    const cleanData = getCleanData();
    if (!cleanData) return;
    
    // 🔥 PENTING: Yang di-copy SELALU versi MINIFIED (tanpa spasi/enter) 
    // agar hasil hash SHA-256 cocok 100% dengan backend.
    const stringToCopy = JSON.stringify(cleanData);
    
    navigator.clipboard.writeText(stringToCopy);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Data Bersih (Minified) disalin ke clipboard!',
      showConfirmButton: false,
      timer: 3000
    });
  };

  const renderDataTree = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      const strValue = String(obj);
      const isLink = strValue.startsWith('http://') || strValue.startsWith('https://');
      
      if (isLink) {
        return (
          <a href={strValue} target="_blank" rel="noreferrer" className={styles.clickableLink}>
            {strValue} <FaExternalLinkAlt size={10} style={{ marginLeft: '6px' }} />
          </a>
        );
      }
      return <span className={styles.dataValuePrimitive}>{strValue}</span>;
    }

    return (
      <div className={styles.dataTree}>
        {Object.entries(obj).map(([key, value]) => {
          // Tetap tampilkan array agar UI lengkap, kecuali array kosong
          if (Array.isArray(value) && value.length === 0) return null;
          
          const strValue = String(value);
          const isLink = typeof value === 'string' && (strValue.startsWith('http://') || strValue.startsWith('https://'));

          return (
            <div key={key} className={styles.dataRow}>
              <span className={styles.dataKey}>
                {key.replace(/_/g, ' ')}
              </span>
              <div className={styles.dataValueWrapper}>
                {typeof value === 'object' && value !== null ? (
                  <div className={styles.nestedBox}>
                    {renderDataTree(value)}
                  </div>
                ) : isLink ? (
                  <a href={strValue} target="_blank" rel="noreferrer" className={styles.clickableLink}>
                    {strValue} <FaExternalLinkAlt size={10} style={{ marginLeft: '6px' }} />
                  </a>
                ) : (
                  <span className={styles.dataValue}>
                    {strValue}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <FaSpinner className="fa-spin" size={40} />
        <h3 className={styles.loadingText}>Retrieving Immutable Record...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <h2>Invalid Snapshot</h2>
        <p>{error}</p>
      </div>
    );
  }

  const cleanData = getCleanData();

  return (
    <div className={styles.wrapper}>
      
      {/* KOP DOKUMEN */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <FaShieldAlt /> VERIDEON DATA SNAPSHOT
            </h1>
            <p className={styles.subtitle}>
              <FaCheckCircle color="#10b981" /> Immutable On-Chain Data Record
            </p>
          </div>
          <div className={styles.statusGroup}>
            <div className={styles.statusLabel}>Status</div>
            <div className={styles.statusBadge}>
              {data?.hash_info?.status?.toUpperCase() || 'VERIFIED'}
            </div>
          </div>
        </div>

        {/* ISI DOKUMEN */}
        <div className={styles.dataContainer}>
          <h3 className={styles.sectionTitle}>Extracted Information</h3>
          {renderDataTree(cleanData?.metadata || cleanData)}
        </div>
      </div>

      {/* RAW JSON DATA UNTUK PENGUJI */}
      <div className={styles.terminalCard}>
        <div className={styles.terminalHeader}>
          <div className={styles.terminalTitle}>
            <FaDatabase color="#38bdf8" /> RAW JSON METADATA
          </div>
          
          {/* 👉 NEW: Action Buttons (Toggle & Copy) */}
          <div className={styles.terminalActions}>
            <button onClick={() => setIsPretty(!isPretty)} className={styles.toggleBtn}>
              {isPretty ? <FaAlignJustify /> : <FaAlignLeft />}
              {isPretty ? 'Minify' : 'Pretty'}
            </button>
            <button onClick={handleCopyRaw} className={styles.copyBtn}>
              <FaCopy /> Copy Data
            </button>
          </div>
        </div>
        
        <div className={styles.infoBanner}>
          <FaInfoCircle size={16} className={styles.infoIcon} />
          <span>Salin data bersih (minified) di bawah ini dan masukkan ke kalkulator SHA-256 untuk membuktikan kecocokan Hash dengan Blockchain.</span>
        </div>

        <pre 
          className={styles.pre} 
          style={{ 
            whiteSpace: isPretty ? 'pre-wrap' : 'normal', 
            wordBreak: isPretty ? 'normal' : 'break-all' 
          }}
        >
          {isPretty ? JSON.stringify(cleanData, null, 2) : JSON.stringify(cleanData)}
        </pre>
      </div>

      <div className={styles.footerServer}>
        <FaServer style={{ display: 'inline', marginBottom: '-2px' }}/> Data fetched directly from: <a href={url || '#'} target="_blank" rel="noreferrer" className={styles.footerLink}>{url} <FaLink size={10}/></a>
      </div>

    </div>
  );
}

export default function SnapshotPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={
        <div className={styles.suspenseFallback}>
          <FaSpinner className="fa-spin" size={40} />
        </div>
      }>
        <SnapshotContent />
      </Suspense>
    </div>
  );
}