import api from './api';

// Templates (admin)
export async function getFormTemplates() {
  const { data } = await api.get('/form-templates');
  return data.data;
}

export async function getFormTemplate(id) {
  const { data } = await api.get(`/form-templates/${id}`);
  return data.data;
}

export async function createFormTemplate(body) {
  const { data } = await api.post('/form-templates', body);
  return data.data;
}

export async function updateFormTemplate(id, body) {
  const { data } = await api.put(`/form-templates/${id}`, body);
  return data.data;
}

export async function deleteFormTemplate(id) {
  const { data } = await api.delete(`/form-templates/${id}`);
  return data.data;
}

// Responses (admin)
export async function getTemplateResponses(templateId) {
  const { data } = await api.get(`/form-templates/${templateId}/responses`);
  return data.data;
}

export async function getClientFormResponses(clientId, params = {}) {
  const query = new URLSearchParams();
  if (params.templateId) query.set('templateId', params.templateId);
  if (params.folderId) query.set('folderId', params.folderId);
  const { data } = await api.get(`/form-templates/clients/${clientId}/form-response?${query}`);
  return data.data;
}

export async function saveClientFormResponse(clientId, body) {
  const { data } = await api.post(`/form-templates/clients/${clientId}/form-response`, body);
  return data.data;
}
