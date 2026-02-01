import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as cabinetsApi from '@/lib/api/cabinets';
import { getApiErrorMessage } from '@/lib/utils/error';
import type { UpdateCabinetInput } from '@/lib/types';

export function useCabinet() {
  return useQuery({
    queryKey: ['cabinet'],
    queryFn: cabinetsApi.getCabinet,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCabinetStats() {
  return useQuery({
    queryKey: ['cabinet', 'stats'],
    queryFn: cabinetsApi.getCabinetStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useUpdateCabinet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCabinetInput) => cabinetsApi.updateCabinet(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet'] });
      toast.success('Cabinet mis à jour');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise à jour du cabinet'));
    },
  });
}
