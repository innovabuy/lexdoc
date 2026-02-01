import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as templatesApi from '@/lib/api/templates';
import { getApiErrorMessage } from '@/lib/utils/error';
import type {
  TemplateFilters,
  CreateTemplateInput,
  UpdateTemplateInput,
  GenerateDocumentInput,
} from '@/lib/types';

export function useTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: () => templatesApi.getTemplates(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.getTemplate(id),
    enabled: !!id,
  });
}

export function useTemplateVariables(id: string) {
  return useQuery({
    queryKey: ['template-variables', id],
    queryFn: () => templatesApi.getTemplateVariables(id),
    enabled: !!id,
  });
}

export function useTemplateCategories() {
  return useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templatesApi.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTemplateInput) => templatesApi.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Modele cree avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation du modele'));
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateInput }) =>
      templatesApi.updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      toast.success('Modele mis a jour');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise a jour du modele'));
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templatesApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Modele supprime');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression du modele'));
    },
  });
}

export function useGenerateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, input }: { templateId: string; input: GenerateDocumentInput }) =>
      templatesApi.generateDocument(templateId, input),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document genere avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la generation du document'));
    },
  });
}

export function useDownloadPreview() {
  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data?: Record<string, unknown>;
    }) => templatesApi.downloadPreview(templateId, data),
    onSuccess: (blob, { templateId }) => {
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `preview-${templateId}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du telechargement de la preview'));
    },
  });
}
