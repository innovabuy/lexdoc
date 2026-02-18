import api from './api';

// ── DocuSign ──

export async function getDocuSignAuthUrl() {
  const { data } = await api.get('/integrations/docusign/auth-url');
  return data.data;
}

export async function getDocuSignStatus() {
  const { data } = await api.get('/integrations/docusign/status');
  return data.data;
}

export async function disconnectDocuSign() {
  const { data } = await api.post('/integrations/docusign/disconnect');
  return data.data;
}

// ── SendingBox ──

export async function saveSendingBoxKey(apiKey) {
  const { data } = await api.put('/integrations/sendingbox', { apiKey });
  return data.data;
}

export async function getSendingBoxStatus() {
  const { data } = await api.get('/integrations/sendingbox/status');
  return data.data;
}

// ── Document actions ──

export async function sendDocumentForSignature(documentId, body) {
  const { data } = await api.post(`/documents/${documentId}/sign`, body);
  return data.data;
}

export async function estimateRegisteredMail(documentId, body) {
  const { data } = await api.post(`/documents/${documentId}/send-registered`, body);
  return data.data;
}

export async function confirmRegisteredMail(documentId, body) {
  const { data } = await api.post(`/documents/${documentId}/send-registered/confirm`, body);
  return data.data;
}

// ── Signature requests ──

export async function getSignatureRequests(folderId) {
  const { data } = await api.get(`/folders/${folderId}/signatures`);
  return data.data || [];
}

export async function resendSignature(signatureId) {
  const { data } = await api.post(`/signatures/${signatureId}/resend`);
  return data.data;
}

export async function cancelSignature(signatureId) {
  const { data } = await api.delete(`/signatures/${signatureId}`);
  return data.data;
}
