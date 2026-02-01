import { apiClient } from './client';
import type {
  DocumentBlock,
  DocumentBlockFilters,
  CreateDocumentBlockInput,
  UpdateDocumentBlockInput,
  ExtractVariablesResult,
  CategoryCount,
  TagCount,
  BuilderTemplate,
  BuilderTemplateFilters,
  CreateBuilderTemplateInput,
  UpdateBuilderTemplateInput,
  DocumentTypeCount,
  JuridictionCount,
  PreviewResult,
  BlockVariable,
  GeneratedDocument,
  GeneratedDocumentFilters,
  CreateGeneratedDocumentInput,
  UpdateGeneratedDocumentInput,
  FinalizeDocumentInput,
  GeneratedDocumentPreview,
  GeneratedDocumentStats,
} from '../types/documentBuilder';
import type { PaginatedResponse } from '../types/api';

// ============================================
// DOCUMENT BLOCKS API
// ============================================

export async function getDocumentBlocks(
  filters?: DocumentBlockFilters
): Promise<PaginatedResponse<DocumentBlock>> {
  const params = new URLSearchParams();

  if (filters?.category) params.append('category', filters.category);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.isSystemBlock !== undefined) params.append('isSystemBlock', String(filters.isSystemBlock));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const { data } = await apiClient.get<{ success: boolean; data: DocumentBlock[]; pagination: any }>(
    `/document-blocks?${params.toString()}`
  );

  return {
    data: data.data,
    pagination: data.pagination,
  };
}

export async function getDocumentBlock(id: string): Promise<DocumentBlock> {
  const { data } = await apiClient.get<{ success: boolean; data: DocumentBlock }>(
    `/document-blocks/${id}`
  );
  return data.data;
}

export async function createDocumentBlock(input: CreateDocumentBlockInput): Promise<DocumentBlock> {
  const { data } = await apiClient.post<{ success: boolean; data: DocumentBlock }>(
    '/document-blocks',
    input
  );
  return data.data;
}

export async function updateDocumentBlock(
  id: string,
  input: UpdateDocumentBlockInput
): Promise<DocumentBlock> {
  const { data } = await apiClient.put<{ success: boolean; data: DocumentBlock }>(
    `/document-blocks/${id}`,
    input
  );
  return data.data;
}

export async function deleteDocumentBlock(id: string): Promise<void> {
  await apiClient.delete(`/document-blocks/${id}`);
}

export async function duplicateDocumentBlock(id: string): Promise<DocumentBlock> {
  const { data } = await apiClient.post<{ success: boolean; data: DocumentBlock }>(
    `/document-blocks/${id}/duplicate`
  );
  return data.data;
}

export async function getBlockCategories(): Promise<CategoryCount[]> {
  const { data } = await apiClient.get<{ success: boolean; data: CategoryCount[] }>(
    '/document-blocks/categories'
  );
  return data.data;
}

export async function getBlockTags(): Promise<TagCount[]> {
  const { data } = await apiClient.get<{ success: boolean; data: TagCount[] }>(
    '/document-blocks/tags'
  );
  return data.data;
}

export async function extractVariables(content: string): Promise<ExtractVariablesResult> {
  const { data } = await apiClient.post<{ success: boolean; data: ExtractVariablesResult }>(
    '/document-blocks/extract-variables',
    { content }
  );
  return data.data;
}

// ============================================
// BUILDER TEMPLATES API
// ============================================

export async function getBuilderTemplates(
  filters?: BuilderTemplateFilters
): Promise<PaginatedResponse<BuilderTemplate>> {
  const params = new URLSearchParams();

  if (filters?.documentType) params.append('documentType', filters.documentType);
  if (filters?.juridiction) params.append('juridiction', filters.juridiction);
  if (filters?.isSystemTemplate !== undefined) params.append('isSystemTemplate', String(filters.isSystemTemplate));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const { data } = await apiClient.get<{ success: boolean; data: BuilderTemplate[]; pagination: any }>(
    `/builder-templates?${params.toString()}`
  );

  return {
    data: data.data,
    pagination: data.pagination,
  };
}

export async function getBuilderTemplate(id: string): Promise<BuilderTemplate> {
  const { data } = await apiClient.get<{ success: boolean; data: BuilderTemplate }>(
    `/builder-templates/${id}`
  );
  return data.data;
}

export async function getTemplateVariables(id: string): Promise<BlockVariable[]> {
  const { data } = await apiClient.get<{ success: boolean; data: BlockVariable[] }>(
    `/builder-templates/${id}/variables`
  );
  return data.data;
}

export async function createBuilderTemplate(input: CreateBuilderTemplateInput): Promise<BuilderTemplate> {
  const { data } = await apiClient.post<{ success: boolean; data: BuilderTemplate }>(
    '/builder-templates',
    input
  );
  return data.data;
}

export async function updateBuilderTemplate(
  id: string,
  input: UpdateBuilderTemplateInput
): Promise<BuilderTemplate> {
  const { data } = await apiClient.put<{ success: boolean; data: BuilderTemplate }>(
    `/builder-templates/${id}`,
    input
  );
  return data.data;
}

export async function deleteBuilderTemplate(id: string): Promise<void> {
  await apiClient.delete(`/builder-templates/${id}`);
}

export async function duplicateBuilderTemplate(id: string): Promise<BuilderTemplate> {
  const { data } = await apiClient.post<{ success: boolean; data: BuilderTemplate }>(
    `/builder-templates/${id}/duplicate`
  );
  return data.data;
}

export async function previewBuilderTemplate(
  id: string,
  variables: Record<string, any>
): Promise<PreviewResult> {
  const { data } = await apiClient.post<{ success: boolean; data: PreviewResult }>(
    `/builder-templates/${id}/preview`,
    { variables }
  );
  return data.data;
}

export async function getDocumentTypes(): Promise<DocumentTypeCount[]> {
  const { data } = await apiClient.get<{ success: boolean; data: DocumentTypeCount[] }>(
    '/builder-templates/document-types'
  );
  return data.data;
}

export async function getJuridictions(): Promise<JuridictionCount[]> {
  const { data } = await apiClient.get<{ success: boolean; data: JuridictionCount[] }>(
    '/builder-templates/juridictions'
  );
  return data.data;
}

// ============================================
// GENERATED DOCUMENTS API
// ============================================

export async function getGeneratedDocuments(
  filters?: GeneratedDocumentFilters
): Promise<PaginatedResponse<GeneratedDocument>> {
  const params = new URLSearchParams();

  if (filters?.folderId) params.append('folderId', filters.folderId);
  if (filters?.affaireId) params.append('affaireId', filters.affaireId);
  if (filters?.templateId) params.append('templateId', filters.templateId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const { data } = await apiClient.get<{ success: boolean; data: GeneratedDocument[]; pagination: any }>(
    `/generated-documents?${params.toString()}`
  );

  return {
    data: data.data,
    pagination: data.pagination,
  };
}

export async function getGeneratedDocument(id: string): Promise<GeneratedDocument> {
  const { data } = await apiClient.get<{ success: boolean; data: GeneratedDocument }>(
    `/generated-documents/${id}`
  );
  return data.data;
}

export async function getGeneratedDocumentPreview(id: string): Promise<GeneratedDocumentPreview> {
  const { data } = await apiClient.get<{ success: boolean; data: GeneratedDocumentPreview }>(
    `/generated-documents/${id}/preview`
  );
  return data.data;
}

export async function getGeneratedDocumentStats(): Promise<GeneratedDocumentStats> {
  const { data } = await apiClient.get<{ success: boolean; data: GeneratedDocumentStats }>(
    '/generated-documents/stats'
  );
  return data.data;
}

export async function createGeneratedDocument(
  input: CreateGeneratedDocumentInput
): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<{ success: boolean; data: GeneratedDocument }>(
    '/generated-documents',
    input
  );
  return data.data;
}

export async function updateGeneratedDocument(
  id: string,
  input: UpdateGeneratedDocumentInput
): Promise<GeneratedDocument> {
  const { data } = await apiClient.put<{ success: boolean; data: GeneratedDocument }>(
    `/generated-documents/${id}`,
    input
  );
  return data.data;
}

export async function finalizeGeneratedDocument(
  id: string,
  input?: FinalizeDocumentInput
): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<{ success: boolean; data: GeneratedDocument }>(
    `/generated-documents/${id}/finalize`,
    input || {}
  );
  return data.data;
}

export async function regenerateDocument(id: string): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<{ success: boolean; data: GeneratedDocument }>(
    `/generated-documents/${id}/regenerate`
  );
  return data.data;
}

export async function deleteGeneratedDocument(id: string): Promise<void> {
  await apiClient.delete(`/generated-documents/${id}`);
}

export async function duplicateGeneratedDocument(id: string): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<{ success: boolean; data: GeneratedDocument }>(
    `/generated-documents/${id}/duplicate`
  );
  return data.data;
}
