import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as documentTrackingApi from '@/lib/api/documentTracking';
import { getApiErrorMessage } from '@/lib/utils/error';
import type {
  DocumentTrackingFilters,
  SendForSignatureInput,
  SendLrarInput,
} from '@/lib/types';

/**
 * Get tracking info for a specific document
 */
export function useDocumentTracking(documentId: string) {
  return useQuery({
    queryKey: ['documentTracking', documentId],
    queryFn: () => documentTrackingApi.getDocumentTracking(documentId),
    enabled: !!documentId,
    staleTime: 30 * 1000, // 30 seconds
    // Poll for updates when document is pending
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (
        data.status === 'SIGNED' ||
        data.status === 'DELIVERED' ||
        data.status === 'FAILED' ||
        data.status === 'DRAFT'
      ) {
        return false;
      }
      return 30000; // Poll every 30 seconds for pending documents
    },
  });
}

/**
 * List all document trackings with optional filters
 */
export function useDocumentTrackings(filters?: DocumentTrackingFilters) {
  return useQuery({
    queryKey: ['documentTrackings', filters],
    queryFn: () => documentTrackingApi.listTrackings(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get tracking statistics
 */
export function useTrackingStats() {
  return useQuery({
    queryKey: ['documentTrackingStats'],
    queryFn: () => documentTrackingApi.getTrackingStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Send document for electronic signature
 */
export function useSendForSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      input,
    }: {
      documentId: string;
      input: SendForSignatureInput;
    }) => documentTrackingApi.sendForSignature(documentId, input),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['documentTracking', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documentTrackings'] });
      queryClient.invalidateQueries({ queryKey: ['documentTrackingStats'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document envoye pour signature');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'envoi pour signature'));
    },
  });
}

/**
 * Send document via LRAR
 */
export function useSendLrar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      input,
    }: {
      documentId: string;
      input: SendLrarInput;
    }) => documentTrackingApi.sendLrar(documentId, input),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['documentTracking', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documentTrackings'] });
      queryClient.invalidateQueries({ queryKey: ['documentTrackingStats'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document envoye en LRAR');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'envoi LRAR'));
    },
  });
}

/**
 * Send manual reminder
 */
export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentTrackingApi.sendReminder(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['documentTracking', documentId] });
      toast.success('Relance envoyee');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'envoi de la relance'));
    },
  });
}

/**
 * Cancel signature request
 */
export function useCancelSignatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentTrackingApi.cancelSignatureRequest(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['documentTracking', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documentTrackings'] });
      queryClient.invalidateQueries({ queryKey: ['documentTrackingStats'] });
      toast.success('Demande de signature annulee');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'annulation'));
    },
  });
}
