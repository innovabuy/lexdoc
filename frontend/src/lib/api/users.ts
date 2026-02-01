import apiClient from './client';
import type { UserListItem, CreateUserInput, UpdateUserInput, UserFilters } from '@/lib/types';
import type { PaginatedResponse, ApiResponse } from '@/lib/types';

export async function getUsers(
  filters?: UserFilters
): Promise<PaginatedResponse<UserListItem>['data']> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.role) params.append('role', filters.role);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const { data } = await apiClient.get<PaginatedResponse<UserListItem>>(
    `/users?${params.toString()}`
  );
  return data.data!;
}

export async function getUser(id: string): Promise<UserListItem> {
  const { data } = await apiClient.get<ApiResponse<UserListItem>>(`/users/${id}`);
  return data.data!;
}

export async function createUser(input: CreateUserInput): Promise<UserListItem> {
  const { data } = await apiClient.post<ApiResponse<UserListItem>>('/users', input);
  return data.data!;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserListItem> {
  const { data } = await apiClient.patch<ApiResponse<UserListItem>>(`/users/${id}`, input);
  return data.data!;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function resendInvitation(id: string): Promise<void> {
  await apiClient.post(`/users/${id}/resend-invitation`);
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<UserListItem> {
  const { data } = await apiClient.patch<ApiResponse<UserListItem>>(`/users/${id}`, {
    isActive,
  });
  return data.data!;
}
