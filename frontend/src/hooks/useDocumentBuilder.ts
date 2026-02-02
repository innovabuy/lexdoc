import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as documentBuilderApi from '@/lib/api/documentBuilder';
import { getApiErrorMessage } from '@/lib/utils/error';
import type {
  DocumentBlockFilters,
  CreateDocumentBlockInput,
  UpdateDocumentBlockInput,
  BuilderTemplateFilters,
  CreateBuilderTemplateInput,
  UpdateBuilderTemplateInput,
  GeneratedDocumentFilters,
  CreateGeneratedDocumentInput,
  UpdateGeneratedDocumentInput,
  FinalizeDocumentInput,
} from '@/lib/types/documentBuilder';
import type { SendSignatureInput, SendLrarInput } from '@/lib/api/documentBuilder';

// ============================================
// DOCUMENT BLOCKS HOOKS
// ============================================

export function useDocumentBlocks(filters?: DocumentBlockFilters) {
  return useQuery({
    queryKey: ['document-blocks', filters],
    queryFn: () => documentBuilderApi.getDocumentBlocks(filters),
    staleTime: 30 * 1000,
  });
}

export function useDocumentBlock(id: string | undefined) {
  return useQuery({
    queryKey: ['document-blocks', id],
    queryFn: () => documentBuilderApi.getDocumentBlock(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useBlockCategories() {
  return useQuery({
    queryKey: ['document-blocks', 'categories'],
    queryFn: () => documentBuilderApi.getBlockCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlockTags() {
  return useQuery({
    queryKey: ['document-blocks', 'tags'],
    queryFn: () => documentBuilderApi.getBlockTags(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDocumentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentBlockInput) => documentBuilderApi.createDocumentBlock(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-blocks'] });
      toast.success('Bloc cree avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation du bloc'));
    },
  });
}

export function useUpdateDocumentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDocumentBlockInput }) =>
      documentBuilderApi.updateDocumentBlock(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-blocks'] });
      toast.success('Bloc mis a jour avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise a jour du bloc'));
    },
  });
}

export function useDeleteDocumentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.deleteDocumentBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-blocks'] });
      toast.success('Bloc supprime avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression du bloc'));
    },
  });
}

export function useDuplicateDocumentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.duplicateDocumentBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-blocks'] });
      toast.success('Bloc duplique avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la duplication du bloc'));
    },
  });
}

export function useExtractVariables() {
  return useMutation({
    mutationFn: (content: string) => documentBuilderApi.extractVariables(content),
  });
}

// ============================================
// BUILDER TEMPLATES HOOKS
// ============================================

export function useBuilderTemplates(filters?: BuilderTemplateFilters) {
  return useQuery({
    queryKey: ['builder-templates', filters],
    queryFn: () => documentBuilderApi.getBuilderTemplates(filters),
    staleTime: 30 * 1000,
  });
}

export function useBuilderTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['builder-templates', id],
    queryFn: () => documentBuilderApi.getBuilderTemplate(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useBuilderTemplateVariables(id: string | undefined) {
  return useQuery({
    queryKey: ['builder-templates', id, 'variables'],
    queryFn: () => documentBuilderApi.getTemplateVariables(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['builder-templates', 'document-types'],
    queryFn: () => documentBuilderApi.getDocumentTypes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useJuridictions() {
  return useQuery({
    queryKey: ['builder-templates', 'juridictions'],
    queryFn: () => documentBuilderApi.getJuridictions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBuilderTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBuilderTemplateInput) => documentBuilderApi.createBuilderTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-templates'] });
      toast.success('Modele cree avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation du modele'));
    },
  });
}

export function useUpdateBuilderTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBuilderTemplateInput }) =>
      documentBuilderApi.updateBuilderTemplate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-templates'] });
      toast.success('Modele mis a jour avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise a jour du modele'));
    },
  });
}

export function useDeleteBuilderTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.deleteBuilderTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-templates'] });
      toast.success('Modele supprime avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression du modele'));
    },
  });
}

export function useDuplicateBuilderTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.duplicateBuilderTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-templates'] });
      toast.success('Modele duplique avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la duplication du modele'));
    },
  });
}

export function usePreviewBuilderTemplate() {
  return useMutation({
    mutationFn: ({ id, variables }: { id: string; variables: Record<string, any> }) =>
      documentBuilderApi.previewBuilderTemplate(id, variables),
  });
}

// ============================================
// TEMPLATE TREE STRUCTURE HOOKS
// ============================================

export function useTemplateTreeStructure(includeEmpty: boolean = false) {
  return useQuery({
    queryKey: ['builder-templates', 'tree', { includeEmpty }],
    queryFn: () => documentBuilderApi.getTemplateTreeStructure(includeEmpty),
    staleTime: 60 * 1000,
  });
}

export function useFavoriteTemplates(limit: number = 10) {
  return useQuery({
    queryKey: ['builder-templates', 'favorites', { limit }],
    queryFn: () => documentBuilderApi.getFavoriteTemplates(limit),
    staleTime: 30 * 1000,
  });
}

export function useRecentTemplates(limit: number = 10) {
  return useQuery({
    queryKey: ['builder-templates', 'recent', { limit }],
    queryFn: () => documentBuilderApi.getRecentTemplates(limit),
    staleTime: 30 * 1000,
  });
}

export function useToggleTemplateFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.toggleTemplateFavorite(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['builder-templates'] });
      toast.success(result.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la modification des favoris'));
    },
  });
}

export function useRecordTemplateUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.recordTemplateUsage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-templates', 'recent'] });
    },
  });
}

export function useBuilderTemplateCategories() {
  return useQuery({
    queryKey: ['builder-templates', 'categories'],
    queryFn: () => documentBuilderApi.getTemplateCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemplateTags() {
  return useQuery({
    queryKey: ['builder-templates', 'tags'],
    queryFn: () => documentBuilderApi.getTemplateTags(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDerivedTemplates(id: string | undefined) {
  return useQuery({
    queryKey: ['builder-templates', id, 'derived'],
    queryFn: () => documentBuilderApi.getDerivedTemplates(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// ============================================
// GENERATED DOCUMENTS HOOKS
// ============================================

export function useGeneratedDocuments(filters?: GeneratedDocumentFilters) {
  return useQuery({
    queryKey: ['generated-documents', filters],
    queryFn: () => documentBuilderApi.getGeneratedDocuments(filters),
    staleTime: 30 * 1000,
  });
}

export function useGeneratedDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['generated-documents', id],
    queryFn: () => documentBuilderApi.getGeneratedDocument(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useGeneratedDocumentPreview(id: string | undefined) {
  return useQuery({
    queryKey: ['generated-documents', id, 'preview'],
    queryFn: () => documentBuilderApi.getGeneratedDocumentPreview(id!),
    enabled: !!id,
    staleTime: 10 * 1000,
  });
}

export function useGeneratedDocumentStats() {
  return useQuery({
    queryKey: ['generated-documents', 'stats'],
    queryFn: () => documentBuilderApi.getGeneratedDocumentStats(),
    staleTime: 60 * 1000,
  });
}

export function useCreateGeneratedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGeneratedDocumentInput) => documentBuilderApi.createGeneratedDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      toast.success('Document cree avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation du document'));
    },
  });
}

export function useUpdateGeneratedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGeneratedDocumentInput }) =>
      documentBuilderApi.updateGeneratedDocument(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      toast.success('Document mis a jour avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise a jour du document'));
    },
  });
}

export function useFinalizeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: FinalizeDocumentInput }) =>
      documentBuilderApi.finalizeGeneratedDocument(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      toast.success('Document finalise avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la finalisation du document'));
    },
  });
}

export function useRegenerateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.regenerateDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      toast.success('Document regenere avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la regeneration du document'));
    },
  });
}

export function useDeleteGeneratedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.deleteGeneratedDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      toast.success('Document supprime avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression du document'));
    },
  });
}

export function useDuplicateGeneratedDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentBuilderApi.duplicateGeneratedDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      toast.success('Document duplique avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la duplication du document'));
    },
  });
}

// ============================================
// SIGNATURE HOOKS
// ============================================

export function useSendDocumentForSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SendSignatureInput }) =>
      documentBuilderApi.sendDocumentForSignature(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      queryClient.invalidateQueries({ queryKey: ['generated-documents', variables.id] });
      toast.success('Document envoye en signature avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'envoi en signature'));
    },
  });
}

export function useDocumentSignatureStatus(id: string | undefined) {
  return useQuery({
    queryKey: ['generated-documents', id, 'signature-status'],
    queryFn: () => documentBuilderApi.getDocumentSignatureStatus(id!),
    enabled: !!id,
    staleTime: 10 * 1000, // Refresh every 10 seconds for status updates
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// ============================================
// LRAR HOOKS
// ============================================

export function useSendDocumentAsLrar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SendLrarInput }) =>
      documentBuilderApi.sendDocumentAsLrar(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      queryClient.invalidateQueries({ queryKey: ['generated-documents', variables.id] });
      toast.success('Document envoye en LRAR avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'envoi LRAR'));
    },
  });
}

export function useLrarTrackingStatus(id: string | undefined) {
  return useQuery({
    queryKey: ['generated-documents', id, 'lrar-tracking'],
    queryFn: () => documentBuilderApi.getLrarTrackingStatus(id!),
    enabled: !!id,
    staleTime: 30 * 1000, // Refresh every 30 seconds for status updates
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}
