import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Copy,
  Pencil,
  Trash2,
  Eye,
  Lock,
  Layers,
  Calendar,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { BuilderTemplate, BuilderDocumentType } from '@/lib/types/documentBuilder';
import { DOCUMENT_TYPE_LABELS, JURIDICTION_LABELS } from '@/lib/types/documentBuilder';

// Document type color mapping
const DOCUMENT_TYPE_COLORS: Partial<Record<BuilderDocumentType, string>> = {
  ASSIGNATION_FOND: 'bg-blue-100 text-blue-800',
  ASSIGNATION_REFERE: 'bg-blue-100 text-blue-800',
  CONCLUSIONS_DEFENSE: 'bg-purple-100 text-purple-800',
  CONCLUSIONS_RECAPITULATIVES: 'bg-purple-100 text-purple-800',
  MISE_EN_DEMEURE: 'bg-orange-100 text-orange-800',
  CONTRAT_PRESTATION: 'bg-green-100 text-green-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
};

interface TemplateCardProps {
  template: BuilderTemplate;
  onDuplicate?: (template: BuilderTemplate) => void;
  onDelete?: (template: BuilderTemplate) => void;
  duplicating?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onDuplicate,
  onDelete,
  duplicating,
}) => {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/document-templates/${template.id}`);
  };

  const handleEdit = () => {
    navigate(`/document-templates/${template.id}/edit`);
  };

  const colorClass = DOCUMENT_TYPE_COLORS[template.documentType] || 'bg-gray-100 text-gray-800';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
              {template.isSystemTemplate && (
                <span title="Modele systeme">
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={colorClass}>
                {DOCUMENT_TYPE_LABELS[template.documentType]}
              </Badge>
              {template.juridiction && (
                <Badge className="border border-gray-300 bg-white text-gray-700">
                  {JURIDICTION_LABELS[template.juridiction]}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{template.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Layers className="h-4 w-4" />
          {template.blocksStructure?.length || 0} blocs
        </span>
        <span>•</span>
        <span>
          {template.requiredVariables?.length || 0} variables
        </span>
        <span>•</span>
        <span>
          Utilise {template.usageCount || 0} fois
        </span>
      </div>

      {/* Workflow badges */}
      <div className="flex items-center gap-2 mt-3">
        {template.workflowConfig?.signature?.enabled && (
          <Badge variant="success" className="text-xs">Signature</Badge>
        )}
        {template.workflowConfig?.lrar?.enabled && (
          <Badge variant="warning" className="text-xs">LRAR</Badge>
        )}
        {template.workflowConfig?.autoStore?.enabled && (
          <Badge className="text-xs bg-blue-100 text-blue-700">Stockage auto</Badge>
        )}
      </div>

      {/* Created date */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
        <Calendar className="h-3 w-3" />
        Cree le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
        <Button variant="ghost" size="sm" onClick={handleView}>
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </Button>
        {template.isSystemTemplate ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate?.(template)}
            disabled={duplicating}
          >
            <Copy className="h-4 w-4 mr-1" />
            Dupliquer
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(template)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default TemplateCard;
