import { useState } from 'react';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  MoreVertical,
  Download,
  Eye,
  Pencil,
  Trash2,
  Copy,
  FolderInput,
} from 'lucide-react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  document: Document;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onDuplicate?: (document: Document) => void;
  onMove?: (document: Document) => void;
}

const typeColors: Record<string, string> = {
  ACTE: 'bg-blue-100 text-blue-700',
  CONTRAT: 'bg-green-100 text-green-700',
  COURRIER: 'bg-purple-100 text-purple-700',
  DECISION: 'bg-orange-100 text-orange-700',
  PIECE: 'bg-gray-100 text-gray-700',
  TEMPLATE: 'bg-indigo-100 text-indigo-700',
  OTHER: 'bg-slate-100 text-slate-700',
};

function getFileIcon(mimeType: string): React.ElementType {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('pdf') || mimeType.includes('word')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DocumentCard({
  document,
  isSelected = false,
  onSelect,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
}: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = getFileIcon(document.mimeType);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(document.id);
  };

  const handleDoubleClick = () => {
    onView?.(document);
  };

  return (
    <div
      className={cn(
        'group relative bg-white rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer',
        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.(document.id)}
          onClick={handleSelect}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* More menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onView?.(document);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" /> Apercu
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDownload?.(document);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Telecharger
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit?.(document);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" /> Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDuplicate?.(document);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" /> Dupliquer
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onMove?.(document);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <FolderInput className="h-4 w-4" /> Deplacer
              </button>
              <hr className="my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete?.(document);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      {/* Document icon */}
      <div className="flex justify-center mb-4 mt-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <Icon className="h-10 w-10 text-gray-400" />
        </div>
      </div>

      {/* Document info */}
      <div className="text-center">
        <h3 className="font-medium text-gray-900 truncate" title={document.name}>
          {document.name}
        </h3>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              typeColors[document.type] || typeColors.OTHER
            )}
          >
            {document.type}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {formatFileSize(document.size)} - {formatDate(document.createdAt)}
        </p>
        {document.version > 1 && (
          <p className="mt-1 text-xs text-blue-600">v{document.version}</p>
        )}
      </div>
    </div>
  );
}

export default DocumentCard;
