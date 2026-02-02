import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as freeNotesApi from '@/lib/api/freeNotes';
import { getApiErrorMessage } from '@/lib/utils/error';
import type {
  FreeNote,
  CreateFreeNoteInput,
  UpdateFreeNoteInput,
  ConvertToBlockInput,
} from '@/lib/api/freeNotes';

/**
 * Get all free notes for the cabinet
 */
export function useAllFreeNotes(search?: string) {
  return useQuery({
    queryKey: ['free-notes', 'all', search],
    queryFn: () => freeNotesApi.getAllFreeNotes(search),
    staleTime: 30 * 1000,
  });
}

/**
 * Get free notes for a specific folder
 */
export function useFolderFreeNotes(
  folderId: string | undefined,
  filters?: { linkedCategory?: string; search?: string }
) {
  return useQuery({
    queryKey: ['free-notes', 'folder', folderId, filters],
    queryFn: () => freeNotesApi.getFolderFreeNotes(folderId!, filters),
    enabled: !!folderId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get a single free note by ID
 */
export function useFreeNote(noteId: string | undefined) {
  return useQuery({
    queryKey: ['free-notes', noteId],
    queryFn: () => freeNotesApi.getFreeNote(noteId!),
    enabled: !!noteId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new free note
 */
export function useCreateFreeNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
      input,
    }: {
      folderId: string;
      input: CreateFreeNoteInput;
    }) => freeNotesApi.createFreeNote(folderId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-notes'] });
      toast.success('Note libre créée avec succès');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la création de la note'));
    },
  });
}

/**
 * Update a free note
 */
export function useUpdateFreeNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      input,
    }: {
      noteId: string;
      input: UpdateFreeNoteInput;
    }) => freeNotesApi.updateFreeNote(noteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-notes'] });
      toast.success('Note mise à jour avec succès');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise à jour'));
    },
  });
}

/**
 * Delete a free note
 */
export function useDeleteFreeNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => freeNotesApi.deleteFreeNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-notes'] });
      toast.success('Note supprimée');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression'));
    },
  });
}

/**
 * Convert a free note to a reusable block
 */
export function useConvertToBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      input,
    }: {
      noteId: string;
      input: ConvertToBlockInput;
    }) => freeNotesApi.convertToBlock(noteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-notes'] });
      queryClient.invalidateQueries({ queryKey: ['document-blocks'] });
      toast.success('Note convertie en bloc réutilisable');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la conversion'));
    },
  });
}

export type { FreeNote, CreateFreeNoteInput, UpdateFreeNoteInput, ConvertToBlockInput };
