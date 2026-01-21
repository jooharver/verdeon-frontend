import apiClient from '../lib/apiClient';

export const userService = {
  // Ambil semua user dengan role Auditor
  getAuditors: async () => {
    const response = await apiClient.get('/user/auditors');
    return response.data;
  },
  
};