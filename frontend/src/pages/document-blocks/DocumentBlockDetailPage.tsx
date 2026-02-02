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
  Hash,
  Code,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useDocumentBlock,
  useDeleteDocumentBlock,
  useDuplicateDocumentBlock,
} from '@/hooks/useDocumentBuilder';
import { BLOCK_CATEGORY_LABELS, VARIABLE_TYPE_LABELS } from '@/lib/types/documentBuilder';
import type { BlockCategory, VariableType } from '@/lib/types/documentBuilder';

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

export const DocumentBlockDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: block, isLoading, error } = useDocumentBlock(id!);
  const deleteBlockMutation = useDeleteDocumentBlock();
  const duplicateBlockMutation = useDuplicateDocumentBlock();

  const handleDelete = async () => {
    if (!block) return;
    await deleteBlockMutation.mutateAsync(block.id);
    navigate('/document-blocks');
  };

  const handleDuplicate = async () => {
    if (!block) return;
    const duplicated = await duplicateBlockMutation.mutateAsync(block.id);
    navigate(`/document-blocks/${duplicated.id}/edit`);
  };

  const handleEdit = () => {
    navigate(`/document-blocks/${id}/edit`);
  };

  // Render content with syntax highlighting for variables
  const renderContentWithHighlight = (content: string) => {
    const parts = content.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        return (
          <span key={index} className="bg-yellow-100 text-yellow-800 px-1 rounded">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Chargement du bloc..." />
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bloc non trouvé</h2>
          <p className="text-gray-600 mb-4">
            Le bloc demandé n'existe pas ou vous n'avez pas les droits pour y accéder.
          </p>
          <Button onClick={() => navigate('/document-blocks')}>
            Retour à la liste
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
            to="/document-blocks"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{block.title}</h1>
              {block.isSystemBlock && (
                <span title="Bloc système" className="text-gray-400">
                  <Lock className="h-5 w-5" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={CATEGORY_COLORS[block.category]}>
                {BLOCK_CATEGORY_LABELS[block.category]}
              </Badge>
              {block.isMandatory && (
                <Badge variant="warning">Obligatoire</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {block.isSystemBlock ? (
            <Button
              variant="outline"
              onClick={handleDuplicate}
              disabled={duplicateBlockMutation.isPending}
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
          {/* Content Block */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Code className="h-5 w-5" />
                Contenu du bloc
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Code source' : 'Aperçu'}
              </Button>
            </div>

            {showPreview ? (
              <div
                className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border"
                dangerouslySetInnerHTML={{
                  __html: block.content
                    .replace(/\{\{([^}]+)\}\}/g, '<mark class="bg-yellow-200 px-1 rounded">[$1]</mark>')
                    .replace(/\n/g, '<br>')
                }}
              />
            ) : (
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {renderContentWithHighlight(block.content)}
              </pre>
            )}
          </Card>

          {/* Variables */}
          {block.variables && block.variables.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Variables ({block.variables.length})
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
                    {block.variables.map((variable, index) => (
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
                <dt className="text-sm font-medium text-gray-500">Catégorie</dt>
                <dd className="mt-1">
                  <Badge className={CATEGORY_COLORS[block.category]}>
                    {BLOCK_CATEGORY_LABELS[block.category]}
                  </Badge>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {block.isSystemBlock ? 'Bloc système' : 'Bloc personnalisé'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Utilisations</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {block.usageCount || 0} fois
                </dd>
              </div>

              {block.tags && block.tags.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {block.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Créé le {new Date(block.createdAt).toLocaleDateString('fr-FR')}
                </div>
                {block.createdBy && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <User className="h-4 w-4" />
                    Par {block.createdBy.firstName} {block.createdBy.lastName}
                  </div>
                )}
              </div>
            </dl>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDuplicate}
                disabled={duplicateBlockMutation.isPending}
              >
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer ce bloc
              </Button>
              {!block.isSystemBlock && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier le bloc
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
        title="Supprimer le bloc"
        message={`Êtes-vous sûr de vouloir supprimer le bloc "${block.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteBlockMutation.isPending}
      />
    </div>
  );
};

export default DocumentBlockDetailPage;
