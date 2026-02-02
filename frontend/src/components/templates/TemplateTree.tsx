import React, { useState, useMemo } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  StarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type {
  TemplateCategoryNode,
  TemplateTreeItem,
} from '@/lib/types/documentBuilder';
import { cn } from '@/lib/utils';

interface TemplateTreeProps {
  tree: TemplateCategoryNode[];
  favorites: TemplateTreeItem[];
  recent: TemplateTreeItem[];
  selectedTemplateId?: string;
  onSelectTemplate: (template: TemplateTreeItem) => void;
  onToggleFavorite?: (templateId: string) => void;
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface CategoryNodeProps {
  node: TemplateCategoryNode;
  selectedTemplateId?: string;
  onSelectTemplate: (template: TemplateTreeItem) => void;
  onToggleFavorite?: (templateId: string) => void;
  defaultExpanded?: boolean;
  searchQuery: string;
}

interface TemplateItemProps {
  template: TemplateTreeItem;
  isSelected: boolean;
  onClick: () => void;
  onToggleFavorite?: () => void;
  indent?: number;
}

const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  isSelected,
  onClick,
  onToggleFavorite,
  indent = 0,
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
        isSelected
          ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/30 dark:text-primary-100'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
      style={{ paddingLeft: `${8 + indent * 16}px` }}
      onClick={onClick}
    >
      <DocumentTextIcon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: template.color || '#6B7280' }}
      />
      <span className="flex-1 truncate">{template.name}</span>
      {template.isSystemTemplate && (
        <span className="text-xs text-gray-400 dark:text-gray-500 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
          Systeme
        </span>
      )}
      {onToggleFavorite && (
        <button
          onClick={handleFavoriteClick}
          className={cn(
            'p-0.5 rounded transition-opacity',
            template.isFavorite
              ? 'text-yellow-500'
              : 'text-gray-400 opacity-0 group-hover:opacity-100'
          )}
        >
          {template.isFavorite ? (
            <StarIconSolid className="w-4 h-4" />
          ) : (
            <StarIcon className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
};

const CategoryNode: React.FC<CategoryNodeProps> = ({
  node,
  selectedTemplateId,
  onSelectTemplate,
  onToggleFavorite,
  defaultExpanded = false,
  searchQuery,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return node.templates;
    const query = searchQuery.toLowerCase();
    return node.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [node.templates, searchQuery]);

  const filteredSubcategories = useMemo(() => {
    if (!searchQuery) return node.subcategories;
    const query = searchQuery.toLowerCase();
    return node.subcategories
      .map((sub) => ({
        ...sub,
        templates: sub.templates.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query) ||
            t.tags.some((tag) => tag.toLowerCase().includes(query))
        ),
      }))
      .filter((sub) => sub.templates.length > 0);
  }, [node.subcategories, searchQuery]);

  const hasContent =
    filteredTemplates.length > 0 || filteredSubcategories.length > 0;

  // Auto-expand when search matches
  React.useEffect(() => {
    if (searchQuery && hasContent) {
      setIsExpanded(true);
    }
  }, [searchQuery, hasContent]);

  if (!hasContent && searchQuery) {
    return null;
  }

  return (
    <div className="mb-1">
      <button
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            <FolderOpenIcon className="w-4 h-4 text-primary-500" />
          </>
        ) : (
          <>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <FolderIcon className="w-4 h-4 text-gray-400" />
          </>
        )}
        <span className="flex-1 text-left truncate">{node.label}</span>
        <span className="text-xs text-gray-400">
          {node.templateCount}
        </span>
      </button>

      {isExpanded && (
        <div className="ml-2 mt-1 space-y-0.5">
          {/* Subcategories */}
          {filteredSubcategories.map((sub) => (
            <SubcategoryNode
              key={sub.name}
              name={sub.name}
              templates={sub.templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={onSelectTemplate}
              onToggleFavorite={onToggleFavorite}
              searchQuery={searchQuery}
            />
          ))}

          {/* Direct templates */}
          {filteredTemplates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              isSelected={template.id === selectedTemplateId}
              onClick={() => onSelectTemplate(template)}
              onToggleFavorite={
                onToggleFavorite ? () => onToggleFavorite(template.id) : undefined
              }
              indent={1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SubcategoryNodeProps {
  name: string;
  templates: TemplateTreeItem[];
  selectedTemplateId?: string;
  onSelectTemplate: (template: TemplateTreeItem) => void;
  onToggleFavorite?: (templateId: string) => void;
  searchQuery: string;
}

const SubcategoryNode: React.FC<SubcategoryNodeProps> = ({
  name,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onToggleFavorite,
  searchQuery,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when search matches
  React.useEffect(() => {
    if (searchQuery && templates.length > 0) {
      setIsExpanded(true);
    }
  }, [searchQuery, templates.length]);

  return (
    <div className="ml-2">
      <button
        className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-3 h-3" />
        ) : (
          <ChevronRightIcon className="w-3 h-3" />
        )}
        <span className="flex-1 text-left truncate">{name}</span>
        <span className="text-xs text-gray-400">{templates.length}</span>
      </button>

      {isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {templates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              isSelected={template.id === selectedTemplateId}
              onClick={() => onSelectTemplate(template)}
              onToggleFavorite={
                onToggleFavorite ? () => onToggleFavorite(template.id) : undefined
              }
              indent={2}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TemplateTree: React.FC<TemplateTreeProps> = ({
  tree,
  favorites,
  recent,
  selectedTemplateId,
  onSelectTemplate,
  onToggleFavorite,
  loading,
  searchQuery,
  onSearchChange,
}) => {
  const [showFavorites, setShowFavorites] = useState(true);
  const [showRecent, setShowRecent] = useState(true);

  // Filter favorites and recent based on search
  const filteredFavorites = useMemo(() => {
    if (!searchQuery) return favorites;
    const query = searchQuery.toLowerCase();
    return favorites.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
    );
  }, [favorites, searchQuery]);

  const filteredRecent = useMemo(() => {
    if (!searchQuery) return recent;
    const query = searchQuery.toLowerCase();
    return recent.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
    );
  }, [recent, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Favorites section */}
        {filteredFavorites.length > 0 && (
          <div>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              onClick={() => setShowFavorites(!showFavorites)}
            >
              {showFavorites ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
              <StarIconSolid className="w-4 h-4" />
              <span className="flex-1 text-left">Favoris</span>
              <span className="text-xs text-gray-400">{filteredFavorites.length}</span>
            </button>
            {showFavorites && (
              <div className="ml-2 mt-1 space-y-0.5">
                {filteredFavorites.map((template) => (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    isSelected={template.id === selectedTemplateId}
                    onClick={() => onSelectTemplate(template)}
                    onToggleFavorite={
                      onToggleFavorite ? () => onToggleFavorite(template.id) : undefined
                    }
                    indent={1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent section */}
        {filteredRecent.length > 0 && (
          <div>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => setShowRecent(!showRecent)}
            >
              {showRecent ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
              <ClockIcon className="w-4 h-4" />
              <span className="flex-1 text-left">Recents</span>
              <span className="text-xs text-gray-400">{filteredRecent.length}</span>
            </button>
            {showRecent && (
              <div className="ml-2 mt-1 space-y-0.5">
                {filteredRecent.map((template) => (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    isSelected={template.id === selectedTemplateId}
                    onClick={() => onSelectTemplate(template)}
                    onToggleFavorite={
                      onToggleFavorite ? () => onToggleFavorite(template.id) : undefined
                    }
                    indent={1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        {(filteredFavorites.length > 0 || filteredRecent.length > 0) && (
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
        )}

        {/* Categories */}
        {tree.map((category) => (
          <CategoryNode
            key={category.category}
            node={category}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={onSelectTemplate}
            onToggleFavorite={onToggleFavorite}
            searchQuery={searchQuery}
          />
        ))}

        {/* Empty state */}
        {tree.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun modele disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateTree;
