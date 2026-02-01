import { useState } from 'react';
import {
  Grid3X3,
  List,
  Search,
  Trash2,
  FolderInput,
  Download,
} from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import type { Document, DocumentType, DocumentFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  filters?: DocumentFilters;
  onFiltersChange?: (filters: DocumentFilters) => void;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onDuplicate?: (document: Document) => void;
  onMove?: (document: Document) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkMove?: (ids: string[]) => void;
  onBulkDownload?: (ids: string[]) => void;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
  };
  onPageChange?: (page: number) => void;
}

const documentTypes: { value: DocumentType | ''; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'ACTE', label: 'Acte' },
  { value: 'CONTRAT', label: 'Contrat' },
  { value: 'COURRIER', label: 'Courrier' },
  { value: 'DECISION', label: 'Decision' },
  { value: 'PIECE', label: 'Piece' },
  { value: 'TEMPLATE', label: 'Modele' },
  { value: 'OTHER', label: 'Autre' },
];

const sortOptions = [
  { value: 'createdAt:desc', label: 'Plus recent' },
  { value: 'createdAt:asc', label: 'Plus ancien' },
  { value: 'name:asc', label: 'Nom (A-Z)' },
  { value: 'name:desc', label: 'Nom (Z-A)' },
  { value: 'fileSize:desc', label: 'Taille (grand)' },
  { value: 'fileSize:asc', label: 'Taille (petit)' },
];

export function DocumentList({
  documents,
  isLoading = false,
  filters = {},
  onFiltersChange,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onBulkDelete,
  onBulkMove,
  onBulkDownload,
  pagination,
  onPageChange,
}: DocumentListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSelectDocument = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  };

  const handleSearch = () => {
    onFiltersChange?.({ ...filters, search: searchInput, page: 1 });
  };

  const handleTypeChange = (type: DocumentType | '') => {
    onFiltersChange?.({ ...filters, type: type || undefined, page: 1 });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [DocumentFilters['sortBy'], DocumentFilters['sortOrder']];
    onFiltersChange?.({ ...filters, sortBy, sortOrder, page: 1 });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedDocuments = Array.from(selectedIds);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-100 rounded-lg h-48" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b bg-white sticky top-0 z-10">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des documents..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type filter */}
        <select
          value={filters.type || ''}
          onChange={(e) => handleTypeChange(e.target.value as DocumentType | '')}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${filters.sortBy || 'createdAt'}:${filters.sortOrder || 'desc'}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* View mode toggle */}
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2',
              viewMode === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2',
              viewMode === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border-b">
          <input
            type="checkbox"
            checked={selectedIds.size === documents.length}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-blue-700 font-medium">
            {selectedIds.size} selectionne(s)
          </span>
          <div className="flex-1" />
          <button
            onClick={() => onBulkMove?.(selectedDocuments)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-100 rounded"
          >
            <FolderInput className="h-4 w-4" /> Deplacer
          </button>
          <button
            onClick={() => onBulkDownload?.(selectedDocuments)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-100 rounded"
          >
            <Download className="h-4 w-4" /> Telecharger
          </button>
          <button
            onClick={() => {
              onBulkDelete?.(selectedDocuments);
              clearSelection();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Search className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium">Aucun document</p>
          <p className="text-sm">Commencez par telecharger des documents</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              isSelected={selectedIds.has(document.id)}
              onSelect={handleSelectDocument}
              onView={onView}
              onDownload={onDownload}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMove={onMove}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y">
          {documents.map((document) => (
            <DocumentListRow
              key={document.id}
              document={document}
              isSelected={selectedIds.has(document.id)}
              onSelect={handleSelectDocument}
              onView={onView}
              onDownload={onDownload}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t bg-white">
          <p className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} documents)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Precedent
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// List row component for list view
interface DocumentListRowProps {
  document: Document;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

function DocumentListRow({
  document,
  isSelected,
  onSelect,
  onView,
  onDownload,
}: DocumentListRowProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer',
        isSelected && 'bg-blue-50'
      )}
      onDoubleClick={() => onView?.(document)}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(document.id)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-gray-300 text-blue-600"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{document.name}</p>
        <p className="text-sm text-gray-500">
          {document.type} - {formatFileSize(document.size)}
        </p>
      </div>
      <div className="text-sm text-gray-500">{formatDate(document.createdAt)}</div>
      <div className="flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.(document);
          }}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Telecharger"
        >
          <Download className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

export default DocumentList;
