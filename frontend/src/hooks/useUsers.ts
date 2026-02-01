import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as usersApi from '@/lib/api/users';
import { getApiErrorMessage } from '@/lib/utils/error';
import type { UserFilters, CreateUserInput, UpdateUserInput } from '@/lib/types';

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.getUsers(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Erreur lors de la création de l'utilisateur"));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      usersApi.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Utilisateur mis à jour');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Erreur lors de la mise à jour de l'utilisateur"));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Erreur lors de la suppression de l'utilisateur"));
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.toggleUserActive(id, isActive),
    onSuccess: (_, { id, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success(isActive ? 'Utilisateur activé' : 'Utilisateur désactivé');
    },
    onError: () => {
      toast.error("Erreur lors de la modification du statut de l'utilisateur");
    },
  });
}
