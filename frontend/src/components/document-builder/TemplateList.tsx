import React, { useState, ChangeEvent } from 'react';
import { Search, Plus, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { TemplateCard } from './TemplateCard';
import {
  useBuilderTemplates,
  useDocumentTypes,
  useDeleteBuilderTemplate,
  useDuplicateBuilderTemplate,
} from '@/hooks/useDocumentBuilder';
import type {
  BuilderTemplate,
  BuilderTemplateFilters,
  BuilderDocumentType,
} from '@/lib/types/documentBuilder';
import { DOCUMENT_TYPE_LABELS } from '@/lib/types/documentBuilder';

export const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<BuilderTemplateFilters>({
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTemplate, setDeleteTemplate] = useState<BuilderTemplate | null>(null);

  const { data, isLoading, error } = useBuilderTemplates(filters);
  const { data: documentTypes } = useDocumentTypes();
  const deleteTemplateMutation = useDeleteBuilderTemplate();
  const duplicateTemplateMutation = useDuplicateBuilderTemplate();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleDocumentTypeChange = (docType: string) => {
    setFilters((prev) => ({
      ...prev,
      documentType: docType ? (docType as BuilderDocumentType) : undefined,
      page: 1,
    }));
  };

  const handleSystemTemplateFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      isSystemTemplate: value === '' ? undefined : value === 'true',
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    setSearchInput('');
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;
    await deleteTemplateMutation.mutateAsync(deleteTemplate.id);
    setDeleteTemplate(null);
  };

  const handleDuplicate = async (template: BuilderTemplate) => {
    await duplicateTemplateMutation.mutateAsync(template.id);
  };

  const handleView = (template: BuilderTemplate) => {
    navigate(`/document-builder/templates/${template.id}`);
  };

  const handleEdit = (template: BuilderTemplate) => {
    navigate(`/document-builder/templates/${template.id}/edit`);
  };

  const handleGenerate = (template: BuilderTemplate) => {
    navigate(`/document-builder/generate/${template.id}`);
  };

  const hasActiveFilters =
    filters.documentType || filters.isSystemTemplate !== undefined || filters.search;

  if (isLoading) {
    return <LoadingState message="Chargement des modeles..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement des modeles</p>
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
              placeholder="Rechercher un modele..."
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
        <Button onClick={() => navigate('/document-builder/templates/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau modele
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Type de document"
              value={filters.documentType || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleDocumentTypeChange(e.target.value)}
              options={[
                { value: '', label: 'Tous les types' },
                ...(documentTypes?.map((dt) => ({
                  value: dt.documentType,
                  label: `${DOCUMENT_TYPE_LABELS[dt.documentType]} (${dt.count})`,
                })) || []),
              ]}
            />
            <Select
              label="Type de modele"
              value={filters.isSystemTemplate === undefined ? '' : String(filters.isSystemTemplate)}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSystemTemplateFilter(e.target.value)}
              options={[
                { value: '', label: 'Tous les modeles' },
                { value: 'true', label: 'Modeles systeme' },
                { value: 'false', label: 'Mes modeles' },
              ]}
            />
            <Select
              label="Trier par"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [
                  BuilderTemplateFilters['sortBy'],
                  'asc' | 'desc'
                ];
                setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
              }}
              options={[
                { value: 'name-asc', label: 'Nom (A-Z)' },
                { value: 'name-desc', label: 'Nom (Z-A)' },
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
          title="Aucun modele trouve"
          description={
            hasActiveFilters
              ? 'Aucun modele ne correspond a vos criteres de recherche.'
              : 'Creez votre premier modele pour commencer a generer des documents.'
          }
          action={
            hasActiveFilters
              ? { label: 'Effacer les filtres', onClick: clearFilters }
              : { label: 'Creer un modele', onClick: () => navigate('/document-builder/templates/new') }
          }
        />
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onView={handleView}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTemplate}
                onGenerate={handleGenerate}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTemplate}
        onClose={() => setDeleteTemplate(null)}
        onConfirm={handleDelete}
        title="Supprimer le modele"
        message={`Etes-vous sur de vouloir supprimer le modele "${deleteTemplate?.name}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteTemplateMutation.isPending}
      />
    </div>
  );
};
