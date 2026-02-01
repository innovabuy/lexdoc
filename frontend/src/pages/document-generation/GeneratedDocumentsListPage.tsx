import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useGeneratedDocuments,
  useGeneratedDocumentStats,
  useDeleteGeneratedDocument,
  useDuplicateGeneratedDocument,
} from '@/hooks/useDocumentBuilder';
import { useFolderTree } from '@/hooks/useFolders';
import type { GeneratedDocumentStatus, GeneratedDocumentFilters } from '@/lib/types/documentBuilder';
import { GENERATED_STATUS_LABELS } from '@/lib/types/documentBuilder';

import GeneratedDocumentCard from './components/GeneratedDocumentCard';

type ViewMode = 'grid' | 'list';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'FINALIZED', label: 'Finalise' },
  { value: 'SENT', label: 'Envoye' },
  { value: 'SIGNED', label: 'Signe' },
];

export const GeneratedDocumentsListPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<GeneratedDocumentStatus | ''>('');
  const [folderId, setFolderId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const limit = 12;

  // Filters
  const filters: GeneratedDocumentFilters = {
    search: search || undefined,
    status: status || undefined,
    folderId: folderId || undefined,
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  // Queries
  const { data: documentsData, isLoading, refetch } = useGeneratedDocuments(filters);
  const { data: stats } = useGeneratedDocumentStats();
  const { data: folderTree } = useFolderTree(3);

  // Mutations
  const deleteDocumentMutation = useDeleteGeneratedDocument();
  const duplicateDocumentMutation = useDuplicateGeneratedDocument();

  const documents = documentsData?.data || [];
  const pagination = documentsData?.pagination;

  // Build folder options recursively
  const buildFolderOptions = (
    nodes: typeof folderTree,
    depth = 0
  ): { value: string; label: string }[] => {
    if (!nodes) return [];

    return nodes.flatMap((node) => [
      { value: node.id, label: `${'  '.repeat(depth)}${node.name}` },
      ...buildFolderOptions(node.children || [], depth + 1),
    ]);
  };

  const folderOptions = [
    { value: '', label: 'Tous les dossiers' },
    ...buildFolderOptions(folderTree),
  ];

  // Handlers
  const handleView = (id: string) => {
    navigate(`/document-generation/documents/${id}`);
  };

  const handleDownload = (id: string) => {
    // TODO: Implement download
    console.log('Download document:', id);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateDocumentMutation.mutateAsync(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDocumentMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents generes</h1>
          <p className="text-gray-500 mt-1">
            Gerez vos documents juridiques generes
          </p>
        </div>
        <Button onClick={() => navigate('/document-generation/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.byStatus.map((stat) => (
            <Card key={stat.status} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  stat.status === 'DRAFT' ? 'bg-gray-100' :
                  stat.status === 'FINALIZED' ? 'bg-green-100' :
                  stat.status === 'SENT' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  <FileText className={`h-5 w-5 ${
                    stat.status === 'DRAFT' ? 'text-gray-600' :
                    stat.status === 'FINALIZED' ? 'text-green-600' :
                    stat.status === 'SENT' ? 'text-blue-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-xs text-gray-500">
                    {GENERATED_STATUS_LABELS[stat.status]}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as GeneratedDocumentStatus | '');
                setPage(1);
              }}
              options={STATUS_OPTIONS}
              className="w-40"
            />
            <Select
              value={folderId}
              onChange={(e) => {
                setFolderId(e.target.value);
                setPage(1);
              }}
              options={folderOptions}
              className="w-48"
            />
            <Button variant="ghost" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="border-l border-gray-200 mx-1" />
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(search || status || folderId) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {search && (
              <Badge variant="gray" className="flex items-center gap-1">
                Recherche: {search}
                <button
                  onClick={() => setSearch('')}
                  className="ml-1 hover:text-gray-700"
                >
                  &times;
                </button>
              </Badge>
            )}
            {status && (
              <Badge variant="gray" className="flex items-center gap-1">
                {GENERATED_STATUS_LABELS[status]}
                <button
                  onClick={() => setStatus('')}
                  className="ml-1 hover:text-gray-700"
                >
                  &times;
                </button>
              </Badge>
            )}
            {folderId && (
              <Badge variant="gray" className="flex items-center gap-1">
                Dossier selectionne
                <button
                  onClick={() => setFolderId('')}
                  className="ml-1 hover:text-gray-700"
                >
                  &times;
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('');
                setFolderId('');
                setPage(1);
              }}
            >
              Effacer tout
            </Button>
          </div>
        )}
      </Card>

      {/* Documents List/Grid */}
      {isLoading ? (
        <LoadingState message="Chargement des documents..." />
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun document trouve
          </h3>
          <p className="text-gray-500 mb-6">
            {search || status || folderId
              ? 'Aucun document ne correspond a vos criteres de recherche.'
              : 'Commencez par generer votre premier document juridique.'}
          </p>
          <Button onClick={() => navigate('/document-generation/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Generer un document
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <GeneratedDocumentCard
              key={doc.id}
              document={doc}
              onView={() => handleView(doc.id)}
              onDownload={() => handleDownload(doc.id)}
              onDuplicate={() => handleDuplicate(doc.id)}
              onDelete={() => setDeleteId(doc.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <GeneratedDocumentCard
              key={doc.id}
              document={doc}
              onView={() => handleView(doc.id)}
              onDownload={() => handleDownload(doc.id)}
              onDuplicate={() => handleDuplicate(doc.id)}
              onDelete={() => setDeleteId(doc.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Precedent
          </Button>
          <span className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        message="Etes-vous sur de vouloir supprimer ce document ? Cette action est irreversible."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteDocumentMutation.isPending}
      />
    </div>
  );
};

export default GeneratedDocumentsListPage;
