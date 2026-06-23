// services/projectService.ts
import { api } from "./api";

export const projectService = {

  // 👉 UPDATE: Ditambahkan parameter page untuk paginasi Issuer
  getMyProjects: async (page = 1) => {
    return api(`/issuer/projects?page=${page}`);
  },

  getProjectDetail: async (id) => {
    return api(`/projects/${id}`);
  },

  createProject: async (payload) => { 
    return api("/projects", {
      method: "POST",
      body: payload, 
    });
  },

  updateProject: async (id, payload) => { 
    payload.append('_method', 'PATCH'); 
    return api(`/projects/${id}`, {
      method: "POST", 
      body: payload,
    });
  },

  submitProject: async (id) => {
    return api(`/projects/${id}/submit`, {
      method: "POST",
    });
  },

  reviseProject: async (id) => {
    return api(`/projects/${id}/revise`, {
      method: "POST",
    });
  },

  deleteProject: async (id) => {
    return api(`/projects/${id}`, {
      method: "DELETE",
    });
  },

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================
  
  // 👉 UPDATE: Ditambahkan parameter page untuk paginasi Admin
  getAllProjects: async (page = 1) => {
    return api(`/admin/projects?page=${page}`);
  },

  getAdminListingQueue: async () => {
    return api("/admin/projects/listing-queue");
  },

  // 👉 UPDATE: txHash dibuat opsional/default string kosong
  adminApprove: async (id, txHash = "") => {
    const payload = txHash ? { tx_hash: txHash } : {};
    return api(`/admin/projects/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), 
    });
  },

  adminReject: async (id, data, txHash = "") => {
    const payload = { ...data, ...(txHash && { tx_hash: txHash }) };
    return api(`/admin/projects/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  adminListProject: async (id, txHash = "") => {
    const payload = txHash ? { tx_hash: txHash } : {};
    return api(`/admin/projects/${id}/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  adminRejectAuditor: async (id, data, txHash = "") => {
    const payload = { ...data, ...(txHash && { tx_hash: txHash }) };
    return api(`/admin/projects/${id}/reject-auditor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  // ==========================================
  // AUDITOR ENDPOINTS
  // ==========================================
  
  // 👉 UPDATE: Ditambahkan parameter page untuk paginasi Auditor
  getAuditorProjects: async (page = 1) => {
    return api(`/auditor/projects?page=${page}`);
  },

  // 👉 UPDATE: txHash dibuat opsional
  auditorVerify: async (id, formData, txHash = "") => {
    if (txHash) {
      formData.append('tx_hash', txHash);
    }
    return api(`/auditor/projects/${id}/verify`, {
      method: "POST",
      body: formData, 
    });
  },

  auditorReject: async (id, data, txHash = "") => {
    const payload = { ...data, ...(txHash && { tx_hash: txHash }) };
    return api(`/auditor/projects/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), 
    });
  },

  // ==========================================
  // PUBLIC / GENERAL / FAIL-SAFE ENDPOINTS
  // ==========================================

  getProjectSnapshot: async (projectId, versionId, status) => {
    return api(`/projects/${projectId}/versions/${versionId}/snapshot/${status}`);
  },

  getMarketProjects: async () => {
    return api("/market/projects"); 
  },

  // FUNGSI UNTUK SINKRONISASI HASH SUSULAN
  saveTxHash: async (id, txHash, snapshotId = null, blockchainTx = null) => {
    const payload = {};
    if (txHash) payload.tx_hash = txHash;
    if (snapshotId) payload.snapshot_id = snapshotId;
    if (blockchainTx) payload.blockchain_tx = blockchainTx; // 👉 Dikirim ke laravel sebagai blockchain_tx
    
    return api(`/projects/${id}/save-tx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  // FAIL-SAFE ROLLBACK
  revertStatus: async (id, previousStatus) => {
    return api(`/projects/${id}/revert-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ previous_status: previousStatus }),
    });
  },

  // 👉 NEW: Meminta Digital Signature dari Laravel sebelum Minting
  requestMintSignature: async (id) => {
    return api(`/admin/projects/${id}/request-mint-signature`, {
      method: "GET",
    });
  },
};