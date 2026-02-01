import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Edit,
  FileText,
  Clock,
  User,
  Layers,
  Play,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { useBuilderTemplate, useBuilderTemplateVariables } from '@/hooks/useDocumentBuilder';
import {
  DOCUMENT_TYPE_LABELS,
  JURIDICTION_LABELS,
  BLOCK_CATEGORY_LABELS,
  VARIABLE_TYPE_LABELS,
} from '@/lib/types/documentBuilder';

export const TemplateDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const { data: template, isLoading, error } = useBuilderTemplate(templateId);
  const { data: variables } = useBuilderTemplateVariables(templateId);

  if (isLoading) {
    return <LoadingState message="Chargement du modele..." />;
  }

  if (error || !template) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement du modele</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            {template.isSystemTemplate && (
              <Badge className="bg-blue-100 text-blue-700">Systeme</Badge>
            )}
          </div>
          {template.description && (
            <p className="text-gray-500 mt-1">{template.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/document-builder/templates/${templateId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={() => navigate(`/document-builder/generate/${templateId}`)}>
            <Play className="h-4 w-4 mr-2" />
            Generer un document
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{DOCUMENT_TYPE_LABELS[template.documentType]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Layers className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Juridiction</p>
              <p className="font-medium">{template.juridiction ? JURIDICTION_LABELS[template.juridiction] : '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Utilisations</p>
              <p className="font-medium">{template.usageCount || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cree le</p>
              <p className="font-medium">
                {new Date(template.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Blocks */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          Blocs ({template.expandedBlocks?.length || template.blocks?.length || 0})
        </h2>
        <div className="space-y-3">
          {(template.expandedBlocks || []).map((ref, index) => (
            <div
              key={`${ref.blockId}-${index}`}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-medium text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">
                    {ref.block?.title || 'Bloc inconnu'}
                  </p>
                  {ref.isOptional && (
                    <Badge className="bg-yellow-100 text-yellow-700">Optionnel</Badge>
                  )}
                </div>
                {ref.block && (
                  <p className="text-sm text-gray-500">
                    {BLOCK_CATEGORY_LABELS[ref.block.category]}
                    {ref.block.variables && ref.block.variables.length > 0 && (
                      <span className="ml-2">
                        - {ref.block.variables.length} variable(s)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
          {(!template.expandedBlocks || template.expandedBlocks.length === 0) && (
            <p className="text-center text-gray-500 py-8">
              Aucun bloc dans ce modele
            </p>
          )}
        </div>
      </Card>

      {/* Variables */}
      {variables && variables.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Variables ({variables.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variables.map((variable) => (
              <div
                key={variable.name}
                className="p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-primary-600">
                    {`{{${variable.name}}}`}
                  </code>
                  <Badge
                    className={
                      variable.required
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {variable.required ? 'Obligatoire' : 'Optionnel'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {VARIABLE_TYPE_LABELS[variable.type]}
                </p>
                {variable.description && (
                  <p className="text-xs text-gray-400 mt-1">{variable.description}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TemplateDetailPage;
