import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingOverlay } from '@/components/ui';
import { InviteClientModal } from '@/components/clients/InviteClientModal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ClientAccess {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  isActivated: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
  folder?: { id: string; name: string } | null;
  client?: { id: string; nom: string; prenom?: string } | null;
}

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clientAccesses, isLoading } = useQuery({
    queryKey: ['client-accesses'],
    queryFn: async () => {
      const response = await api.get('/client-access');
      return response.data as ClientAccess[];
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (clientAccessId: string) => {
      await api.post(`/client-access/${clientAccessId}/resend-invitation`);
    },
    onSuccess: () => {
      toast.success('Invitation renvoyee');
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi');
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (clientAccessId: string) => {
      await api.delete(`/client-access/${clientAccessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-accesses'] });
      toast.success('Acces revoque');
    },
    onError: () => {
      toast.error('Erreur lors de la revocation');
    },
  });

  const filteredClients = (clientAccesses || []).filter(
    (client) =>
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des clients</h1>
          <p className="text-gray-500 mt-1">
            Gerez les acces a l'extranet client
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Inviter un client
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Client list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Dossier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Derniere connexion
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                      {client.companyName && ` (${client.companyName})`}
                    </p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {client.folder?.name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.isActivated
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {client.isActivated ? 'Actif' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {client.lastLoginAt
                    ? new Date(client.lastLoginAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Jamais'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    {!client.isActivated && (
                      <button
                        onClick={() => resendInviteMutation.mutate(client.id)}
                        disabled={resendInviteMutation.isPending}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Renvoyer
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Revoquer cet acces ?')) {
                          revokeAccessMutation.mutate(client.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Revoquer
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Aucun client trouve
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <InviteClientModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}
