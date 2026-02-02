import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlusIcon,
  HomeIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button, Select, Modal } from '@/components/ui';
import { TemplateTree } from '@/components/templates/TemplateTree';
import { TemplateDetails } from '@/components/templates/TemplateDetails';
import {
  useTemplateTreeStructure,
  useFavoriteTemplates,
  useRecentTemplates,
  useBuilderTemplate,
  useToggleTemplateFavorite,
  useDuplicateBuilderTemplate,
  useDeleteBuilderTemplate,
  useRecordTemplateUsage,
} from '@/hooks/useDocumentBuilder';
import type {
  TemplateTreeItem,
  BuilderTemplateCategory,
} from '@/lib/types/documentBuilder';
import { TEMPLATE_CATEGORY_LABELS } from '@/lib/types/documentBuilder';
import { Link } from 'react-router-dom';

const TemplatesTreeViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(
    searchParams.get('templateId') || undefined
  );
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<BuilderTemplateCategory | ''>('');

  // Queries
  const { data: treeData, isLoading: isLoadingTree } = useTemplateTreeStructure(false);
  const { data: favorites = [], isLoading: isLoadingFavorites } = useFavoriteTemplates(10);
  const { data: recent = [], isLoading: isLoadingRecent } = useRecentTemplates(10);
  const { data: selectedTemplate, isLoading: isLoadingTemplate } = useBuilderTemplate(
    selectedTemplateId
  );

  // Mutations
  const toggleFavorite = useToggleTemplateFavorite();
  const duplicateTemplate = useDuplicateBuilderTemplate();
  const deleteTemplate = useDeleteBuilderTemplate();
  const recordUsage = useRecordTemplateUsage();

  // Filtered tree based on category filter
  const filteredTree = useMemo(() => {
    if (!treeData?.tree) return [];
    if (!categoryFilter) return treeData.tree;
    return treeData.tree.filter((cat) => cat.category === categoryFilter);
  }, [treeData?.tree, categoryFilter]);

  // Convert favorites/recent to TemplateTreeItem format
  const favoritesAsTreeItems: TemplateTreeItem[] = useMemo(() => {
    return favorites.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      documentType: t.documentType,
      category: t.category,
      subcategory: t.subcategory,
      icon: t.icon,
      color: t.color,
      tags: t.tags,
      isFavorite: t.isFavorite,
      isSystemTemplate: t.isSystemTemplate,
      usageCount: t.usageCount,
      lastUsedAt: t.lastUsedAt,
      juridiction: t.juridiction,
    }));
  }, [favorites]);

  const recentAsTreeItems: TemplateTreeItem[] = useMemo(() => {
    return recent.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      documentType: t.documentType,
      category: t.category,
      subcategory: t.subcategory,
      icon: t.icon,
      color: t.color,
      tags: t.tags,
      isFavorite: t.isFavorite,
      isSystemTemplate: t.isSystemTemplate,
      usageCount: t.usageCount,
      lastUsedAt: t.lastUsedAt,
      juridiction: t.juridiction,
    }));
  }, [recent]);

  // Handlers
  const handleSelectTemplate = useCallback(
    (template: TemplateTreeItem) => {
      setSelectedTemplateId(template.id);
      setSearchParams({ templateId: template.id });
    },
    [setSearchParams]
  );

  const handleToggleFavorite = useCallback(
    (templateId: string) => {
      toggleFavorite.mutate(templateId);
    },
    [toggleFavorite]
  );

  const handleDuplicate = useCallback(
    (templateId: string) => {
      duplicateTemplate.mutate(templateId, {
        onSuccess: (newTemplate) => {
          setSelectedTemplateId(newTemplate.id);
          setSearchParams({ templateId: newTemplate.id });
        },
      });
    },
    [duplicateTemplate, setSearchParams]
  );

  const handleDelete = useCallback((templateId: string) => {
    setDeleteTemplateId(templateId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTemplateId) {
      deleteTemplate.mutate(deleteTemplateId, {
        onSuccess: () => {
          if (selectedTemplateId === deleteTemplateId) {
            setSelectedTemplateId(undefined);
            setSearchParams({});
          }
          setDeleteTemplateId(null);
        },
      });
    }
  }, [deleteTemplateId, deleteTemplate, selectedTemplateId, setSearchParams]);

  const handleUseTemplate = useCallback(
    (templateId: string) => {
      recordUsage.mutate(templateId);
      navigate(`/document-generation/new?templateId=${templateId}`);
    },
    [navigate, recordUsage]
  );

  const handleCreateTemplate = () => {
    navigate('/document-templates/new');
  };

  const isLoading = isLoadingTree || isLoadingFavorites || isLoadingRecent;

  // Category options for filter
  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: 'Toutes les categories' },
      ...Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Breadcrumb */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800">
          <nav className="flex items-center space-x-2 text-sm">
            <Link
              to="/dashboard"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HomeIcon className="w-4 h-4" />
            </Link>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              Modeles de documents
            </span>
          </nav>
        </div>

        {/* Title and actions */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bibliotheque de modeles
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {treeData?.totalTemplates || 0} modeles disponibles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as BuilderTemplateCategory | '')}
              options={categoryOptions}
              className="w-56"
            />
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="w-5 h-5" />}
              onClick={handleCreateTemplate}
            >
              Nouveau modele
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Tree */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <TemplateTree
            tree={filteredTree}
            favorites={favoritesAsTreeItems}
            recent={recentAsTreeItems}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleSelectTemplate}
            onToggleFavorite={handleToggleFavorite}
            loading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right panel - Details */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-800 overflow-hidden">
          <TemplateDetails
            template={selectedTemplate || null}
            loading={isLoadingTemplate}
            onToggleFavorite={handleToggleFavorite}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onUseTemplate={handleUseTemplate}
            isDeleting={deleteTemplate.isPending}
            isDuplicating={duplicateTemplate.isPending}
          />
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTemplateId}
        onClose={() => setDeleteTemplateId(null)}
        title="Supprimer le modele"
        size="sm"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              Etes-vous sur de vouloir supprimer ce modele ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cette action est irreversible.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteTemplateId(null)}
            disabled={deleteTemplate.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            isLoading={deleteTemplate.isPending}
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TemplatesTreeViewPage;
