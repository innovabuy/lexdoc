import React, { useState, useMemo } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { Button, Input, EmptyState, Spinner, ConfirmDialog } from '@/components/ui';
import { useTemplates, useDeleteTemplate, useDownloadPreview } from '@/hooks/useTemplates';
import TemplateCard from './TemplateCard';
import TemplateCategoryFilter from './TemplateCategoryFilter';
import TemplateUploadModal from './TemplateUploadModal';
import TemplateGenerateModal from './TemplateGenerateModal';
import TemplateEditModal from './TemplateEditModal';
import type { TemplateListItem, TemplateCategory, TemplateFilters } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';

const TemplateLibrary: React.FC = () => {
  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TemplateCategory | ''>('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateListItem | null>(null);

  // API hooks
  const filters: TemplateFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: category || undefined,
      page,
      limit: 12,
    }),
    [debouncedSearch, category, page]
  );

  const { data, isLoading, error } = useTemplates(filters);
  const deleteTemplate = useDeleteTemplate();
  const downloadPreview = useDownloadPreview();

  // Handlers
  const handleGenerate = (template: TemplateListItem) => {
    setSelectedTemplate(template);
    setGenerateModalOpen(true);
  };

  const handleEdit = (template: TemplateListItem) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  const handleDelete = (template: TemplateListItem) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handlePreview = (template: TemplateListItem) => {
    downloadPreview.mutate({ templateId: template.id });
  };

  const confirmDelete = async () => {
    if (selectedTemplate) {
      try {
        await deleteTemplate.mutateAsync(selectedTemplate.id);
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
      } catch {
        // Error handled by hook
      }
    }
  };

  const templates = data || [];
  const totalPages = 1; // TODO: Add pagination support to API

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un modele..."
              className="pl-10"
            />
          </div>
          <TemplateCategoryFilter
            value={category}
            onChange={(val) => {
              setCategory(val);
              setPage(1);
            }}
          />
        </div>

        <Button onClick={() => setUploadModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau modele
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          Erreur lors du chargement des modeles
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="Aucun modele"
          description={
            search || category
              ? 'Aucun modele ne correspond a vos criteres de recherche.'
              : 'Commencez par creer votre premier modele de document.'
          }
          action={
            !search && !category
              ? {
                  label: 'Nouveau modele',
                  onClick: () => setUploadModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Template grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: TemplateListItem) => (
              <TemplateCard
                key={template.id}
                template={template}
                onGenerate={handleGenerate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={handlePreview}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Precedent
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <TemplateUploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />

      <TemplateGenerateModal
        isOpen={generateModalOpen}
        onClose={() => {
          setGenerateModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      <TemplateEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedTemplate(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer le modele"
        message={`Etes-vous sur de vouloir supprimer le modele "${selectedTemplate?.name}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteTemplate.isPending}
        variant="danger"
      />
    </div>
  );
};

export default TemplateLibrary;
