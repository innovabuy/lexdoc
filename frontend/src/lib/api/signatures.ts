import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, Pagination } from '../types/api';
import type { SignatureTransaction, CreateSignatureInput, SignatureFilters } from '../types/signature';

/**
 * Get paginated list of signature transactions
 */
export async function getSignatures(
  filters?: SignatureFilters
): Promise<PaginatedResponse<SignatureTransaction>> {
  const { data } = await apiClient.get<ApiResponse<SignatureTransaction[]> & { pagination?: Pagination }>('/signatures', {
    params: filters,
  });

  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

/**
 * Get single signature transaction by ID
 */
export async function getSignature(id: string): Promise<SignatureTransaction> {
  const { data } = await apiClient.get<ApiResponse<SignatureTransaction>>(`/signatures/${id}`);
  return data.data!;
}

/**
 * Create a new signature transaction
 */
export async function createSignature(input: CreateSignatureInput): Promise<SignatureTransaction> {
  const { data } = await apiClient.post<ApiResponse<SignatureTransaction>>('/signatures', input);
  return data.data!;
}

/**
 * Cancel a signature transaction
 */
export async function cancelSignature(id: string): Promise<void> {
  await apiClient.post(`/signatures/${id}/cancel`);
}

/**
 * Send reminder to a signatory
 */
export async function remindSigner(id: string, signerEmail: string): Promise<void> {
  await apiClient.post(`/signatures/${id}/remind`, { signerEmail });
}

/**
 * Download signed document
 */
export async function downloadSignedDocument(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/signatures/${id}/download`, {
    responseType: 'blob',
  });
  return data;
}

/**
 * Download certificates
 */
export async function downloadCertificates(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/signatures/${id}/certificates`, {
    responseType: 'blob',
  });
  return data;
}
