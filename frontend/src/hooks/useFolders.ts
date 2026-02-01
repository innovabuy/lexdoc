import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFolders,
  getFolderTree,
  getFolder,
  getFolderBreadcrumb,
  createFolder,
  updateFolder,
  moveFolder,
  deleteFolder,
} from '@/lib/api/folders';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  FolderFilters,
} from '@/lib/types';

const FOLDERS_KEY = 'folders';
const FOLDER_TREE_KEY = 'folder-tree';

// Query hooks
export function useFolders(filters?: FolderFilters) {
  return useQuery({
    queryKey: [FOLDERS_KEY, filters],
    queryFn: () => getFolders(filters),
  });
}

export function useFolderTree(depth: number = 3) {
  return useQuery({
    queryKey: [FOLDER_TREE_KEY, depth],
    queryFn: () => getFolderTree(depth),
  });
}

export function useFolder(id: string | undefined) {
  return useQuery({
    queryKey: [FOLDERS_KEY, id],
    queryFn: () => getFolder(id!),
    enabled: !!id,
  });
}

export function useFolderBreadcrumb(id: string | undefined) {
  return useQuery({
    queryKey: [FOLDERS_KEY, id, 'breadcrumb'],
    queryFn: () => getFolderBreadcrumb(id!),
    enabled: !!id,
  });
}

// Mutation hooks
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFolderInput) => createFolder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FOLDER_TREE_KEY] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFolderInput }) =>
      updateFolder(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FOLDER_TREE_KEY] });
      queryClient.setQueryData([FOLDERS_KEY, data.id], data);
    },
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveFolderInput }) =>
      moveFolder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FOLDER_TREE_KEY] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FOLDER_TREE_KEY] });
    },
  });
}
