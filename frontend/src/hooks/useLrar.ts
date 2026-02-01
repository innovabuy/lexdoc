import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as lrarApi from '@/lib/api/lrar';
import { getApiErrorMessage } from '@/lib/utils/error';
import type { LrarFilters, CreateLrarInput } from '@/lib/types';

export function useLrarShipments(filters?: LrarFilters) {
  return useQuery({
    queryKey: ['lrar', filters],
    queryFn: () => lrarApi.getLrarShipments(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useLrarShipment(id: string) {
  return useQuery({
    queryKey: ['lrar', id],
    queryFn: () => lrarApi.getLrarShipment(id),
    enabled: !!id,
    // Polling for status updates
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'DELIVERED' || data?.status === 'RETURNED' || data?.status === 'CANCELLED') {
        return false;
      }
      return 30000; // Poll every 30 seconds if not completed
    },
  });
}

export function useCreateLrar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLrarInput) => lrarApi.createLrar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lrar'] });
      toast.success('Envoi LRAR cree avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation de l\'envoi LRAR'));
    },
  });
}

export function useCancelLrar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lrarApi.cancelLrar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['lrar'] });
      queryClient.invalidateQueries({ queryKey: ['lrar', id] });
      toast.success('Envoi LRAR annule');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'annulation'));
    },
  });
}

export function useDownloadProof() {
  return useMutation({
    mutationFn: (id: string) => lrarApi.downloadProof(id),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `accuse_reception_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du telechargement de l\'AR'));
    },
  });
}
