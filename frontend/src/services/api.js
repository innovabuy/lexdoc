import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Don't inject admin token on extranet API calls — they use their own auth
  const isExtranetCall = config.url?.startsWith('/extranet');
  if (!isExtranetCall && !config.headers.Authorization) {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect extranet routes — they have their own auth flow
      const isExtranet = window.location.pathname.startsWith('/extranet');
      if (!isExtranet) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
