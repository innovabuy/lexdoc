import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Copy,
  Trash2,
  Lock,
  Calendar,
  User,
  FileText,
  Layers,
  Hash,
  Settings,
  Scale,
  Play,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useBuilderTemplate,
  useDeleteBuilderTemplate,
  useDuplicateBuilderTemplate,
} from '@/hooks/useDocumentBuilder';
import {
  DOCUMENT_TYPE_LABELS,
  JURIDICTION_LABELS,
  BLOCK_CATEGORY_LABELS,
  VARIABLE_TYPE_LABELS,
  type BlockCategory,
  type VariableType,
} from '@/lib/types/documentBuilder';

// Category color mapping
const CATEGORY_COLORS: Record<BlockCategory, string> = {
  INTRO: 'bg-blue-100 text-blue-800',
  FAITS: 'bg-green-100 text-green-800',
  MOYENS: 'bg-purple-100 text-purple-800',
  DISPOSITIF: 'bg-orange-100 text-orange-800',
  SIGNATURE: 'bg-pink-100 text-pink-800',
  CLAUSE: 'bg-yellow-100 text-yellow-800',
  MENTION_LEGALE: 'bg-gray-100 text-gray-800',
  CUSTOM: 'bg-indigo-100 text-indigo-800',
  NOTE_LIBRE: 'bg-cyan-100 text-cyan-800',
};

// Variable type colors
const VARIABLE_TYPE_COLORS: Record<VariableType, string> = {
  string: 'bg-blue-100 text-blue-700',
  number: 'bg-green-100 text-green-700',
  date: 'bg-purple-100 text-purple-700',
  boolean: 'bg-orange-100 text-orange-700',
  text: 'bg-cyan-100 text-cyan-700',
  array: 'bg-pink-100 text-pink-700',
};

export const TemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: template, isLoading, error } = useBuilderTemplate(id!);
  const deleteTemplateMutation = useDeleteBuilderTemplate();
  const duplicateTemplateMutation = useDuplicateBuilderTemplate();

  const handleDelete = async () => {
    if (!template) return;
    await deleteTemplateMutation.mutateAsync(template.id);
    navigate('/document-templates');
  };

  const handleDuplicate = async () => {
    if (!template) return;
    const duplicated = await duplicateTemplateMutation.mutateAsync(template.id);
    navigate(`/document-templates/${duplicated.id}/edit`);
  };

  const handleEdit = () => {
    navigate(`/document-templates/${id}/edit`);
  };

  const handleGenerate = () => {
    navigate(`/document-builder/generate/${id}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Chargement du template..." />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Template non trouve</h2>
          <p className="text-gray-600 mb-4">
            Le template demande n'existe pas ou vous n'avez pas les droits pour y acceder.
          </p>
          <Button onClick={() => navigate('/document-templates')}>
            Retour a la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/document-templates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              {template.isSystemTemplate && (
                <span title="Template systeme" className="text-gray-400">
                  <Lock className="h-5 w-5" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-blue-100 text-blue-800">
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

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={handleGenerate}>
            <Play className="h-4 w-4 mr-2" />
            Generer un document
          </Button>
          {template.isSystemTemplate ? (
            <Button
              variant="outline"
              onClick={handleDuplicate}
              disabled={duplicateTemplateMutation.isPending}
            >
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {template.description && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600">{template.description}</p>
            </Card>
          )}

          {/* Blocks Structure */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Structure du template ({template.blocksStructure?.length || 0} blocs)
            </h2>

            {template.expandedBlocks && template.expandedBlocks.length > 0 ? (
              <div className="space-y-3">
                {template.expandedBlocks.map((ref, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      ref.isOptional
                        ? 'border-dashed border-gray-300 bg-gray-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {ref.block?.title || 'Bloc introuvable'}
                        </span>
                        {ref.isOptional && (
                          <Badge className="text-xs border border-gray-300 bg-white text-gray-700">Optionnel</Badge>
                        )}
                      </div>
                      {ref.block && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${CATEGORY_COLORS[ref.block.category]}`}>
                            {BLOCK_CATEGORY_LABELS[ref.block.category]}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {ref.block.variables?.length || 0} variables
                          </span>
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/document-blocks/${ref.blockId}`}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Voir le bloc
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun bloc configure</p>
            )}
          </Card>

          {/* Variables */}
          {template.requiredVariables && template.requiredVariables.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Variables requises ({template.requiredVariables.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requis
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {template.requiredVariables.map((variable, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {`{{${variable.name}}}`}
                          </code>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={VARIABLE_TYPE_COLORS[variable.type]}>
                            {VARIABLE_TYPE_LABELS[variable.type]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {variable.required ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Oui
                            </span>
                          ) : (
                            <span className="text-gray-400">Non</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {variable.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations
            </h2>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type de document</dt>
                <dd className="mt-1">
                  <Badge className="bg-blue-100 text-blue-800">
                    {DOCUMENT_TYPE_LABELS[template.documentType]}
                  </Badge>
                </dd>
              </div>

              {template.juridiction && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Juridiction</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {JURIDICTION_LABELS[template.juridiction]}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Format de sortie</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {template.outputFormat === 'DOCX' ? 'Word (.docx)' : 'PDF (.pdf)'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {template.isSystemTemplate ? 'Template systeme' : 'Template personnalise'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Utilisations</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {template.usageCount || 0} fois
                </dd>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Cree le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                </div>
                {template.createdBy && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <User className="h-4 w-4" />
                    Par {template.createdBy.firstName} {template.createdBy.lastName}
                  </div>
                )}
              </div>
            </dl>
          </Card>

          {/* Workflow Config */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Workflow
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Signature electronique</span>
                {template.workflowConfig?.signature?.enabled ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Desactive</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Envoi LRAR</span>
                {template.workflowConfig?.lrar?.enabled ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Desactive</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stockage auto</span>
                {template.workflowConfig?.autoStore?.enabled ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Desactive</Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Legal Mentions */}
          {template.legalMentions && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Mentions legales
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidentialite</span>
                  {template.legalMentions.confidentiality ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="default">Desactive</Badge>
                  )}
                </div>
                {template.legalMentions.header && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">En-tete</span>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {template.legalMentions.header}
                    </p>
                  </div>
                )}
                {template.legalMentions.footer && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Pied de page</span>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {template.legalMentions.footer}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full justify-start"
                onClick={handleGenerate}
              >
                <Play className="h-4 w-4 mr-2" />
                Generer un document
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDuplicate}
                disabled={duplicateTemplateMutation.isPending}
              >
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer ce template
              </Button>
              {!template.isSystemTemplate && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier le template
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer le template"
        message={`Etes-vous sur de vouloir supprimer le template "${template.name}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteTemplateMutation.isPending}
      />
    </div>
  );
};

export default TemplateDetailPage;
