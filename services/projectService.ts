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
  }
};