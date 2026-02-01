import apiClient from './client';
import type {
  Document,
  DocumentVersion,
  DocumentFilters,
  DocumentSearchFilters,
  UpdateDocumentInput,
  BulkMoveInput,
  BulkDeleteInput,
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

interface PaginatedDocuments {
  data: Document[];
  pagination: Pagination;
}

interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export async function getDocuments(
  filters?: DocumentFilters
): Promise<PaginatedDocuments> {
  const params = new URLSearchParams();

  if (filters?.folderId) params.append('folderId', filters.folderId);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const { data } = await apiClient.get<PaginatedApiResponse<Document>>(
    `/documents?${params.toString()}`
  );
  return { data: data.data!, pagination: data.pagination };
}

export async function searchDocuments(
  filters?: DocumentSearchFilters
): Promise<PaginatedDocuments> {
  const params = new URLSearchParams();

  if (filters?.query) params.append('query', filters.query);
  if (filters?.type) filters.type.forEach((t) => params.append('type', t));
  if (filters?.folderId) params.append('folderId', filters.folderId);
  if (filters?.createdById) params.append('createdById', filters.createdById);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.minSize) params.append('minSize', String(filters.minSize));
  if (filters?.maxSize) params.append('maxSize', String(filters.maxSize));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const { data } = await apiClient.get<PaginatedApiResponse<Document>>(
    `/documents/search?${params.toString()}`
  );
  return { data: data.data!, pagination: data.pagination };
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
  return data.data!;
}

export async function uploadDocument(
  file: File,
  folderId: string,
  metadata?: {
    name?: string;
    description?: string;
    type?: string;
  },
  onProgress?: (progress: number) => void
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', folderId);
  if (metadata?.name) formData.append('name', metadata.name);
  if (metadata?.description) formData.append('description', metadata.description);
  if (metadata?.type) formData.append('type', metadata.type);

  const { data } = await apiClient.post<ApiResponse<Document>>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return data.data!;
}

export async function uploadMultipleDocuments(
  files: File[],
  folderId: string,
  onProgress?: (fileName: string, progress: number) => void
): Promise<Document[]> {
  const formData = new FormData();
  formData.append('folderId', folderId);
  files.forEach((file) => {
    formData.append('files', file);
  });

  const { data } = await apiClient.post<ApiResponse<Document[]>>(
    '/documents/upload-multiple',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          files.forEach((file) => onProgress(file.name, percent));
        }
      },
    }
  );
  return data.data!;
}

export async function updateDocument(
  id: string,
  input: UpdateDocumentInput
): Promise<Document> {
  const { data } = await apiClient.patch<ApiResponse<Document>>(`/documents/${id}`, input);
  return data.data!;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}

export async function moveDocument(id: string, folderId: string): Promise<Document> {
  const { data } = await apiClient.patch<ApiResponse<Document>>(`/documents/${id}/move`, {
    folderId,
  });
  return data.data!;
}

export async function bulkMoveDocuments(input: BulkMoveInput): Promise<{ moved: number }> {
  const { data } = await apiClient.post<ApiResponse<{ moved: number }>>(
    '/documents/bulk-move',
    input
  );
  return data.data!;
}

export async function bulkDeleteDocuments(
  input: BulkDeleteInput
): Promise<{ deleted: number }> {
  const { data } = await apiClient.post<ApiResponse<{ deleted: number }>>(
    '/documents/bulk-delete',
    input
  );
  return data.data!;
}

export async function duplicateDocument(id: string): Promise<Document> {
  const { data } = await apiClient.post<ApiResponse<Document>>(`/documents/${id}/duplicate`);
  return data.data!;
}

export function getDownloadUrl(id: string): string {
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/documents/${id}/download`;
}

export function getPreviewUrl(id: string): string {
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/documents/${id}/preview`;
}

export async function downloadDocument(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  return data;
}

export async function getDocumentVersions(id: string): Promise<DocumentVersion[]> {
  const { data } = await apiClient.get<ApiResponse<DocumentVersion[]>>(
    `/documents/${id}/versions`
  );
  return data.data!;
}

export async function createDocumentVersion(
  id: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<DocumentVersion> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<ApiResponse<DocumentVersion>>(
    `/documents/${id}/versions`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }
  );
  return data.data!;
}

export async function restoreDocumentVersion(
  documentId: string,
  versionId: string
): Promise<DocumentVersion> {
  const { data } = await apiClient.post<ApiResponse<DocumentVersion>>(
    `/documents/${documentId}/versions/${versionId}/restore`
  );
  return data.data!;
}
