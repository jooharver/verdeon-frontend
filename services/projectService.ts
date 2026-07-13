// services/projectService.ts
import { api } from "./api";

export const projectService = {

  // 👉 UPDATE: Ditambahkan parameter page untuk paginasi Issuer
  getMyProjects: async (page: number | string = 1) => {
    return api(`/issuer/projects?page=${page}`);
  },

  getProjectDetail: async (id: string | number) => {
    return api(`/projects/${id}`);
  },

  createProject: async (payload: any) => { 
    return api("/projects", {
      method: "POST",
      body: payload, 
    });
  },

  updateProject: async (id: string | number, payload: any) => { 
    payload.append('_method', 'PATCH'); 
    return api(`/projects/${id}`, {
      method: "POST", 
      body: payload,
    });
  },

  submitProject: async (id: string | number) => {
    return api(`/projects/${id}/submit`, {
      method: "POST",
    });
  },

  reviseProject: async (id: string | number) => {
    return api(`/projects/${id}/revise`, {
      method: "POST",
    });
  },

  deleteProject: async (id: string | number) => {
    return api(`/projects/${id}`, {
      method: "DELETE",
    });
  },

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================
  
  // 👉 UPDATE: Ditambahkan parameter page untuk paginasi Admin
  getAllProjects: async (page: number | string = 1) => {
    return api(`/admin/projects?page=${page}`);
  },

  getAdminListingQueue: async () => {
    return api("/admin/projects/listing-queue");
  },

  // 👉 UPDATE: txHash dibuat opsional/default string kosong
  adminApprove: async (id: string | number, txHash: string = "") => {
    const payload = txHash ? { tx_hash: txHash } : {};
    return api(`/admin/projects/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), 
    });
  },

  adminReject: async (id: string | number, data: any, txHash: string = "") => {
    const payload = { ...data, ...(txHash && { tx_hash: txHash }) };
    return api(`/admin/projects/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  adminListProject: async (id: string | number, txHash: string = "") => {
    const payload = txHash ? { tx_hash: txHash } : {};
    return api(`/admin/projects/${id}/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  adminRejectAuditor: async (id: string | number, data: any, txHash: string = "") => {
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
  getAuditorProjects: async (page: number | string = 1) => {
    return api(`/auditor/projects?page=${page}`);
  },

  // 👉 UPDATE: txHash dibuat opsional
  auditorVerify: async (id: string | number, formData: any, txHash: string = "") => {
    if (txHash) {
      formData.append('tx_hash', txHash);
    }
    return api(`/auditor/projects/${id}/verify`, {
      method: "POST",
      body: formData, 
    });
  },

  auditorReject: async (id: string | number, data: any, txHash: string = "") => {
    const payload = { ...data, ...(txHash && { tx_hash: txHash }) };
    return api(`/auditor/projects/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), 
    });
  },

  getProjectVersionDetail: async (projectId: string | number, versionId: string | number) => {
    return api(`/projects/${projectId}/versions/${versionId}`);
  },

  // ==========================================
  // PUBLIC / GENERAL / FAIL-SAFE ENDPOINTS
  // ==========================================

  getProjectSnapshot: async (projectId: string | number, versionId: string | number, status: string) => {
    return api(`/projects/${projectId}/versions/${versionId}/snapshot/${status}`);
  },

  getMarketProjects: async () => {
    return api("/market/projects"); 
  },

  // FUNGSI UNTUK SINKRONISASI HASH SUSULAN
  saveTxHash: async (id: string | number, txHash: string, snapshotId: string | number | null = null, blockchainTx: string | null = null) => {
    const payload: any = {};
    if (txHash) payload.tx_hash = txHash;
    if (snapshotId) payload.snapshot_id = snapshotId;
    if (blockchainTx) payload.blockchain_tx = blockchainTx;
    
    return api(`/projects/${id}/save-tx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  // FAIL-SAFE ROLLBACK
  revertStatus: async (id: string | number, previousStatus: string) => {
    return api(`/projects/${id}/revert-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ previous_status: previousStatus }),
    });
  },

  // 👉 NEW: Meminta Digital Signature dari Laravel sebelum Minting
  requestMintSignature: async (id: string | number) => {
    return api(`/admin/projects/${id}/request-mint-signature`, {
      method: "GET",
    });
  },
};