import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

function buildTree(flatList) {
  const map = new Map();
  const roots = [];

  flatList.forEach(folder => {
    map.set(folder.id, { ...folder, children: [] });
  });

  flatList.forEach(folder => {
    const node = map.get(folder.id);
    if (folder.parentId) {
      const parent = map.get(folder.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function FolderTree({ onFolderSelect, selectedFolderId }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const { data: folders, isLoading } = useQuery({
    queryKey: ['folders-tree'],
    queryFn: async () => {
      const { data } = await api.get('/folders?tree=true');
      return buildTree(data);
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }) => {
      const { data } = await api.post('/folders', {
        name,
        parentId,
        color: '#3B82F6'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const { data } = await api.put(`/folders/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setRenamingFolder(null);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      await api.delete(`/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setContextMenu(null);
      if (selectedFolderId === contextMenu?.folderId) {
        onFolderSelect(null);
      }
    },
  });

  const toggleExpand = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleContextMenu = (e, folder) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      folderId: folder.id,
      folderName: folder.name
    });
  };

  const handleCreateSubfolder = () => {
    if (!contextMenu) return;
    const name = prompt('Nom du sous-dossier :');
    if (name?.trim()) {
      createFolderMutation.mutate({ name: name.trim(), parentId: contextMenu.folderId });
      setExpandedFolders(prev => new Set([...prev, contextMenu.folderId]));
    }
    setContextMenu(null);
  };

  const handleRename = () => {
    if (!contextMenu) return;
    setRenamingFolder(contextMenu.folderId);
    setNewName(contextMenu.folderName);
    setContextMenu(null);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && renamingFolder) {
      updateFolderMutation.mutate({ id: renamingFolder, name: newName.trim() });
    }
  };

  const handleDeleteFolder = () => {
    if (!contextMenu) return;
    if (confirm('Supprimer ce dossier et tout son contenu ?')) {
      deleteFolderMutation.mutate(contextMenu.folderId);
    }
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = (folder.children?.length || 0) > 0;
    const isSelected = selectedFolderId === folder.id;
    const isRenaming = renamingFolder === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-gray-100 rounded transition-colors
            ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => !isRenaming && onFolderSelect(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
        >
          {hasChildren ? (
            <button
              className="text-gray-500 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="w-4"></span>
          )}

          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: folder.color || '#3B82F6' }}
          />

          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => setRenamingFolder(null)}
                autoFocus
                className="w-full px-1 py-0.5 text-sm border rounded"
              />
            </form>
          ) : (
            <span className="flex-1 font-medium text-sm truncate">{folder.name}</span>
          )}

          <span className="text-xs text-gray-500 flex-shrink-0">
            {folder._count?.documents || 0}
          </span>
        </div>

        {isExpanded && hasChildren && (
          <div className="folder-children">
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">Dossiers</h3>
        <button
          onClick={() => {
            const name = prompt('Nom du dossier :');
            if (name?.trim()) createFolderMutation.mutate({ name: name.trim() });
          }}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          + Nouveau
        </button>
      </div>

      {/* All documents */}
      <div
        className={`py-2 px-3 mb-2 cursor-pointer hover:bg-gray-100 rounded transition-colors
          ${selectedFolderId === null ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
        onClick={() => onFolderSelect(null)}
      >
        <span className="font-medium text-sm">Tous les documents</span>
      </div>

      {/* Folder tree */}
      {folders?.map(folder => renderFolder(folder))}

      {folders?.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Aucun dossier. Créez-en un !
        </p>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-white border rounded-lg shadow-lg py-1 z-50 min-w-40"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleCreateSubfolder}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              Créer un sous-dossier
            </button>
            <button
              onClick={handleRename}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              Renommer
            </button>
            <hr className="my-1" />
            <button
              onClick={handleDeleteFolder}
              className="block w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600"
            >
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
