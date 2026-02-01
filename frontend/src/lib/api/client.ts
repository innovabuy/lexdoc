import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Store reference for auth store (set after store creation to avoid circular deps)
let getAuthState: (() => { accessToken: string | null; refreshToken: string | null }) | null = null;
let setTokens: ((accessToken: string, refreshToken: string) => void) | null = null;
let logout: (() => void) | null = null;

export function setAuthStoreHandlers(
  getState: () => { accessToken: string | null; refreshToken: string | null },
  setTokensFn: (accessToken: string, refreshToken: string) => void,
  logoutFn: () => void
) {
  getAuthState = getState;
  setTokens = setTokensFn;
  logout = logoutFn;
}

// Request interceptor - Add token
apiClient.interceptors.request.use(
  (config) => {
    const state = getAuthState?.();
    if (state?.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const state = getAuthState?.();
        if (!state?.refreshToken) {
          throw new Error('No refresh token');
        }

        // Refresh call
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken: state.refreshToken,
        });

        // Update tokens
        setTokens?.(data.data.accessToken, data.data.refreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed -> Logout
        logout?.();
        toast.error('Session expirée, veuillez vous reconnecter');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors

    if (error.response?.status === 403) {
      const code = error.response?.data?.error?.code;
      if (code !== 'TWO_FACTOR_REQUIRED') {
        toast.error('Accès refusé');
      }
    } else if (error.response?.status === 404) {
      // Don't show toast for 404, let component handle it
    } else if (error.response?.status === 422) {
      // Validation errors - let form handle it
    } else if (error.response?.status >= 500) {
      toast.error('Erreur serveur, veuillez réessayer');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
