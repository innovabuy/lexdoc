import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  StarIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button, Badge, Spinner } from '@/components/ui';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import type { BuilderTemplate, BlockVariable } from '@/lib/types/documentBuilder';
import {
  TEMPLATE_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  JURIDICTION_LABELS,
  VARIABLE_TYPE_LABELS,
} from '@/lib/types/documentBuilder';

interface TemplateDetailsProps {
  template: BuilderTemplate | null;
  loading?: boolean;
  onToggleFavorite?: (templateId: string) => void;
  onDuplicate?: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
  onUseTemplate?: (templateId: string) => void;
  isDeleting?: boolean;
  isDuplicating?: boolean;
}

export const TemplateDetails: React.FC<TemplateDetailsProps> = ({
  template,
  loading,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onUseTemplate,
  isDeleting,
  isDuplicating,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <DocumentTextIcon className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Selectionnez un modele</p>
        <p className="text-sm mt-1">
          Choisissez un modele dans l'arborescence pour voir ses details
        </p>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/document-templates/${template.id}/edit`);
  };

  const handleUseTemplate = () => {
    if (onUseTemplate) {
      onUseTemplate(template.id);
    } else {
      navigate(`/document-generation/new?templateId=${template.id}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${template.color || '#3B82F6'}20` }}
            >
              <DocumentTextIcon
                className="w-6 h-6"
                style={{ color: template.color || '#3B82F6' }}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {template.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="gray" size="sm">
                  {TEMPLATE_CATEGORY_LABELS[template.category]}
                </Badge>
                {template.isSystemTemplate && (
                  <Badge variant="primary" size="sm">
                    Systeme
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(template.id)}
              className={cn(
                'p-2 rounded-full transition-colors',
                template.isFavorite
                  ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {template.isFavorite ? (
                <StarIconSolid className="w-6 h-6" />
              ) : (
                <StarIcon className="w-6 h-6" />
              )}
            </button>
          )}
        </div>

        {template.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {template.description}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircleIcon className="w-5 h-5" />}
            onClick={handleUseTemplate}
          >
            Utiliser ce modele
          </Button>
          {!template.isSystemTemplate && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<PencilSquareIcon className="w-5 h-5" />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            leftIcon={
              isDuplicating ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <DocumentDuplicateIcon className="w-5 h-5" />
              )
            }
            onClick={() => onDuplicate?.(template.id)}
            disabled={isDuplicating}
          >
            Dupliquer
          </Button>
          {!template.isSystemTemplate && onDelete && (
            <Button
              variant="danger"
              size="md"
              leftIcon={
                isDeleting ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <TrashIcon className="w-5 h-5" />
                )
              }
              onClick={() => onDelete(template.id)}
              disabled={isDeleting}
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <MetadataItem
            icon={<DocumentTextIcon className="w-5 h-5" />}
            label="Type de document"
            value={DOCUMENT_TYPE_LABELS[template.documentType]}
          />
          {template.juridiction && (
            <MetadataItem
              icon={<DocumentTextIcon className="w-5 h-5" />}
              label="Juridiction"
              value={JURIDICTION_LABELS[template.juridiction]}
            />
          )}
          <MetadataItem
            icon={<ClockIcon className="w-5 h-5" />}
            label="Derniere utilisation"
            value={
              template.lastUsedAt
                ? formatRelativeTime(template.lastUsedAt)
                : 'Jamais'
            }
          />
          <MetadataItem
            icon={<ArrowPathIcon className="w-5 h-5" />}
            label="Utilisations"
            value={`${template.usageCount} fois`}
          />
          <MetadataItem
            icon={<CalendarIcon className="w-5 h-5" />}
            label="Cree le"
            value={formatDate(template.createdAt)}
          />
          {template.createdBy && (
            <MetadataItem
              icon={<UserIcon className="w-5 h-5" />}
              label="Cree par"
              value={`${template.createdBy.firstName} ${template.createdBy.lastName}`}
            />
          )}
        </div>

        {/* Subcategory */}
        {template.subcategory && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sous-categorie
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{template.subcategory}</p>
          </div>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="gray" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Based on template */}
        {template.basedOnTemplate && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base sur
            </h3>
            <button
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400"
              onClick={() =>
                navigate(`/document-templates/${template.basedOnTemplate!.id}`)
              }
            >
              <DocumentTextIcon className="w-4 h-4" />
              {template.basedOnTemplate.name}
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Variables */}
        {template.requiredVariables && template.requiredVariables.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Variables requises ({template.requiredVariables.length})
            </h3>
            <div className="space-y-2">
              {template.requiredVariables.slice(0, 10).map((variable) => (
                <VariableItem key={variable.name} variable={variable} />
              ))}
              {template.requiredVariables.length > 10 && (
                <p className="text-sm text-gray-500 italic">
                  Et {template.requiredVariables.length - 10} autres variables...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Blocks count */}
        {template.blocksStructure && template.blocksStructure.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Structure
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {template.blocksStructure.length} bloc(s) de contenu
            </p>
          </div>
        )}

        {/* Workflow config */}
        {template.workflowConfig && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workflow
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.workflowConfig.signature?.enabled && (
                <Badge variant="success" size="sm">
                  Signature electronique
                </Badge>
              )}
              {template.workflowConfig.lrar?.enabled && (
                <Badge variant="primary" size="sm">
                  Envoi LRAR
                </Badge>
              )}
              {template.workflowConfig.autoStore?.enabled && (
                <Badge variant="gray" size="sm">
                  Stockage automatique
                </Badge>
              )}
              {!template.workflowConfig.signature?.enabled &&
                !template.workflowConfig.lrar?.enabled &&
                !template.workflowConfig.autoStore?.enabled && (
                  <span className="text-gray-500 text-sm">
                    Aucun workflow configure
                  </span>
                )}
            </div>
          </div>
        )}

        {/* Output format */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format de sortie
          </h3>
          <Badge variant="gray" size="sm">
            {template.outputFormat}
          </Badge>
        </div>
      </div>
    </div>
  );
};

interface MetadataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MetadataItem: React.FC<MetadataItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-gray-400 mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

interface VariableItemProps {
  variable: BlockVariable;
}

const VariableItem: React.FC<VariableItemProps> = ({ variable }) => (
  <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
    <code className="text-sm font-mono text-primary-600 dark:text-primary-400">
      {`{{${variable.name}}}`}
    </code>
    <Badge variant="gray" size="sm">
      {VARIABLE_TYPE_LABELS[variable.type]}
    </Badge>
    {variable.required && (
      <Badge variant="warning" size="sm">
        Requis
      </Badge>
    )}
    {variable.description && (
      <span className="text-xs text-gray-500 truncate flex-1">
        {variable.description}
      </span>
    )}
  </div>
);

export default TemplateDetails;
