import api from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('extranet_token');
  return { Authorization: `Bearer ${token}` };
};

const authed = {
  get: (url) => api.get(url, { headers: getAuthHeaders() }),
  post: (url, data) => api.post(url, data, { headers: getAuthHeaders() }),
  patch: (url, data) => api.patch(url, data, { headers: getAuthHeaders() }),
  put: (url, data) => api.put(url, data, { headers: getAuthHeaders() }),
  delete: (url) => api.delete(url, { headers: getAuthHeaders() }),
};

// Auth
export const verifyToken = (token) => api.get(`/extranet/verify-token/${token}`);
export const login = (email, password) => api.post('/extranet/login', { email, password });
export const activate = (token, password) => api.post('/extranet/activate', { token, password });

// Profile
export const getProfile = () => authed.get('/extranet/me/profile');
export const getCompleteness = () => authed.get('/extranet/me/profile/completeness');
export const saveStep = (step, data) => authed.patch(`/extranet/me/profile/step/${step}`, data);
export const submitProfile = () => authed.post('/extranet/me/profile/submit');

// Folders & Documents
export const getFolders = () => authed.get('/extranet/me/folders');
export const getFolderDocuments = (folderId) => authed.get(`/extranet/me/folders/${folderId}/documents`);
export const downloadDocument = (docId) => authed.get(`/extranet/me/documents/${docId}/download`);

// Me
export const getMe = () => authed.get('/extranet/me');

// Form-token (no JWT, token-based)
export const verifyFormToken = (token) => api.get(`/extranet/form/verify/${token}`);
export const getFormProfile = (token) => api.get(`/extranet/form/${token}/profile`);
export const getFormCompleteness = (token) => api.get(`/extranet/form/${token}/completeness`);
export const saveFormStep = (token, step, data) => api.patch(`/extranet/form/${token}/step/${step}`, data);
export const submitFormProfile = (token) => api.post(`/extranet/form/${token}/submit`);
