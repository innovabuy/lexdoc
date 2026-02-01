import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { FolderTreeNode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  folders: FolderTreeNode[];
  selectedFolderId?: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onEditFolder?: (folder: FolderTreeNode) => void;
  onDeleteFolder?: (folder: FolderTreeNode) => void;
  isLoading?: boolean;
}

interface FolderNodeProps {
  folder: FolderTreeNode;
  level: number;
  selectedFolderId?: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onEditFolder?: (folder: FolderTreeNode) => void;
  onDeleteFolder?: (folder: FolderTreeNode) => void;
}

function FolderNode({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
          isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            'p-0.5 rounded hover:bg-gray-200',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Folder icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen
            className="h-4 w-4 flex-shrink-0"
            style={{ color: folder.color || '#3B82F6' }}
          />
        ) : (
          <Folder
            className="h-4 w-4 flex-shrink-0"
            style={{ color: folder.color || '#3B82F6' }}
          />
        )}

        {/* Folder name */}
        <span className="flex-1 text-sm truncate">{folder.name}</span>

        {/* Document count */}
        {folder.documentCount > 0 && (
          <span className="text-xs text-gray-400 mr-1">{folder.documentCount}</span>
        )}

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-3 w-3" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-20 w-40 bg-white rounded-lg shadow-lg border py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onCreateFolder?.(folder.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" /> Sous-dossier
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEditFolder?.(folder);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pencil className="h-3 w-3" /> Modifier
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDeleteFolder?.(folder);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  isLoading = false,
}: FolderTreeProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Root level */}
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors mb-1',
          selectedFolderId === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium">Tous les documents</span>
      </div>

      {/* Folder tree */}
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}

      {/* Create folder button */}
      {onCreateFolder && (
        <button
          onClick={() => onCreateFolder(null)}
          className="mt-2 w-full flex items-center gap-2 py-1.5 px-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
        >
          <Plus className="h-4 w-4" />
          Nouveau dossier
        </button>
      )}
    </div>
  );
}

export default FolderTree;
