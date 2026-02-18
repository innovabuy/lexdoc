import api from './api';

// Templates CRUD
export async function getTemplatesTree() {
  const { data } = await api.get('/templates/tree');
  return data.data;
}

export async function getTemplate(id) {
  const { data } = await api.get(`/templates/${id}`);
  return data.data;
}

export async function createTemplate(body) {
  const { data } = await api.post('/templates', body);
  return data.data;
}

export async function updateTemplate(id, body) {
  const { data } = await api.put(`/templates/${id}`, body);
  return data.data;
}

export async function deleteTemplate(id) {
  const { data } = await api.delete(`/templates/${id}`);
  return data.data;
}

export async function duplicateTemplate(id) {
  const { data } = await api.post(`/templates/${id}/duplicate`);
  return data.data;
}

export async function saveTemplateBlocks(id, blocks) {
  const { data } = await api.put(`/templates/${id}/blocks`, { blocks });
  return data.data;
}

export async function uploadTemplateSource(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/templates/${id}/upload-source`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

// Blocks CRUD
export async function getBlocks(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  const { data } = await api.get(`/blocks?${query}`);
  return data.data;
}

export async function createBlock(body) {
  const { data } = await api.post('/blocks', body);
  return data.data;
}

export async function updateBlock(id, body) {
  const { data } = await api.put(`/blocks/${id}`, body);
  return data.data;
}

export async function deleteBlock(id) {
  const { data } = await api.delete(`/blocks/${id}`);
  return data.data;
}

// Template variables catalog
export async function getTemplateVariables() {
  const { data } = await api.get('/builder/variables');
  return data.data;
}
