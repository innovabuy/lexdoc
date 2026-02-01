import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  Eye,
  Lock,
  Tag,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { DocumentBlock, BlockCategory } from '@/lib/types/documentBuilder';
import { BLOCK_CATEGORY_LABELS } from '@/lib/types/documentBuilder';

interface BlockCardProps {
  block: DocumentBlock;
  onView: (block: DocumentBlock) => void;
  onEdit: (block: DocumentBlock) => void;
  onDuplicate: (block: DocumentBlock) => void;
  onDelete: (block: DocumentBlock) => void;
}

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  INTRO: 'bg-blue-100 text-blue-800',
  FAITS: 'bg-green-100 text-green-800',
  MOYENS: 'bg-purple-100 text-purple-800',
  DISPOSITIF: 'bg-orange-100 text-orange-800',
  SIGNATURE: 'bg-pink-100 text-pink-800',
  CLAUSE: 'bg-yellow-100 text-yellow-800',
  MENTION_LEGALE: 'bg-gray-100 text-gray-800',
  CUSTOM: 'bg-indigo-100 text-indigo-800',
};

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">{block.title}</h3>
              {block.isSystemBlock && (
                <span title="Bloc systeme">
                  <Lock className="h-4 w-4 text-gray-400" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={CATEGORY_COLORS[block.category]}>
                {BLOCK_CATEGORY_LABELS[block.category]}
              </Badge>
              {block.isMandatory && (
                <Badge className="bg-red-100 text-red-800">Obligatoire</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  onView(block);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir le contenu
              </button>
              <button
                onClick={() => {
                  onEdit(block);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                disabled={block.isSystemBlock}
              >
                <Edit2 className="h-4 w-4" />
                Modifier
              </button>
              <button
                onClick={() => {
                  onDuplicate(block);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Dupliquer
              </button>
              {!block.isSystemBlock && (
                <button
                  onClick={() => {
                    onDelete(block);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 line-clamp-3">
        {truncateContent(block.content)}
      </p>

      {block.tags.length > 0 && (
        <div className="mt-3 flex items-center gap-1 flex-wrap">
          <Tag className="h-3 w-3 text-gray-400" />
          {block.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
          {block.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{block.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{block.variables.length} variable(s)</span>
        <span>{block.usageCount} utilisation(s)</span>
      </div>
    </div>
  );
};
