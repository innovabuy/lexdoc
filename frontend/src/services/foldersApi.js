import api from './api';

export async function createFolderWizard(body) {
  const { data } = await api.post('/folders/wizard', body);
  return data.data;
}

export async function getNextReference() {
  const { data } = await api.get('/folders/next-reference');
  return data.data;
}

export async function getTemplateSuggestions(params = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.nature) query.set('nature', params.nature);
  const { data } = await api.get(`/templates/suggestions?${query}`);
  return data.data || [];
}

export async function searchClients(search) {
  const { data } = await api.get(`/clients?search=${encodeURIComponent(search)}&pageSize=10`);
  return data.data || [];
}

export async function patchFolderStatus(id, status) {
  const { data } = await api.patch(`/folders/${id}/status`, { status });
  return data.data;
}

export async function getFolderDocuments(folderId) {
  const { data } = await api.get(`/folders/${folderId}/documents`);
  return data.data;
}

export async function getFolderSignatures(folderId) {
  const { data } = await api.get(`/folders/${folderId}/signatures`);
  return data.data || [];
}

export async function getFolderTimeline(folderId) {
  const { data } = await api.get(`/folders/${folderId}/timeline`);
  return data.data || [];
}

export async function uploadFolderDocument(folderId, file, opts = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', folderId);
  if (opts.name) formData.append('name', opts.name);
  if (opts.type) formData.append('type', opts.type);
  if (opts.category) formData.append('category', opts.category);
  if (opts.description) formData.append('description', opts.description);
  const { data } = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function toggleDocExtranet(docId, visible) {
  const { data } = await api.patch(`/documents/${docId}/extranet`, { visible });
  return data.data;
}

export async function updateFolder(id, body) {
  const { data } = await api.put(`/folders/${id}`, body);
  return data.data;
}

export async function addDocCategory(folderId, name, icon) {
  const { data } = await api.post(`/folders/${folderId}/doc-categories`, { name, icon });
  return data.data;
}

// ── Template generation ──

export async function getTemplates(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  const { data } = await api.get(`/templates?${query}`);
  return data.data || [];
}

export async function generateFromTemplate(templateId, folderId, opts = {}) {
  const { data } = await api.post('/templates/generate', {
    templateId,
    folderId,
    categoryId: opts.categoryId || null,
    titre: opts.titre || null,
    additionalData: opts.additionalData || null,
  });
  return data.data;
}

export async function forceGenerateFromTemplate(templateId, folderId, opts = {}) {
  const { data } = await api.post('/templates/generate/force', {
    templateId,
    folderId,
    categoryId: opts.categoryId || null,
    titre: opts.titre || null,
    additionalData: opts.additionalData || null,
  });
  return data.data;
}

export async function checkTemplateDuplicate(folderId, templateId) {
  const { data } = await api.get(`/templates/check-duplicate?folderId=${folderId}&templateId=${templateId}`);
  return data.data;
}
