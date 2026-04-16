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

  // Create proyek (Laravel store akan otomatis buat v1)
  createProject: async (payload: any) => {
    return api("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Update proyek (Hanya jika status 'draft')
  updateProject: async (id: number, payload: any) => {
    return api(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
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
  adminListProject: async (id) => {
    return api(`/admin/projects/${id}/list`, {
      method: "POST",
    });
  },

  // ==========================================
  // AUDITOR ENDPOINTS
  // ==========================================
  
  getAuditorProjects: async () => {
    return api("/auditor/projects");
  },

  auditorVerify: async (id) => {
    return api(`/auditor/projects/${id}/verify`, {
      method: "POST",
    });
  },

  auditorReject: async (id, data) => {
    return api(`/auditor/projects/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(data), // { note: "Alasan..." }
    });
  },
};