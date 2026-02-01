import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  Send,
  PenTool,
  FileText,
  Folder,
  Calendar,
  User,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useGeneratedDocument,
  useGeneratedDocumentPreview,
  useFinalizeDocument,
  useRegenerateDocument,
  useDeleteGeneratedDocument,
  useDuplicateGeneratedDocument,
} from '@/hooks/useDocumentBuilder';
import type { GeneratedDocumentStatus } from '@/lib/types/documentBuilder';
import { GENERATED_STATUS_LABELS } from '@/lib/types/documentBuilder';

const STATUS_ICONS: Record<GeneratedDocumentStatus, React.ElementType> = {
  DRAFT: Clock,
  FINALIZED: CheckCircle,
  SENT: Send,
  SIGNED: PenTool,
};

const STATUS_COLORS: Record<GeneratedDocumentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  FINALIZED: 'bg-green-100 text-green-700',
  SENT: 'bg-blue-100 text-blue-700',
  SIGNED: 'bg-purple-100 text-purple-700',
};

export const GeneratedDocumentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: document, isLoading, error } = useGeneratedDocument(documentId);
  const { data: preview } = useGeneratedDocumentPreview(documentId);
  const finalizeMutation = useFinalizeDocument();
  const regenerateMutation = useRegenerateDocument();
  const deleteMutation = useDeleteGeneratedDocument();
  const duplicateMutation = useDuplicateGeneratedDocument();

  const handleFinalize = async () => {
    if (!documentId) return;
    await finalizeMutation.mutateAsync({ id: documentId });
  };

  const handleRegenerate = async () => {
    if (!documentId) return;
    await regenerateMutation.mutateAsync(documentId);
  };

  const handleDuplicate = async () => {
    if (!documentId) return;
    const newDoc = await duplicateMutation.mutateAsync(documentId);
    navigate(`/document-builder/documents/${newDoc.id}`);
  };

  const handleDelete = async () => {
    if (!documentId) return;
    await deleteMutation.mutateAsync(documentId);
    navigate('/document-builder');
  };

  const handleDownload = () => {
    if (!preview?.html) return;
    // Create a downloadable HTML file
    const blob = new Blob([preview.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document?.title || 'document'}.html`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingState message="Chargement du document..." />;
  }

  if (error || !document) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement du document</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[document.status];
  const isDraft = document.status === 'DRAFT';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <Badge className={STATUS_COLORS[document.status]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {GENERATED_STATUS_LABELS[document.status]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
          {isDraft && (
            <>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                isLoading={regenerateMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerer
              </Button>
              <Button onClick={handleFinalize} isLoading={finalizeMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finaliser
              </Button>
            </>
          )}
          {!isDraft && (
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Telecharger
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
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
              <p className="text-sm text-gray-500">Modele</p>
              <p className="font-medium">{document.template?.name || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Folder className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dossier</p>
              <p className="font-medium">{document.folder?.name || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cree le</p>
              <p className="font-medium">
                {new Date(document.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Par</p>
              <p className="font-medium">
                {document.createdBy
                  ? `${document.createdBy.firstName} ${document.createdBy.lastName}`
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Variables Used */}
      {document.filledVariables && Object.keys(document.filledVariables).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Variables utilisees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(document.filledVariables).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{key}</p>
                <p className="font-medium text-gray-900">
                  {typeof value === 'boolean'
                    ? value
                      ? 'Oui'
                      : 'Non'
                    : String(value) || '-'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Apercu du document</h2>
        {preview?.html ? (
          <div
            className="prose max-w-none bg-white border border-gray-200 rounded-lg p-8 min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 max-h-[500px] overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
              {document.generatedContent || 'Aucun apercu disponible'}
            </pre>
          </div>
        )}
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        message={`Etes-vous sur de vouloir supprimer le document "${document.title}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default GeneratedDocumentDetailPage;
