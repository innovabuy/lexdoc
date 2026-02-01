import React, { useState, useRef, useEffect } from 'react';
import { FileText, MoreVertical, Edit, Trash2, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui';
import TemplateCategoryBadge from './TemplateCategoryBadge';
import type { TemplateListItem } from '@/lib/types';

interface TemplateCardProps {
  template: TemplateListItem;
  onGenerate: (template: TemplateListItem) => void;
  onEdit: (template: TemplateListItem) => void;
  onDelete: (template: TemplateListItem) => void;
  onPreview: (template: TemplateListItem) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onGenerate,
  onEdit,
  onDelete,
  onPreview,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-1">{template.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{template.filename}</p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  onGenerate(template);
                }}
              >
                <Play className="w-4 h-4" />
                Generer un document
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  onPreview(template);
                }}
              >
                <Download className="w-4 h-4" />
                Apercu
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(template);
                }}
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(template);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <TemplateCategoryBadge category={template.category} size="sm" />
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{template.usageCount} utilisations</span>
          <span>
            {new Date(template.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => onGenerate(template)}
        >
          <Play className="w-4 h-4 mr-2" />
          Generer un document
        </Button>
      </div>
    </div>
  );
};

export default TemplateCard;
