import apiClient from './client';
import type {
  Folder,
  FolderTreeNode,
  BreadcrumbItem,
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  FolderFilters,
} from '@/lib/types';
import type { ApiResponse } from '@/lib/types';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedFolders {
  data: Folder[];
  pagination: Pagination;
}

interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export async function getFolders(filters?: FolderFilters): Promise<PaginatedFolders> {
  const params = new URLSearchParams();

  if (filters?.parentId !== undefined) {
    params.append('parentId', filters.parentId === null ? 'null' : filters.parentId);
  }
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const { data } = await apiClient.get<PaginatedApiResponse<Folder>>(
    `/folders?${params.toString()}`
  );
  return { data: data.data!, pagination: data.pagination };
}

export async function getFolderTree(depth: number = 3): Promise<FolderTreeNode[]> {
  const { data } = await apiClient.get<ApiResponse<FolderTreeNode[]>>(
    `/folders/tree?depth=${depth}`
  );
  return data.data!;
}

export async function getFolder(id: string): Promise<Folder> {
  const { data } = await apiClient.get<ApiResponse<Folder>>(`/folders/${id}`);
  return data.data!;
}

export async function getFolderBreadcrumb(id: string): Promise<BreadcrumbItem[]> {
  const { data } = await apiClient.get<ApiResponse<BreadcrumbItem[]>>(
    `/folders/${id}/breadcrumb`
  );
  return data.data!;
}

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const { data } = await apiClient.post<ApiResponse<Folder>>('/folders', input);
  return data.data!;
}

export async function updateFolder(id: string, input: UpdateFolderInput): Promise<Folder> {
  const { data } = await apiClient.patch<ApiResponse<Folder>>(`/folders/${id}`, input);
  return data.data!;
}

export async function moveFolder(id: string, input: MoveFolderInput): Promise<Folder> {
  const { data } = await apiClient.patch<ApiResponse<Folder>>(`/folders/${id}/move`, input);
  return data.data!;
}

export async function deleteFolder(id: string): Promise<void> {
  await apiClient.delete(`/folders/${id}`);
}
