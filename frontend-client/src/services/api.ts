import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('client_token');
      localStorage.removeItem('client_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/extranet/auth/login', { email, password });
    return response.data;
  },

  validateActivationToken: async (token: string) => {
    const response = await api.get(`/extranet/auth/activate/${token}`);
    return response.data;
  },

  activateAccount: async (token: string, password: string) => {
    const response = await api.post(`/extranet/auth/activate/${token}`, { password });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/extranet/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post(`/extranet/auth/reset-password/${token}`, { password });
    return response.data;
  },
};

export const documentsApi = {
  getDashboard: async () => {
    const response = await api.get('/extranet/dashboard');
    return response.data;
  },

  getDocuments: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/extranet/documents', { params });
    return response.data;
  },

  getDocument: async (id: string) => {
    const response = await api.get(`/extranet/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (id: string) => {
    const response = await api.get(`/extranet/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
