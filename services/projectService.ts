// services/projectService.ts
import { api } from "./api";

export const projectService = {

  // Mengambil proyek khusus milik issuer yang sedang login
  getMyProjects: async () => {
    return api("/issuer/projects");
  },

  // Detail proyek berdasarkan ID
  getProjectDetail: async (id: number) => {
    return api(`/projects/${id}`);
  },

  createProject: async (payload: FormData) => { 
    return api("/projects", {
      method: "POST",
      body: payload, // Langsung kirim, jangan di JSON.stringify
    });
  },

  updateProject: async (id: number, payload: FormData) => { 
    // TRIK LARAVEL: File upload harus pakai POST, lalu kita spoofing methodnya
    payload.append('_method', 'PATCH'); 

    return api(`/projects/${id}`, {
      method: "POST", // Harus POST agar multipart/form-data terbaca PHP
      body: payload,
    });
  },

  // Submit proyek ke admin
  submitProject: async (id: number) => {
    return api(`/projects/${id}/submit`, {
      method: "POST",
    });
  },

  //Revise proyek
  reviseProject: async (id: number) => {
    return api(`/projects/${id}/revise`, {
      method: "POST",
    });
  },

  // Hapus proyek
  deleteProject: async (id: number) => {
    return api(`/projects/${id}`, {
      method: "DELETE",
    });
  },

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================
  
  // Mengambil semua project untuk dashboard Admin
  getAllProjects: async () => {
    return api("/admin/projects");
  },

  // 👉 BARU DITAMBAHKAN: Mengambil antrean proyek yang sudah lolos audit (siap minting)
  getAdminListingQueue: async () => {
    return api("/admin/projects/listing-queue");
  },

  // Admin menyetujui proyek (Menerima txHash)
  adminApprove: async (id: number, txHash: string) => {
    return api(`/admin/projects/${id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tx_hash: txHash }), 
    });
  },

  // Admin menolak proyek
  adminReject: async (id: number, data: any) => {
    return api(`/admin/projects/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  // Admin me-listing proyek yang sudah lolos audit
  adminListProject: async (id: number, txHash: string) => {
    return api(`/admin/projects/${id}/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tx_hash: txHash }),
    });
  },

  // ==========================================
  // AUDITOR ENDPOINTS
  // ==========================================
  
  getAuditorProjects: async () => {
    return api("/auditor/projects");
  },

  // Menerima formData dan txHash
  auditorVerify: async (id: number, formData: FormData, txHash: string) => {
    if (txHash) {
      formData.append('tx_hash', txHash);
    }
    
    return api(`/auditor/projects/${id}/verify`, {
      method: "POST",
      body: formData, 
    });
  },

  // Menerima data note dan txHash
  auditorReject: async (id: number, data: any, txHash: string) => {
    const payload = {
      ...data,
      tx_hash: txHash
    };

    return api(`/auditor/projects/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), 
    });
  },

  // ==========================================
  // PUBLIC / GENERAL ENDPOINTS
  // ==========================================

  // 👉 BARU DITAMBAHKAN: Memanggil snapshot spesifik untuk pembuktian saat sidang
  getProjectSnapshot: async (projectId: number, versionId: number, status: string) => {
    return api(`/projects/${projectId}/versions/${versionId}/snapshot/${status}`);
  },
};