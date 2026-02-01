import React, { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  X,
  FileText,
  Copy,
  Pencil,
  Trash2,
  Eye,
  Lock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useDocumentBlocks,
  useBlockCategories,
  useBlockTags,
  useDeleteDocumentBlock,
  useDuplicateDocumentBlock,
} from '@/hooks/useDocumentBuilder';
import type { DocumentBlock, DocumentBlockFilters, BlockCategory } from '@/lib/types/documentBuilder';
import { BLOCK_CATEGORY_LABELS } from '@/lib/types/documentBuilder';

// Category color mapping
const CATEGORY_COLORS: Record<BlockCategory, string> = {
  INTRO: 'bg-blue-100 text-blue-800',
  FAITS: 'bg-green-100 text-green-800',
  MOYENS: 'bg-purple-100 text-purple-800',
  DISPOSITIF: 'bg-orange-100 text-orange-800',
  SIGNATURE: 'bg-pink-100 text-pink-800',
  CLAUSE: 'bg-yellow-100 text-yellow-800',
  MENTION_LEGALE: 'bg-gray-100 text-gray-800',
  CUSTOM: 'bg-indigo-100 text-indigo-800',
};

export const DocumentBlocksListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DocumentBlockFilters>({
    page: 1,
    limit: 20,
    sortBy: 'usageCount',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSystemBlocks, setShowSystemBlocks] = useState(true);
  const [deleteBlock, setDeleteBlock] = useState<DocumentBlock | null>(null);

  const { data, isLoading, error } = useDocumentBlocks({
    ...filters,
    isSystemBlock: showSystemBlocks ? undefined : false,
  });
  const { data: categories } = useBlockCategories();
  const { data: tags } = useBlockTags();
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

  const handleTagFilter = (tag: string) => {
    if (!tag) {
      setFilters((prev) => ({ ...prev, tags: undefined, page: 1 }));
    } else {
      setFilters((prev) => ({ ...prev, tags: [tag], page: 1 }));
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [
      DocumentBlockFilters['sortBy'],
      'asc' | 'desc'
    ];
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'usageCount',
      sortOrder: 'desc',
    });
    setSearchInput('');
  };

  const handleDelete = async () => {
    if (!deleteBlock) return;
    await deleteBlockMutation.mutateAsync(deleteBlock.id);
    setDeleteBlock(null);
  };

  const handleDuplicate = async (block: DocumentBlock) => {
    const duplicated = await duplicateBlockMutation.mutateAsync(block.id);
    // Navigate to edit the duplicated block
    navigate(`/document-blocks/${duplicated.id}/edit`);
  };

  const handleEdit = (block: DocumentBlock) => {
    navigate(`/document-blocks/${block.id}/edit`);
  };

  const handleView = (block: DocumentBlock) => {
    navigate(`/document-blocks/${block.id}`);
  };

  const handleCreate = () => {
    navigate('/document-blocks/new');
  };

  const hasActiveFilters = filters.category || filters.tags?.length || filters.search;

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement des blocs</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blocs de documents</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos blocs de contenu réutilisables pour la génération de documents
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bloc
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par titre ou contenu..."
                value={searchInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              Rechercher
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <Select
              value={filters.category || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleCategoryChange(e.target.value)}
              options={[
                { value: '', label: 'Toutes catégories' },
                ...Object.entries(BLOCK_CATEGORY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              className="w-40"
            />

            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'text-primary-600' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                  {[filters.category, filters.tags?.length, filters.search].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {tags && tags.length > 0 && (
                <Select
                  label="Tags"
                  value={filters.tags?.[0] || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleTagFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Tous les tags' },
                    ...tags.map((t) => ({ value: t.tag, label: `${t.tag} (${t.count})` })),
                  ]}
                />
              )}

              <Select
                label="Trier par"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSortChange(e.target.value)}
                options={[
                  { value: 'usageCount-desc', label: 'Plus utilisés' },
                  { value: 'createdAt-desc', label: 'Plus récents' },
                  { value: 'title-asc', label: 'Titre (A-Z)' },
                  { value: 'title-desc', label: 'Titre (Z-A)' },
                  { value: 'displayOrder-asc', label: "Ordre d'affichage" },
                ]}
              />

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSystemBlocks}
                    onChange={(e) => setShowSystemBlocks(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Afficher blocs système</span>
                </label>
              </div>

              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Effacer filtres
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Category Tabs */}
      {categories && categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
              !filters.category
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous ({data?.pagination?.total || 0})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => handleCategoryChange(cat.category)}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                filters.category === cat.category
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {BLOCK_CATEGORY_LABELS[cat.category]} ({cat.count})
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && <LoadingState message="Chargement des blocs..." />}

      {/* Results */}
      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="Aucun bloc trouvé"
          description={
            hasActiveFilters
              ? 'Aucun bloc ne correspond à vos critères de recherche.'
              : 'Créez votre premier bloc de contenu pour commencer.'
          }
          action={
            hasActiveFilters
              ? { label: 'Effacer les filtres', onClick: clearFilters }
              : { label: 'Créer un bloc', onClick: handleCreate }
          }
        />
      )}

      {/* Blocks Grid */}
      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.data.map((block) => (
              <Card key={block.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{block.title}</h3>
                        {block.isSystemBlock && (
                          <span title="Bloc système">
                            <Lock className="h-3.5 w-3.5 text-gray-400" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={CATEGORY_COLORS[block.category]}>
                          {BLOCK_CATEGORY_LABELS[block.category]}
                        </Badge>
                        {block.isMandatory && (
                          <Badge variant="warning">Obligatoire</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {block.tags && block.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {block.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {block.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500">
                        +{block.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span>{block.variables?.length || 0} variables</span>
                  <span>•</span>
                  <span>Utilisé {block.usageCount || 0} fois</span>
                </div>

                {/* Content Preview */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600 line-clamp-2 font-mono">
                  {block.content.substring(0, 150)}
                  {block.content.length > 150 && '...'}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" onClick={() => handleView(block)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  {block.isSystemBlock ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(block)}
                      disabled={duplicateBlockMutation.isPending}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Dupliquer
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(block)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteBlock(block)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasPrevPage}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                Précédent
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
        isOpen={!!deleteBlock}
        onClose={() => setDeleteBlock(null)}
        onConfirm={handleDelete}
        title="Supprimer le bloc"
        message={`Êtes-vous sûr de vouloir supprimer le bloc "${deleteBlock?.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteBlockMutation.isPending}
      />
    </div>
  );
};

export default DocumentBlocksListPage;
