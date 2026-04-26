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

  createProject: async (payload) => { // payload sekarang berupa FormData
    return api("/projects", {
      method: "POST",
      body: payload, // Langsung kirim, jangan di JSON.stringify
      // Catatan: Pastikan file services/api.ts kamu TIDAK memaksa header 
      // "Content-Type": "application/json" jika body berupa FormData.
    });
  },

  updateProject: async (id, payload) => { // payload berupa FormData
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
  reviseProject: async (id) => {
    return api(`/projects/${id}/revise`, {
      method: "POST",
    });
  },

  // Hapus proyek
  deleteProject: async (id) => {
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

  // Admin menyetujui proyek
  adminApprove: async (id) => {
    return api(`/admin/projects/${id}/approve`, {
      method: "POST",
    });
  },

  // Admin menolak proyek
  adminReject: async (id, data) => {
    // data berisi { note: "Alasan penolakan..." }
    return api(`/admin/projects/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Admin me-listing proyek yang sudah lolos audit
  adminListProject: async (id, txHash) => {
    return api(`/admin/projects/${id}/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tx_hash: txHash }), // 👇 Kirim ke backend
    });
  },

  // ==========================================
  // AUDITOR ENDPOINTS
  // ==========================================
  
  getAuditorProjects: async () => {
    return api("/auditor/projects");
  },

  // Ubah fungsi ini agar menerima payload FormData
  auditorVerify: async (id, formData) => {
      return api(`/auditor/projects/${id}/verify`, {
        method: "POST",
        body: formData, // Kirim form data langsung
      });
    },

  auditorReject: async (id, data) => {
    return api(`/auditor/projects/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(data), // { note: "Alasan..." }
    });
  },
};