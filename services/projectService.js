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

  updateProject: async (id, data) => {
    const formData = new FormData();
    
    for (const key in data) {
      if (data[key] === null || data[key] === undefined) continue;

      // Handle File Baru saat Edit
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

    const response = await apiClient.patch(`/project/${id}`, formData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await apiClient.delete(`/project/${id}`);
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await apiClient.delete(`/project/document/${documentId}`);
    return response.data;
  },

  // --- ADMIN & AUDITOR ENDPOINTS ---
  
  // 1. Get All Projects (Admin & Auditor)
  getAllProjects: async () => {
    const response = await apiClient.get('/project/admin/all'); 
    return response.data;
  },

  // 2. Process Admin Verification (Verify/Reject + Assign Auditor)
  processAdminVerification: async (id, data) => {
    const response = await apiClient.patch(`/project/${id}/admin-process`, data);
    return response.data;
  },

  // 3. AUDITOR: SUBMIT AUDIT (Support Multi-File)
  // Parameter 'data' adalah FormData yang berisi:
  // - Field Teknis
  // - audit_documents[] (Array file PDF)
  // - audit_images[] (Array file Gambar)
  submitAudit: async (id, data) => {
    // Browser otomatis set Content-Type multipart/form-data + boundary untuk FormData
    const response = await apiClient.post(`/project/${id}/audit`, data);
    return response.data;
  }
};