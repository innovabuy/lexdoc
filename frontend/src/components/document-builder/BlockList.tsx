import React, { useState, ChangeEvent } from 'react';
import { Search, Plus, Filter, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { BlockCard } from './BlockCard';
import { BlockModal } from './BlockModal';
import { BlockFormModal } from './BlockFormModal';
import {
  useDocumentBlocks,
  useBlockCategories,
  useDeleteDocumentBlock,
  useDuplicateDocumentBlock,
} from '@/hooks/useDocumentBuilder';
import type { DocumentBlock, DocumentBlockFilters, BlockCategory } from '@/lib/types/documentBuilder';
import { BLOCK_CATEGORY_LABELS } from '@/lib/types/documentBuilder';

export const BlockList: React.FC = () => {
  const [filters, setFilters] = useState<DocumentBlockFilters>({
    page: 1,
    limit: 20,
    sortBy: 'displayOrder',
    sortOrder: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewBlock, setViewBlock] = useState<DocumentBlock | null>(null);
  const [editBlock, setEditBlock] = useState<DocumentBlock | null>(null);
  const [deleteBlock, setDeleteBlock] = useState<DocumentBlock | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, error } = useDocumentBlocks(filters);
  const { data: categories } = useBlockCategories();
  const deleteBlockMutation = useDeleteDocumentBlock();
  const duplicateBlockMutation = useDuplicateDocumentBlock();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: category ? (category as BlockCategory) : undefined,
      page: 1,
    }));
  };

  const handleSystemBlockFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      isSystemBlock: value === '' ? undefined : value === 'true',
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    });
    setSearchInput('');
  };

  const handleDelete = async () => {
    if (!deleteBlock) return;
    await deleteBlockMutation.mutateAsync(deleteBlock.id);
    setDeleteBlock(null);
  };

  const handleDuplicate = async (block: DocumentBlock) => {
    await duplicateBlockMutation.mutateAsync(block.id);
  };

  const hasActiveFilters = filters.category || filters.isSystemBlock !== undefined || filters.search;

  if (isLoading) {
    return <LoadingState message="Chargement des blocs..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement des blocs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un bloc..."
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
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                {[filters.category, filters.isSystemBlock !== undefined, filters.search].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bloc
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Categorie"
              value={filters.category || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleCategoryChange(e.target.value)}
              options={[
                { value: '', label: 'Toutes les categories' },
                ...Object.entries(BLOCK_CATEGORY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Select
              label="Type de bloc"
              value={filters.isSystemBlock === undefined ? '' : String(filters.isSystemBlock)}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSystemBlockFilter(e.target.value)}
              options={[
                { value: '', label: 'Tous les blocs' },
                { value: 'true', label: 'Blocs systeme' },
                { value: 'false', label: 'Mes blocs' },
              ]}
            />
            <Select
              label="Trier par"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [
                  DocumentBlockFilters['sortBy'],
                  'asc' | 'desc'
                ];
                setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
              }}
              options={[
                { value: 'displayOrder-asc', label: 'Ordre d\'affichage' },
                { value: 'title-asc', label: 'Titre (A-Z)' },
                { value: 'title-desc', label: 'Titre (Z-A)' },
                { value: 'createdAt-desc', label: 'Plus recent' },
                { value: 'usageCount-desc', label: 'Plus utilise' },
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
          title="Aucun bloc trouve"
          description={
            hasActiveFilters
              ? 'Aucun bloc ne correspond a vos criteres de recherche.'
              : 'Creez votre premier bloc de contenu pour commencer.'
          }
          action={
            hasActiveFilters
              ? { label: 'Effacer les filtres', onClick: clearFilters }
              : { label: 'Creer un bloc', onClick: () => setShowCreateModal(true) }
          }
        />
      ) : (
        <>
          {/* Category tabs */}
          {categories && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  !filters.category
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tous ({data?.pagination.total || 0})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => handleCategoryChange(cat.category)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    filters.category === cat.category
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {BLOCK_CATEGORY_LABELS[cat.category]} ({cat.count})
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onView={setViewBlock}
                onEdit={setEditBlock}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteBlock}
              />
            ))}
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

      {/* Modals */}
      <BlockModal
        block={viewBlock}
        onClose={() => setViewBlock(null)}
      />

      <BlockFormModal
        block={editBlock}
        isOpen={showCreateModal || !!editBlock}
        onClose={() => {
          setShowCreateModal(false);
          setEditBlock(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteBlock}
        onClose={() => setDeleteBlock(null)}
        onConfirm={handleDelete}
        title="Supprimer le bloc"
        message={`Etes-vous sur de vouloir supprimer le bloc "${deleteBlock?.title}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteBlockMutation.isPending}
      />
    </div>
  );
};
