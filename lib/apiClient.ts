import axios from 'axios';

// Ganti dengan URL backend-mu
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor: Menyuntikkan token ke setiap request
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage (sesuaikan jika beda)
    const token = localStorage.getItem('authToken'); 
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Kumpulan Fungsi untuk User API ---

// (GET /user) - Fetcher untuk SWR
export const getUsers = async () => {
  const response = await apiClient.get('/user');
  return response.data;
};

// (POST /user)
export const createUser = async (userData: any) => {
  const response = await apiClient.post('/user', userData);
  return response.data;
};

// (PATCH /user/:id)
export const updateUser = async (id: number, userData: any) => {
  const response = await apiClient.patch(`/user/${id}`, userData);
  return response.data;
};

// (DELETE /user/:id)
export const deleteUser = async (id: number) => {
  const response = await apiClient.delete(`/user/${id}`);
  return response.data;
};

export default apiClient;