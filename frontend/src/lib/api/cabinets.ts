import apiClient from './client';
import type { Cabinet, CabinetStats, UpdateCabinetInput } from '@/lib/types';
import type { ApiResponse } from '@/lib/types';

export async function getCabinet(): Promise<Cabinet> {
  const { data } = await apiClient.get<ApiResponse<Cabinet>>('/cabinets/current');
  return data.data!;
}

export async function updateCabinet(input: UpdateCabinetInput): Promise<Cabinet> {
  const { data } = await apiClient.patch<ApiResponse<Cabinet>>('/cabinets/current', input);
  return data.data!;
}

export async function getCabinetStats(): Promise<CabinetStats> {
  const { data } = await apiClient.get<ApiResponse<CabinetStats>>('/cabinets/current/stats');
  return data.data!;
}
