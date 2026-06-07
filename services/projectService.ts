// services/projectService.ts
import { api } from "./api";

export const projectService = {

  getMyProjects: async () => {
    return api("/issuer/projects");
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
  
  getAllProjects: async () => {
    return api("/admin/projects");
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
  
  getAuditorProjects: async () => {
    return api("/auditor/projects");
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
  saveTxHash: async (id, txHash, snapshotId = null) => {
    const payload = { tx_hash: txHash };
    if (snapshotId) payload.snapshot_id = snapshotId;
    
    // UBAH BARIS INI 👇
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
};