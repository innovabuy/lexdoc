import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as clientsApi from '@/lib/api/clients';
import { getApiErrorMessage } from '@/lib/utils/error';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ClientsQuery,
} from '@/lib/api/clients';

/**
 * List clients with filters
 */
export function useClients(query?: ClientsQuery) {
  return useQuery({
    queryKey: ['clients', query],
    queryFn: () => clientsApi.listClients(query),
    staleTime: 30 * 1000,
  });
}

/**
 * Search clients for autocomplete
 */
export function useSearchClients(searchQuery: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['clients', 'search', searchQuery],
    queryFn: () => clientsApi.searchClients(searchQuery),
    enabled: options?.enabled ?? searchQuery.length >= 2,
    staleTime: 10 * 1000,
  });
}

/**
 * Get a single client by ID
 */
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getClient(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => clientsApi.createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client cree avec succes');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la creation du client'));
    },
  });
}

/**
 * Update a client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) =>
      clientsApi.updateClient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client mis a jour');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise a jour'));
    },
  });
}

/**
 * Delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprime');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression'));
    },
  });
}

export type { Client, CreateClientInput, UpdateClientInput, ClientsQuery };
