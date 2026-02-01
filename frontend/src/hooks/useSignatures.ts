import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as signaturesApi from '@/lib/api/signatures';
import { getApiErrorMessage } from '@/lib/utils/error';
import type { SignatureFilters, CreateSignatureInput } from '@/lib/types';

export function useSignatures(filters?: SignatureFilters) {
  return useQuery({
    queryKey: ['signatures', filters],
    queryFn: () => signaturesApi.getSignatures(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSignature(id: string) {
  return useQuery({
    queryKey: ['signature', id],
    queryFn: () => signaturesApi.getSignature(id),
    enabled: !!id,
    // Polling for status updates
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'COMPLETED' || data?.status === 'CANCELLED' || data?.status === 'EXPIRED') {
        return false;
      }
      return 10000; // Poll every 10 seconds if not completed
    },
  });
}

export function useCreateSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSignatureInput) => signaturesApi.createSignature(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] });
      toast.success('Demande de signature envoyee');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation de la signature'));
    },
  });
}

export function useCancelSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => signaturesApi.cancelSignature(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] });
      queryClient.invalidateQueries({ queryKey: ['signature', id] });
      toast.success('Signature annulee');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'annulation'));
    },
  });
}

export function useRemindSigner() {
  return useMutation({
    mutationFn: ({ id, signerEmail }: { id: string; signerEmail: string }) =>
      signaturesApi.remindSigner(id, signerEmail),
    onSuccess: () => {
      toast.success('Rappel envoye');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'envoi du rappel'));
    },
  });
}

export function useDownloadSignedDocument() {
  return useMutation({
    mutationFn: (id: string) => signaturesApi.downloadSignedDocument(id),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document_signe_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du telechargement'));
    },
  });
}

export function useDownloadCertificates() {
  return useMutation({
    mutationFn: (id: string) => signaturesApi.downloadCertificates(id),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificats_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du telechargement'));
    },
  });
}
