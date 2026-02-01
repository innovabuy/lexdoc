import React, { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useBuilderTemplates,
  useDocumentTypes,
  useJuridictions,
  useDeleteBuilderTemplate,
  useDuplicateBuilderTemplate,
} from '@/hooks/useDocumentBuilder';
import type {
  BuilderTemplate,
  BuilderTemplateFilters,
  BuilderDocumentType,
  Juridiction,
} from '@/lib/types/documentBuilder';
import { DOCUMENT_TYPE_LABELS, JURIDICTION_LABELS } from '@/lib/types/documentBuilder';
import TemplateCard from './components/TemplateCard';

export const DocumentTemplatesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<BuilderTemplateFilters>({
    page: 1,
    limit: 20,
    sortBy: 'usageCount',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSystemTemplates, setShowSystemTemplates] = useState(true);
  const [deleteTemplate, setDeleteTemplate] = useState<BuilderTemplate | null>(null);

  const { data, isLoading, error } = useBuilderTemplates({
    ...filters,
    isSystemTemplate: showSystemTemplates ? undefined : false,
  });
  const { data: documentTypes } = useDocumentTypes();
  useJuridictions(); // Prefetch for filters
  const deleteTemplateMutation = useDeleteBuilderTemplate();
  const duplicateTemplateMutation = useDuplicateBuilderTemplate();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleDocumentTypeChange = (documentType: string) => {
    setFilters((prev) => ({
      ...prev,
      documentType: documentType ? (documentType as BuilderDocumentType) : undefined,
      page: 1,
    }));
  };

  const handleJuridictionChange = (juridiction: string) => {
    setFilters((prev) => ({
      ...prev,
      juridiction: juridiction ? (juridiction as Juridiction) : undefined,
      page: 1,
    }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [
      BuilderTemplateFilters['sortBy'],
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
    if (!deleteTemplate) return;
    await deleteTemplateMutation.mutateAsync(deleteTemplate.id);
    setDeleteTemplate(null);
  };

  const handleDuplicate = async (template: BuilderTemplate) => {
    const duplicated = await duplicateTemplateMutation.mutateAsync(template.id);
    navigate(`/document-templates/${duplicated.id}/edit`);
  };

  const handleCreate = () => {
    navigate('/document-templates/new');
  };

  const hasActiveFilters = filters.documentType || filters.juridiction || filters.search;

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement des templates</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reessayer
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
          <h1 className="text-2xl font-bold text-gray-900">Templates de documents</h1>
          <p className="text-gray-600 mt-1">
            Gerez vos modeles de documents composables
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
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
                placeholder="Rechercher par nom..."
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
              value={filters.documentType || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleDocumentTypeChange(e.target.value)}
              options={[
                { value: '', label: 'Tous types' },
                ...Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              className="w-48"
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
                  {[filters.documentType, filters.juridiction, filters.search].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Juridiction"
                value={filters.juridiction || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleJuridictionChange(e.target.value)}
                options={[
                  { value: '', label: 'Toutes juridictions' },
                  ...Object.entries(JURIDICTION_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />

              <Select
                label="Trier par"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSortChange(e.target.value)}
                options={[
                  { value: 'usageCount-desc', label: 'Plus utilises' },
                  { value: 'createdAt-desc', label: 'Plus recents' },
                  { value: 'name-asc', label: 'Nom (A-Z)' },
                  { value: 'name-desc', label: 'Nom (Z-A)' },
                ]}
              />

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSystemTemplates}
                    onChange={(e) => setShowSystemTemplates(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Afficher templates systeme</span>
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

      {/* Document Type Tabs */}
      {documentTypes && documentTypes.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleDocumentTypeChange('')}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
              !filters.documentType
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous ({data?.pagination?.total || 0})
          </button>
          {documentTypes.slice(0, 8).map((dt) => (
            <button
              key={dt.documentType}
              onClick={() => handleDocumentTypeChange(dt.documentType)}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                filters.documentType === dt.documentType
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {DOCUMENT_TYPE_LABELS[dt.documentType]} ({dt.count})
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && <LoadingState message="Chargement des templates..." />}

      {/* Results */}
      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="Aucun template trouve"
          description={
            hasActiveFilters
              ? 'Aucun template ne correspond a vos criteres de recherche.'
              : 'Creez votre premier template pour commencer.'
          }
          action={
            hasActiveFilters
              ? { label: 'Effacer les filtres', onClick: clearFilters }
              : { label: 'Creer un template', onClick: handleCreate }
          }
        />
      )}

      {/* Templates Grid */}
      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.data.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDuplicate={handleDuplicate}
                onDelete={(t) => setDeleteTemplate(t)}
                duplicating={duplicateTemplateMutation.isPending}
              />
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
        isOpen={!!deleteTemplate}
        onClose={() => setDeleteTemplate(null)}
        onConfirm={handleDelete}
        title="Supprimer le template"
        message={`Etes-vous sur de vouloir supprimer le template "${deleteTemplate?.name}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteTemplateMutation.isPending}
      />
    </div>
  );
};

export default DocumentTemplatesListPage;
