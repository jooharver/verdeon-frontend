// src/services/projectService.js
import apiClient from '../lib/apiClient';

export const projectService = {
  // --- ISSUER ENDPOINTS ---
  getMyProjects: async () => {
    const response = await apiClient.get('/project/my-projects');
    return response.data;
  },

  createProject: async (data) => {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] === null || data[key] === undefined) continue;
      
      // Handle Array File (image/document)
      if (key === 'image' || key === 'document') {
        if (data[key] && data[key].length > 0) {
          for (let i = 0; i < data[key].length; i++) {
            formData.append(key, data[key][i]);
          }
        }
      } else {
        formData.append(key, data[key]);
      }
    }
    const response = await apiClient.post('/project', formData);
    return response.data;
  },

  // PERBAIKAN: Sekarang support upload file baru saat Edit
  updateProject: async (id, data) => {
    const formData = new FormData();
    
    for (const key in data) {
      if (data[key] === null || data[key] === undefined) continue;

      // Handle File Baru saat Edit
      if (key === 'image' || key === 'document') {
        // Cek apakah ada file baru yang diupload (bukan array kosong)
        if (data[key] && data[key].length > 0) {
          for (let i = 0; i < data[key].length; i++) {
            formData.append(key, data[key][i]);
          }
        }
      } else {
        // Data Teks biasa
        formData.append(key, data[key]);
      }
    }

    // Menggunakan FormData untuk PATCH agar file baru terkirim
    const response = await apiClient.patch(`/project/${id}`, formData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await apiClient.delete(`/project/${id}`);
    return response.data;
  },

  // --- BARU: DELETE SPECIFIC DOCUMENT/IMAGE ---
  // Endpoint ini dipanggil saat user klik icon sampah di gambar/dokumen lama
  deleteDocument: async (documentId) => {
    // Pastikan route backendmu sesuai, misal: DELETE /project/document/:id
    const response = await apiClient.delete(`/project/document/${documentId}`);
    return response.data;
  },

  // --- ADMIN ENDPOINTS ---
  
  // 1. Get All Projects
  getAllProjects: async () => {
    const response = await apiClient.get('/project/admin/all'); 
    return response.data;
  },

  // 2. Verify Project
  verifyProject: async (id) => {
    const response = await apiClient.patch(`/project/${id}/verify`);
    return response.data;
  },

  // 3. Reject Project
  rejectProject: async (id, reason) => {
    const response = await apiClient.patch(`/project/${id}/reject`, { reason });
    return response.data;
  }
};