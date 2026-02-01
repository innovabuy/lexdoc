import { apiClient } from './client';

// Types
export type Civilite = 'MAITRE' | 'MONSIEUR' | 'MADAME';

export interface AvocatLegalInfo {
  id: string;
  userId: string;
  cabinetId: string;
  civilite: Civilite;
  nom: string;
  prenom: string;
  barreau: string;
  numeroToque?: string | null;
  adresseCabinet: string;
  codePostal: string;
  ville: string;
  telephone: string;
  fax?: string | null;
  email: string;
  siteWeb?: string | null;
  signatureUrl?: string | null;
  cachetUrl?: string | null;
  mentionsLegalesDefaut: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvocatLegalInfoInput {
  civilite?: Civilite;
  nom: string;
  prenom: string;
  barreau: string;
  numeroToque?: string | null;
  adresseCabinet: string;
  codePostal: string;
  ville: string;
  telephone: string;
  fax?: string | null;
  email: string;
  siteWeb?: string | null;
  mentionsLegalesDefaut?: Record<string, unknown>;
}

export interface UpdateAvocatLegalInfoInput {
  civilite?: Civilite;
  nom?: string;
  prenom?: string;
  barreau?: string;
  numeroToque?: string | null;
  adresseCabinet?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  fax?: string | null;
  email?: string;
  siteWeb?: string | null;
  mentionsLegalesDefaut?: Record<string, unknown>;
}

export interface MentionsPreviewResult {
  html: string;
  text: string;
}

// API functions
export async function getMyLegalInfo(): Promise<AvocatLegalInfo | null> {
  const response = await apiClient.get<{ success: boolean; data: AvocatLegalInfo | null }>(
    '/avocat-legal-info/me'
  );
  return response.data.data;
}

export async function getLegalInfoById(id: string): Promise<AvocatLegalInfo> {
  const response = await apiClient.get<{ success: boolean; data: AvocatLegalInfo }>(
    `/avocat-legal-info/${id}`
  );
  return response.data.data;
}

export async function createLegalInfo(input: CreateAvocatLegalInfoInput): Promise<AvocatLegalInfo> {
  const response = await apiClient.post<{ success: boolean; data: AvocatLegalInfo }>(
    '/avocat-legal-info',
    input
  );
  return response.data.data;
}

export async function updateLegalInfo(
  id: string,
  input: UpdateAvocatLegalInfoInput
): Promise<AvocatLegalInfo> {
  const response = await apiClient.put<{ success: boolean; data: AvocatLegalInfo }>(
    `/avocat-legal-info/${id}`,
    input
  );
  return response.data.data;
}

export async function uploadSignature(id: string, file: File): Promise<AvocatLegalInfo> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<{ success: boolean; data: AvocatLegalInfo }>(
    `/avocat-legal-info/${id}/signature`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

export async function uploadCachet(id: string, file: File): Promise<AvocatLegalInfo> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<{ success: boolean; data: AvocatLegalInfo }>(
    `/avocat-legal-info/${id}/cachet`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

export async function getPreviewMentions(id: string): Promise<MentionsPreviewResult> {
  const response = await apiClient.get<{ success: boolean; data: MentionsPreviewResult }>(
    `/avocat-legal-info/${id}/preview-mentions`
  );
  return response.data.data;
}
