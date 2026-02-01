import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  Eye,
  Lock,
  Play,
  Layers,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { BuilderTemplate, BuilderDocumentType } from '@/lib/types/documentBuilder';
import {
  DOCUMENT_TYPE_LABELS,
  JURIDICTION_LABELS,
} from '@/lib/types/documentBuilder';

interface TemplateCardProps {
  template: BuilderTemplate;
  onView: (template: BuilderTemplate) => void;
  onEdit: (template: BuilderTemplate) => void;
  onDuplicate: (template: BuilderTemplate) => void;
  onDelete: (template: BuilderTemplate) => void;
  onGenerate: (template: BuilderTemplate) => void;
}

const TYPE_COLORS: Partial<Record<BuilderDocumentType, string>> = {
  ASSIGNATION_FOND: 'bg-blue-100 text-blue-800',
  ASSIGNATION_REFERE: 'bg-blue-100 text-blue-800',
  CONCLUSIONS_DEFENSE: 'bg-purple-100 text-purple-800',
  CONCLUSIONS_RECAPITULATIVES: 'bg-purple-100 text-purple-800',
  MISE_EN_DEMEURE: 'bg-orange-100 text-orange-800',
  CONVOCATION_AUDIENCE: 'bg-green-100 text-green-800',
  CONTRAT_PRESTATION: 'bg-yellow-100 text-yellow-800',
  CONTRAT_TRAVAIL: 'bg-yellow-100 text-yellow-800',
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onGenerate,
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

  const typeColor = TYPE_COLORS[template.documentType] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Layers className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
              {template.isSystemTemplate && (
                <span title="Modele systeme">
                  <Lock className="h-4 w-4 text-gray-400" />
                </span>
              )}
            </div>
            <Badge className={`mt-1 ${typeColor}`}>
              {DOCUMENT_TYPE_LABELS[template.documentType]}
            </Badge>
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
                  onGenerate(template);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-2 font-medium"
              >
                <Play className="h-4 w-4" />
                Generer un document
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  onView(template);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir les details
              </button>
              <button
                onClick={() => {
                  onEdit(template);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                disabled={template.isSystemTemplate}
              >
                <Edit2 className="h-4 w-4" />
                Modifier
              </button>
              <button
                onClick={() => {
                  onDuplicate(template);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Dupliquer
              </button>
              {!template.isSystemTemplate && (
                <button
                  onClick={() => {
                    onDelete(template);
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

      {template.juridiction && (
        <p className="mt-2 text-sm text-gray-600">
          {JURIDICTION_LABELS[template.juridiction]}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {template.blocksStructure.length} bloc(s)
        </span>
        <span>{template.usageCount} utilisation(s)</span>
      </div>

      <div className="mt-4">
        <button
          onClick={() => onGenerate(template)}
          className="w-full py-2 px-3 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
        >
          <Play className="h-4 w-4" />
          Generer un document
        </button>
      </div>
    </div>
  );
};
