import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, Pagination } from '../types/api';
import type { LrarShipment, CreateLrarInput, LrarFilters } from '../types/lrar';

/**
 * Get paginated list of LRAR shipments
 */
export async function getLrarShipments(
  filters?: LrarFilters
): Promise<PaginatedResponse<LrarShipment>> {
  const { data } = await apiClient.get<ApiResponse<LrarShipment[]> & { pagination?: Pagination }>('/lrar', {
    params: filters,
  });

  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

/**
 * Get single LRAR shipment by ID
 */
export async function getLrarShipment(id: string): Promise<LrarShipment> {
  const { data } = await apiClient.get<ApiResponse<LrarShipment>>(`/lrar/${id}`);
  return data.data!;
}

/**
 * Create a new LRAR shipment
 */
export async function createLrar(input: CreateLrarInput): Promise<LrarShipment> {
  const { data } = await apiClient.post<ApiResponse<LrarShipment>>('/lrar', input);
  return data.data!;
}

/**
 * Cancel a LRAR shipment
 */
export async function cancelLrar(id: string): Promise<void> {
  await apiClient.post(`/lrar/${id}/cancel`);
}

/**
 * Download delivery proof (AR)
 */
export async function downloadProof(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/lrar/${id}/proof`, {
    responseType: 'blob',
  });
  return data;
}
