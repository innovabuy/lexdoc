import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface RgpdRequest {
  id: string;
  type: string;
  status: string;
  requestedByEmail: string;
  requestedByName?: string;
  requestDetails?: { details?: string };
  requestDate: string;
  dueDate: string;
  completedDate?: string;
  processingNotes?: string;
  client?: {
    id: string;
    nom: string;
    prenom?: string;
    email?: string;
  };
  processedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface DashboardStats {
  requests: { pending: number; overdue: number };
  consents: { active: number; revoked: number };
  retention: { tracked: number };
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: "Droit d'acces",
  RECTIFICATION: 'Droit de rectification',
  ERASURE: "Droit a l'effacement",
  PORTABILITY: 'Droit a la portabilite',
  RESTRICTION: 'Droit a la limitation',
  OPPOSITION: "Droit d'opposition",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'En attente', color: 'yellow', icon: Clock },
  VERIFIED: { label: 'Verifie', color: 'blue', icon: CheckCircle },
  PROCESSING: { label: 'En traitement', color: 'purple', icon: RefreshCw },
  COMPLETED: { label: 'Termine', color: 'green', icon: CheckCircle },
  REJECTED: { label: 'Rejete', color: 'red', icon: XCircle },
};

export const RgpdRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<RgpdRequest | null>(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processNotes, setProcessNotes] = useState('');

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['rgpd', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/rgpd/dashboard');
      return response.data.data;
    },
  });

  // Fetch requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['rgpd', 'requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const response = await apiClient.get(`/rgpd/requests?${params.toString()}`);
      return response.data;
    },
  });

  // Process request mutation
  const processMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: string; notes?: string }) => {
      const response = await apiClient.post(`/rgpd/requests/${requestId}/process`, {
        status,
        processingNotes: notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgpd'] });
      toast.success('Demande traitee avec succes');
      setProcessModalOpen(false);
      setSelectedRequest(null);
      setProcessNotes('');
    },
    onError: () => {
      toast.error('Erreur lors du traitement de la demande');
    },
  });

  // Export client data mutation
  const exportMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiClient.get(`/rgpd/clients/${clientId}/export`);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-rgpd-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      toast.success('Donnees exportees');
    },
    onError: () => {
      toast.error("Erreur lors de l'export");
    },
  });

  const getRemainingDays = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  const handleProcess = (request: RgpdRequest, status: 'COMPLETED' | 'REJECTED') => {
    setSelectedRequest(request);
    processMutation.mutate({
      requestId: request.id,
      status,
      notes: processNotes,
    });
  };

  const requests: RgpdRequest[] = requestsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary-600" />
            Conformite RGPD
          </h1>
          <p className="text-gray-500 mt-1">
            Gestion des demandes et consentements
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Demandes en attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.requests.pending || 0}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Demandes en retard</p>
              <p className="text-2xl font-bold text-red-600">
                {stats?.requests.overdue || 0}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Consentements actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.consents.active || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Entites suivies</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.retention.tracked || 0}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <Shield className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="VERIFIED">Verifie</option>
            <option value="PROCESSING">En traitement</option>
            <option value="COMPLETED">Termine</option>
            <option value="REJECTED">Rejete</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          {requests.length} demande(s)
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Demandeur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Delai
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucune demande trouvee
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const statusConfig = STATUS_CONFIG[request.status];
                  const remainingDays = getRemainingDays(request.dueDate);
                  const isOverdue = remainingDays < 0 && request.status !== 'COMPLETED' && request.status !== 'REJECTED';

                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {format(new Date(request.requestDate), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(request.requestDate), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.client
                            ? `${request.client.prenom || ''} ${request.client.nom}`.trim()
                            : request.requestedByName || 'Non identifie'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.requestedByEmail}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="primary">
                          {REQUEST_TYPE_LABELS[request.type] || request.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            statusConfig.color === 'green'
                              ? 'success'
                              : statusConfig.color === 'red'
                              ? 'error'
                              : statusConfig.color === 'yellow'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {request.status === 'COMPLETED' || request.status === 'REJECTED' ? (
                          <span className="text-sm text-gray-500">-</span>
                        ) : (
                          <div
                            className={`text-sm font-medium ${
                              isOverdue ? 'text-red-600' : remainingDays <= 7 ? 'text-amber-600' : 'text-gray-900'
                            }`}
                          >
                            {isOverdue ? (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                {Math.abs(remainingDays)}j en retard
                              </span>
                            ) : (
                              `${remainingDays}j restants`
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(request);
                              setProcessModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.client && request.type === 'PORTABILITY' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => exportMutation.mutate(request.client!.id)}
                              isLoading={exportMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {(request.status === 'VERIFIED' || request.status === 'PROCESSING') && (
                            <Button
                              size="sm"
                              onClick={() => handleProcess(request, 'COMPLETED')}
                              isLoading={processMutation.isPending}
                            >
                              Traiter
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Process Modal */}
      <Modal
        isOpen={processModalOpen}
        onClose={() => {
          setProcessModalOpen(false);
          setSelectedRequest(null);
          setProcessNotes('');
        }}
        title="Traiter la demande RGPD"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Type:</dt>
                  <dd className="font-medium">{REQUEST_TYPE_LABELS[selectedRequest.type]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Demandeur:</dt>
                  <dd className="font-medium">{selectedRequest.requestedByEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Date:</dt>
                  <dd className="font-medium">
                    {format(new Date(selectedRequest.requestDate), 'dd/MM/yyyy HH:mm')}
                  </dd>
                </div>
                {selectedRequest.requestDetails?.details && (
                  <div>
                    <dt className="text-gray-500 mb-1">Details:</dt>
                    <dd className="bg-white p-2 rounded border text-gray-700">
                      {selectedRequest.requestDetails.details}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes de traitement
              </label>
              <textarea
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ajoutez des notes sur le traitement..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleProcess(selectedRequest, 'COMPLETED')}
                isLoading={processMutation.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme traite
              </Button>
              <Button
                variant="danger"
                onClick={() => handleProcess(selectedRequest, 'REJECTED')}
                isLoading={processMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RgpdRequestsPage;
