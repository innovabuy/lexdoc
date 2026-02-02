import { apiClient } from './client';

export type ClientType = 'PARTICULIER' | 'ENTREPRISE' | 'ASSOCIATION' | 'COLLECTIVITE';
export type Civilite = 'MAITRE' | 'MONSIEUR' | 'MADAME';

export interface Client {
  id: string;
  cabinetId: string;
  type: ClientType;
  civilite?: Civilite;
  nom: string;
  prenom?: string;
  denomination?: string;
  email?: string;
  telephone?: string;
  mobile?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  siret?: string;
  rcs?: string;
  formeJuridique?: string;
  capital?: number;
  representant?: string;
  notes?: string;
  tags: string[];
  foldersCount?: number;
  folders?: Array<{
    id: string;
    name: string;
    folderType: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  type?: ClientType;
  civilite?: Civilite;
  nom: string;
  prenom?: string;
  denomination?: string;
  email?: string;
  telephone?: string;
  mobile?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  siret?: string;
  rcs?: string;
  formeJuridique?: string;
  capital?: number;
  representant?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

export interface ClientsQuery {
  search?: string;
  type?: ClientType;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: 'nom' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface ClientsResponse {
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * List clients with filters
 */
export async function listClients(query?: ClientsQuery): Promise<ClientsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.append('search', query.search);
  if (query?.type) params.append('type', query.type);
  if (query?.tags) params.append('tags', query.tags);
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

  const response = await apiClient.get<{ success: boolean } & ClientsResponse>(
    `/clients?${params.toString()}`
  );
  return { data: response.data.data, pagination: response.data.pagination };
}

/**
 * Search clients for autocomplete
 */
export async function searchClients(query: string, limit = 10): Promise<Client[]> {
  const response = await apiClient.get<{ success: boolean; data: Client[] }>(
    `/clients/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return response.data.data;
}

/**
 * Get a single client by ID
 */
export async function getClient(id: string): Promise<Client> {
  const response = await apiClient.get<{ success: boolean; data: Client }>(
    `/clients/${id}`
  );
  return response.data.data;
}

/**
 * Create a new client
 */
export async function createClient(input: CreateClientInput): Promise<Client> {
  const response = await apiClient.post<{ success: boolean; data: Client }>(
    '/clients',
    input
  );
  return response.data.data;
}

/**
 * Update a client
 */
export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  const response = await apiClient.put<{ success: boolean; data: Client }>(
    `/clients/${id}`,
    input
  );
  return response.data.data;
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
