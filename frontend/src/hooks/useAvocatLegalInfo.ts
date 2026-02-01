import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as avocatLegalInfoApi from '@/lib/api/avocatLegalInfo';
import { getApiErrorMessage } from '@/lib/utils/error';
import type {
  CreateAvocatLegalInfoInput,
  UpdateAvocatLegalInfoInput,
} from '@/lib/api/avocatLegalInfo';

// Query keys
const LEGAL_INFO_KEY = ['avocat-legal-info'];

/**
 * Hook to get the current user's legal info
 */
export function useMyLegalInfo() {
  return useQuery({
    queryKey: [...LEGAL_INFO_KEY, 'me'],
    queryFn: () => avocatLegalInfoApi.getMyLegalInfo(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get legal info by ID
 */
export function useLegalInfo(id: string | undefined) {
  return useQuery({
    queryKey: [...LEGAL_INFO_KEY, id],
    queryFn: () => avocatLegalInfoApi.getLegalInfoById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create legal info
 */
export function useCreateLegalInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAvocatLegalInfoInput) => avocatLegalInfoApi.createLegalInfo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEGAL_INFO_KEY });
      toast.success('Profil legal cree avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation du profil legal'));
    },
  });
}

/**
 * Hook to update legal info
 */
export function useUpdateLegalInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAvocatLegalInfoInput }) =>
      avocatLegalInfoApi.updateLegalInfo(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEGAL_INFO_KEY });
      toast.success('Profil legal mis a jour avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise a jour du profil legal'));
    },
  });
}

/**
 * Hook to upload signature
 */
export function useUploadSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      avocatLegalInfoApi.uploadSignature(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEGAL_INFO_KEY });
      toast.success('Signature telechargee avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du telechargement de la signature'));
    },
  });
}

/**
 * Hook to upload cachet
 */
export function useUploadCachet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      avocatLegalInfoApi.uploadCachet(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEGAL_INFO_KEY });
      toast.success('Cachet telecharge avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du telechargement du cachet'));
    },
  });
}

/**
 * Hook to get preview of legal mentions
 */
export function usePreviewMentions(id: string | undefined) {
  return useQuery({
    queryKey: [...LEGAL_INFO_KEY, id, 'preview'],
    queryFn: () => avocatLegalInfoApi.getPreviewMentions(id!),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}
