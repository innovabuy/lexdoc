import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, Pagination } from '../types/api';
import type {
  DocumentTracking,
  DocumentTrackingFilters,
  DocumentTrackingStats,
  SendForSignatureInput,
  SendLrarInput,
} from '../types/documentTracking';

/**
 * Get tracking info for a document
 */
export async function getDocumentTracking(documentId: string): Promise<DocumentTracking | null> {
  const { data } = await apiClient.get<ApiResponse<DocumentTracking | null>>(
    `/documents/${documentId}/tracking`
  );
  return data.data ?? null;
}

/**
 * Send document for electronic signature
 */
export async function sendForSignature(
  documentId: string,
  input: SendForSignatureInput
): Promise<DocumentTracking> {
  const { data } = await apiClient.post<ApiResponse<DocumentTracking>>(
    `/documents/${documentId}/send-for-signature`,
    input
  );
  return data.data!;
}

/**
 * Send document via LRAR
 */
export async function sendLrar(
  documentId: string,
  input: SendLrarInput
): Promise<DocumentTracking> {
  const { data } = await apiClient.post<ApiResponse<DocumentTracking>>(
    `/documents/${documentId}/send-lrar`,
    input
  );
  return data.data!;
}

/**
 * Send manual reminder for a document
 */
export async function sendReminder(documentId: string): Promise<DocumentTracking> {
  const { data } = await apiClient.post<ApiResponse<DocumentTracking>>(
    `/documents/${documentId}/send-reminder`
  );
  return data.data!;
}

/**
 * Cancel signature request
 */
export async function cancelSignatureRequest(documentId: string): Promise<DocumentTracking> {
  const { data } = await apiClient.post<ApiResponse<DocumentTracking>>(
    `/documents/${documentId}/cancel-signature`
  );
  return data.data!;
}

/**
 * List all document trackings
 */
export async function listTrackings(
  filters?: DocumentTrackingFilters
): Promise<PaginatedResponse<DocumentTracking>> {
  const { data } = await apiClient.get<ApiResponse<DocumentTracking[]> & { pagination?: Pagination }>(
    '/document-tracking',
    { params: filters }
  );

  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

/**
 * Get tracking statistics
 */
export async function getTrackingStats(): Promise<DocumentTrackingStats> {
  const { data } = await apiClient.get<ApiResponse<DocumentTrackingStats>>(
    '/document-tracking/stats'
  );
  return data.data!;
}
