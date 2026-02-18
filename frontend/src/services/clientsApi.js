import api from './api';

export async function getClients(params = {}) {
  const { search, type, status, page = 1, pageSize = 20, sort, order } = params;
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (type) query.set('type', type);
  if (status) query.set('status', status);
  if (sort) query.set('sort', sort);
  if (order) query.set('order', order);
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  const { data } = await api.get(`/clients?${query}`);
  return { data: data.data, pagination: data.pagination };
}

export async function getClient(id) {
  const { data } = await api.get(`/clients/${id}`);
  return data.data;
}

export async function getClientCompleteness(id) {
  const { data } = await api.get(`/clients/${id}/completeness`);
  return data.data;
}

export async function createClient(body) {
  const { data } = await api.post('/clients', body);
  return data.data;
}

export async function updateClient(id, body) {
  const { data } = await api.put(`/clients/${id}`, body);
  return data.data;
}

export async function updateClientSection(id, section, body) {
  const { data } = await api.patch(`/clients/${id}/section/${section}`, body);
  return data.data;
}

export async function sendClientForm(id) {
  const { data } = await api.post(`/clients/${id}/send-form`);
  return data.data;
}

export async function archiveClient(id) {
  const { data } = await api.patch(`/clients/${id}/archive`);
  return data.data;
}

export async function deleteClient(id) {
  await api.delete(`/clients/${id}`);
}

export async function inviteExtranet(id) {
  const { data } = await api.post(`/clients/${id}/invite-extranet`);
  return data.data;
}
