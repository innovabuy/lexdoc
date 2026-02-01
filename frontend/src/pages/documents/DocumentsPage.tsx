import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Upload,
  FolderPlus,
  RefreshCw,
  X,
} from 'lucide-react';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { FolderTree } from '@/components/folders/FolderTree';
import { FolderBreadcrumb } from '@/components/folders/FolderBreadcrumb';
import {
  getDocuments,
  uploadDocument,
  uploadMultipleDocuments,
  deleteDocument,
  duplicateDocument,
  moveDocument,
  bulkDeleteDocuments,
  bulkMoveDocuments,
  downloadDocument,
} from '@/lib/api/documents';
import {
  getFolderTree,
  getFolderBreadcrumb,
  createFolder,
  deleteFolder,
} from '@/lib/api/folders';
import type { Document, DocumentFilters, FolderTreeNode, CreateFolderInput } from '@/lib/types';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [movingDocuments, setMovingDocuments] = useState<string[]>([]);

  // Fetch folder tree
  const { data: folderTree = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['folders', 'tree'],
    queryFn: () => getFolderTree(5),
  });

  // Fetch breadcrumb when folder is selected
  const { data: breadcrumb = [] } = useQuery({
    queryKey: ['folders', 'breadcrumb', selectedFolderId],
    queryFn: () => (selectedFolderId ? getFolderBreadcrumb(selectedFolderId) : Promise.resolve([])),
    enabled: !!selectedFolderId,
  });

  // Fetch documents
  const {
    data: documentsData,
    isLoading: loadingDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['documents', { ...filters, folderId: selectedFolderId }],
    queryFn: () => getDocuments({ ...filters, folderId: selectedFolderId || undefined }),
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async ({
      files,
      onProgress,
    }: {
      files: File[];
      onProgress: (fileName: string, progress: number) => void;
    }) => {
      if (!selectedFolderId) {
        throw new Error('Veuillez selectionner un dossier');
      }
      if (files.length === 1) {
        return uploadDocument(files[0], selectedFolderId, undefined, (p) =>
          onProgress(files[0].name, p)
        );
      }
      return uploadMultipleDocuments(files, selectedFolderId, onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Document(s) telecharge(s) avec succes');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du telechargement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Document supprime');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document duplique');
    },
    onError: () => {
      toast.error('Erreur lors de la duplication');
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ documentId, folderId }: { documentId: string; folderId: string }) =>
      moveDocument(documentId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Document deplace');
      setMovingDocuments([]);
    },
    onError: () => {
      toast.error('Erreur lors du deplacement');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (documentIds: string[]) => bulkDeleteDocuments({ documentIds }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success(`${data.deleted} document(s) supprime(s)`);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: ({ documentIds, folderId }: { documentIds: string[]; folderId: string }) =>
      bulkMoveDocuments({ documentIds, folderId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success(`${data.moved} document(s) deplace(s)`);
      setMovingDocuments([]);
    },
    onError: () => {
      toast.error('Erreur lors du deplacement');
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Dossier cree');
      setShowCreateFolder(false);
    },
    onError: () => {
      toast.error('Erreur lors de la creation du dossier');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Dossier supprime');
      if (selectedFolderId) {
        setSelectedFolderId(null);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression du dossier');
    },
  });

  // Handlers
  const handleUpload = useCallback(
    async (files: File[], onProgress: (fileName: string, progress: number) => void) => {
      await uploadMutation.mutateAsync({ files, onProgress });
    },
    [uploadMutation]
  );

  const handleDownload = useCallback(async (document: Document) => {
    try {
      const blob = await downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName || document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erreur lors du telechargement');
    }
  }, []);

  const handleView = useCallback((document: Document) => {
    // Open preview in new tab
    const previewUrl = `/api/documents/${document.id}/preview`;
    window.open(previewUrl, '_blank');
  }, []);

  const handleDelete = useCallback(
    (document: Document) => {
      if (window.confirm(`Supprimer "${document.name}" ?`)) {
        deleteMutation.mutate(document.id);
      }
    },
    [deleteMutation]
  );

  const handleDuplicate = useCallback(
    (document: Document) => {
      duplicateMutation.mutate(document.id);
    },
    [duplicateMutation]
  );

  const handleMove = useCallback((document: Document) => {
    setMovingDocuments([document.id]);
  }, []);

  const handleBulkDelete = useCallback(
    (ids: string[]) => {
      if (window.confirm(`Supprimer ${ids.length} document(s) ?`)) {
        bulkDeleteMutation.mutate(ids);
      }
    },
    [bulkDeleteMutation]
  );

  const handleBulkMove = useCallback((ids: string[]) => {
    setMovingDocuments(ids);
  }, []);

  const handleMoveToFolder = useCallback(
    (folderId: string) => {
      if (movingDocuments.length === 1) {
        moveMutation.mutate({ documentId: movingDocuments[0], folderId });
      } else {
        bulkMoveMutation.mutate({ documentIds: movingDocuments, folderId });
      }
    },
    [movingDocuments, moveMutation, bulkMoveMutation]
  );

  const handleCreateFolder = useCallback(
    (parentId: string | null) => {
      setCreateFolderParentId(parentId);
      setShowCreateFolder(true);
    },
    []
  );

  const handleDeleteFolder = useCallback(
    (folder: FolderTreeNode) => {
      if (window.confirm(`Supprimer le dossier "${folder.name}" ?`)) {
        deleteFolderMutation.mutate(folder.id);
      }
    },
    [deleteFolderMutation]
  );

  const handleSelectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar - Folder tree */}
      <div className="w-64 border-r bg-white flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Dossiers</h2>
        </div>
        <FolderTree
          folders={folderTree}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          isLoading={loadingFolders}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-4">
            <FolderBreadcrumb
              items={breadcrumb}
              onNavigate={handleSelectFolder}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchDocuments()}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Actualiser"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => handleCreateFolder(selectedFolderId)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <FolderPlus className="h-4 w-4" />
              Nouveau dossier
            </button>
            <button
              onClick={() => setShowUpload(true)}
              disabled={!selectedFolderId}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              Telecharger
            </button>
          </div>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!selectedFolderId && documentsData?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FolderPlus className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Selectionnez un dossier</p>
              <p className="text-sm">ou creez-en un pour commencer</p>
            </div>
          ) : (
            <DocumentList
              documents={documentsData?.data || []}
              isLoading={loadingDocuments}
              filters={filters}
              onFiltersChange={setFilters}
              onView={handleView}
              onDownload={handleDownload}
              onEdit={(doc) => toast.success(`Edition de "${doc.name}" (a venir)`)}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onMove={handleMove}
              onBulkDelete={handleBulkDelete}
              onBulkMove={handleBulkMove}
              pagination={
                documentsData?.pagination
                  ? {
                      page: documentsData.pagination.page,
                      totalPages: documentsData.pagination.totalPages,
                      total: documentsData.pagination.total,
                    }
                  : undefined
              }
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          )}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && selectedFolderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <DocumentUpload
            folderId={selectedFolderId}
            onUpload={handleUpload}
            onClose={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Create folder modal */}
      {showCreateFolder && (
        <CreateFolderModal
          parentId={createFolderParentId}
          onClose={() => setShowCreateFolder(false)}
          onCreate={(input) => createFolderMutation.mutate(input)}
          isLoading={createFolderMutation.isPending}
        />
      )}

      {/* Move documents modal */}
      {movingDocuments.length > 0 && (
        <MoveFolderModal
          folderTree={folderTree}
          onClose={() => setMovingDocuments([])}
          onMove={handleMoveToFolder}
          documentCount={movingDocuments.length}
        />
      )}
    </div>
  );
}

// Create folder modal component
interface CreateFolderModalProps {
  parentId: string | null;
  onClose: () => void;
  onCreate: (input: CreateFolderInput) => void;
  isLoading: boolean;
}

function CreateFolderModal({ parentId, onClose, onCreate, isLoading }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), parentId, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nouveau dossier</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du dossier
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mon dossier"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-8 rounded border cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Move folder modal component
interface MoveFolderModalProps {
  folderTree: FolderTreeNode[];
  onClose: () => void;
  onMove: (folderId: string) => void;
  documentCount: number;
}

function MoveFolderModal({ folderTree, onClose, onMove, documentCount }: MoveFolderModalProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Deplacer {documentCount} document(s)
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto border rounded-lg mb-4">
          <FolderTree
            folders={folderTree}
            selectedFolderId={selectedFolder}
            onSelectFolder={setSelectedFolder}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={() => selectedFolder && onMove(selectedFolder)}
            disabled={!selectedFolder}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            Deplacer
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;
