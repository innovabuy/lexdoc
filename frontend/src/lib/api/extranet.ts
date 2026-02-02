import axios from 'axios';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

// Separate API client for extranet (client portal)
export const extranetApiClient = axios.create({
  baseURL: `${API_URL}/api/extranet`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Store reference for client token
let getClientToken: (() => string | null) | null = null;
let clientLogout: (() => void) | null = null;

export interface ClientInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  cabinetName: string;
}

export function setExtranetStoreHandlers(
  getToken: () => string | null,
  _setAuth: (token: string, client: ClientInfo) => void,
  logoutFn: () => void
) {
  getClientToken = getToken;
  clientLogout = logoutFn;
}

// Request interceptor - Add client token
extranetApiClient.interceptors.request.use(
  (config) => {
    const token = getClientToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
extranetApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clientLogout?.();
      window.location.href = '/extranet/login';
    }
    return Promise.reject(error);
  }
);

// =============================================
// AUTH API
// =============================================

export const extranetAuthApi = {
  checkActivationToken: async (token: string) => {
    const { data } = await extranetApiClient.get(`/auth/activate/${token}`);
    return data;
  },

  activateAccount: async (token: string, password: string) => {
    const { data } = await extranetApiClient.post(`/auth/activate/${token}`, { password });
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await extranetApiClient.post('/auth/login', { email, password });
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await extranetApiClient.post('/auth/forgot-password', { email });
    return data;
  },

  checkResetToken: async (token: string) => {
    const { data } = await extranetApiClient.get(`/auth/reset-password/${token}`);
    return data;
  },

  resetPassword: async (token: string, password: string) => {
    const { data } = await extranetApiClient.post(`/auth/reset-password/${token}`, { password });
    return data;
  },
};

// =============================================
// DASHBOARD API
// =============================================

export interface DashboardData {
  client: ClientInfo & {
    cabinetEmail?: string;
    cabinetPhone?: string;
    mainFolder?: { id: string; name: string };
    permissions: {
      canSign: boolean;
      canDownload: boolean;
      canComment: boolean;
    };
  };
  stats: {
    totalDocuments: number;
    pendingSignature: number;
    signed: number;
    pendingDelivery: number;
    delivered: number;
    activeFolders: number;
  };
  recentDocuments: Document[];
}

export interface Document {
  id: string;
  title: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: string;
  type: string;
  createdAt: string;
  folder?: { id: string; name: string };
  tracking?: DocumentTracking;
}

export interface DocumentTracking {
  id: string;
  status: string;
  reminderCount: number;
  lastReminderAt?: string;
  nextReminderAt?: string;
  reminderLogs: ReminderLog[];
}

export interface ReminderLog {
  id: string;
  reminderNumber: number;
  sentTo: string;
  sentAt: string;
  emailSubject: string;
  opened: boolean;
  openedAt?: string;
  clicked: boolean;
  clickedAt?: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  folderType: string;
  _count: { documents: number };
}

export const extranetApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await extranetApiClient.get('/dashboard');
    return data.data;
  },

  getDocuments: async (params?: {
    folderId?: string;
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await extranetApiClient.get('/documents', { params });
    return data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const { data } = await extranetApiClient.get(`/documents/${id}`);
    return data.data;
  },

  getDocumentDownload: async (id: string) => {
    const { data } = await extranetApiClient.get(`/documents/${id}/download`);
    return data.data;
  },

  signDocument: async (id: string) => {
    const { data } = await extranetApiClient.post(`/documents/${id}/sign`);
    return data;
  },

  getFolders: async (): Promise<Folder[]> => {
    const { data } = await extranetApiClient.get('/folders');
    return data.data;
  },
};

export default extranetApi;
