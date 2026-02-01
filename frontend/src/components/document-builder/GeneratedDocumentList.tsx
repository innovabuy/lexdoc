import React, { useState, ChangeEvent } from 'react';
import { Search, Filter, X, FileText, Eye, Trash2, Copy, CheckCircle, Clock, Send, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useGeneratedDocuments,
  useDeleteGeneratedDocument,
  useDuplicateGeneratedDocument,
  useGeneratedDocumentStats,
} from '@/hooks/useDocumentBuilder';
import type {
  GeneratedDocument,
  GeneratedDocumentFilters,
  GeneratedDocumentStatus,
} from '@/lib/types/documentBuilder';
import { GENERATED_STATUS_LABELS } from '@/lib/types/documentBuilder';

const STATUS_ICONS: Record<GeneratedDocumentStatus, React.ElementType> = {
  DRAFT: Clock,
  FINALIZED: CheckCircle,
  SENT: Send,
  SIGNED: PenTool,
};

const STATUS_COLORS: Record<GeneratedDocumentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  FINALIZED: 'bg-green-100 text-green-700',
  SENT: 'bg-blue-100 text-blue-700',
  SIGNED: 'bg-purple-100 text-purple-700',
};

export const GeneratedDocumentList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<GeneratedDocumentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDocument, setDeleteDocument] = useState<GeneratedDocument | null>(null);

  const { data, isLoading, error } = useGeneratedDocuments(filters);
  const { data: stats } = useGeneratedDocumentStats();
  const deleteDocumentMutation = useDeleteGeneratedDocument();
  const duplicateDocumentMutation = useDuplicateGeneratedDocument();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status ? (status as GeneratedDocumentStatus) : undefined,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchInput('');
  };

  const handleDelete = async () => {
    if (!deleteDocument) return;
    await deleteDocumentMutation.mutateAsync(deleteDocument.id);
    setDeleteDocument(null);
  };

  const handleDuplicate = async (doc: GeneratedDocument) => {
    await duplicateDocumentMutation.mutateAsync(doc.id);
  };

  const handleView = (doc: GeneratedDocument) => {
    navigate(`/document-builder/documents/${doc.id}`);
  };

  const hasActiveFilters = filters.status || filters.search;

  if (isLoading) {
    return <LoadingState message="Chargement des documents..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement des documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.byStatus.map((stat) => {
            const StatusIcon = STATUS_ICONS[stat.status];
            return (
              <div
                key={stat.status}
                className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors"
                onClick={() => handleStatusChange(stat.status)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${STATUS_COLORS[stat.status]}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                    <p className="text-sm text-gray-500">{GENERATED_STATUS_LABELS[stat.status]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un document..."
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Rechercher
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'text-primary-600' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Statut"
              value={filters.status || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleStatusChange(e.target.value)}
              options={[
                { value: '', label: 'Tous les statuts' },
                ...Object.entries(GENERATED_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Select
              label="Trier par"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [
                  GeneratedDocumentFilters['sortBy'],
                  'asc' | 'desc'
                ];
                setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
              }}
              options={[
                { value: 'createdAt-desc', label: 'Plus recent' },
                { value: 'createdAt-asc', label: 'Plus ancien' },
                { value: 'title-asc', label: 'Titre (A-Z)' },
                { value: 'title-desc', label: 'Titre (Z-A)' },
              ]}
            />
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {data?.data.length === 0 ? (
        <EmptyState
          title="Aucun document genere"
          description={
            hasActiveFilters
              ? 'Aucun document ne correspond a vos criteres de recherche.'
              : 'Commencez par generer un document a partir d\'un modele.'
          }
          action={
            hasActiveFilters
              ? { label: 'Effacer les filtres', onClick: clearFilters }
              : { label: 'Voir les modeles', onClick: () => navigate('/document-builder') }
          }
        />
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modele
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data.map((doc) => {
                  const StatusIcon = STATUS_ICONS[doc.status];
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.title}</p>
                            <p className="text-sm text-gray-500">{doc.folder?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {doc.template ? (
                          <span className="text-sm text-gray-600">
                            {doc.template.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={STATUS_COLORS[doc.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {GENERATED_STATUS_LABELS[doc.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(doc)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(doc)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Dupliquer"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDocument(doc)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasPrevPage}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                Precedent
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {data.pagination.page} sur {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasNextPage}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDocument}
        onClose={() => setDeleteDocument(null)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        message={`Etes-vous sur de vouloir supprimer le document "${deleteDocument?.title}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteDocumentMutation.isPending}
      />
    </div>
  );
};
