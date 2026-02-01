import apiClient from './client';
import type {
  Template,
  TemplateListItem,
  TemplateVariable,
  TemplateFilters,
  CreateTemplateInput,
  UpdateTemplateInput,
  GenerateDocumentInput,
  GeneratedDocument,
  CategoryOption,
} from '@/lib/types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';

export async function getTemplates(
  filters?: TemplateFilters
): Promise<PaginatedResponse<TemplateListItem>['data']> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const { data } = await apiClient.get<PaginatedResponse<TemplateListItem>>(
    `/templates?${params.toString()}`
  );
  return data.data!;
}

export async function getTemplate(id: string): Promise<Template> {
  const { data } = await apiClient.get<ApiResponse<Template>>(`/templates/${id}`);
  return data.data!;
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('name', input.name);
  if (input.description) formData.append('description', input.description);
  if (input.category) formData.append('category', input.category);

  const { data } = await apiClient.post<ApiResponse<Template>>('/templates', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data.data!;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput): Promise<Template> {
  const { data } = await apiClient.patch<ApiResponse<Template>>(`/templates/${id}`, input);
  return data.data!;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/templates/${id}`);
}

export async function getTemplateVariables(id: string): Promise<TemplateVariable[]> {
  const { data } = await apiClient.get<ApiResponse<TemplateVariable[]>>(
    `/templates/${id}/variables`
  );
  return data.data!;
}

export async function generateDocument(
  templateId: string,
  input: GenerateDocumentInput
): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<ApiResponse<GeneratedDocument>>(
    `/templates/${templateId}/generate`,
    input
  );
  return data.data!;
}

export async function downloadPreview(
  templateId: string,
  previewData?: Record<string, unknown>
): Promise<Blob> {
  const { data } = await apiClient.post<Blob>(
    `/templates/${templateId}/preview`,
    { data: previewData },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export async function getCategories(): Promise<CategoryOption[]> {
  const { data } = await apiClient.get<ApiResponse<CategoryOption[]>>('/templates/categories');
  return data.data!;
}
