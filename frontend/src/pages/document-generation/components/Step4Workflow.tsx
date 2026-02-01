import React, { useState } from 'react';
import {
  ChevronLeft,
  Download,
  Send,
  PenTool,
  Mail,
  CheckCircle,
  FileText,
  Loader2,
  ExternalLink,
  Copy,
  Save,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useSendDocumentForSignature } from '@/hooks/useDocumentBuilder';
import type { GeneratedDocument, OutputFormat, WorkflowConfig } from '@/lib/types/documentBuilder';
import SignatureModal from './SignatureModal';

interface Step4WorkflowProps {
  documentId?: string;
  document?: GeneratedDocument;
  templateName: string;
  workflowConfig?: WorkflowConfig;
  onBack: () => void;
  onFinalize: (options: { outputFormat: OutputFormat }) => Promise<void>;
  onSendLrar?: () => Promise<void>;
  isLoading?: boolean;
  // Pre-filled signatories from client/avocat data
  prefilledSignatories?: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: 'client' | 'avocat' | 'partie_adverse' | 'temoin' | 'autre';
  }>;
}

type ActionType = 'download' | 'signature' | 'lrar' | null;

export const Step4Workflow: React.FC<Step4WorkflowProps> = ({
  documentId,
  document,
  templateName,
  workflowConfig,
  onBack,
  onFinalize,
  onSendLrar,
  isLoading = false,
  prefilledSignatories = [],
}) => {
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('PDF');
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [completedActions, setCompletedActions] = useState<ActionType[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const sendSignatureMutation = useSendDocumentForSignature();

  const hasSignature = workflowConfig?.signature?.enabled;
  const hasLrar = workflowConfig?.lrar?.enabled;
  const hasAutoStore = workflowConfig?.autoStore?.enabled;

  // Check if document is finalized (required for signature)
  const isFinalized = document?.status === 'FINALIZED' || completedActions.includes('download');

  const handleDownload = async () => {
    setActiveAction('download');
    try {
      await onFinalize({ outputFormat });
      setCompletedActions((prev) => [...prev, 'download']);
      toast.success('Document finalise et telecharge avec succes');
    } catch {
      toast.error('Erreur lors du telechargement');
    } finally {
      setActiveAction(null);
    }
  };

  const handleOpenSignatureModal = () => {
    if (!isFinalized) {
      toast.error('Veuillez d\'abord finaliser le document');
      return;
    }
    setShowSignatureModal(true);
  };

  const handleSendSignature = async (data: {
    signatories: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      role: 'client' | 'avocat' | 'partie_adverse' | 'temoin' | 'autre';
    }>;
    signingOrder: 'sequential' | 'parallel';
    customMessage?: string;
  }) => {
    if (!documentId) {
      toast.error('Document non trouve');
      return;
    }

    try {
      await sendSignatureMutation.mutateAsync({
        id: documentId,
        input: {
          signatories: data.signatories,
          signingOrder: data.signingOrder,
          customMessage: data.customMessage,
          profile: workflowConfig?.signature?.profile?.toLowerCase() as 'default' | 'certified' | 'advanced' || 'default',
        },
      });
      setShowSignatureModal(false);
      setCompletedActions((prev) => [...prev, 'signature']);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleLrar = async () => {
    if (!onSendLrar) return;
    setActiveAction('lrar');
    try {
      await onSendLrar();
      setCompletedActions((prev) => [...prev, 'lrar']);
      toast.success('LRAR preparee avec succes');
    } catch {
      toast.error('Erreur lors de la preparation LRAR');
    } finally {
      setActiveAction(null);
    }
  };

  const copyDocumentLink = () => {
    if (documentId) {
      navigator.clipboard.writeText(`${window.location.origin}/document-generation/documents/${documentId}`);
      toast.success('Lien copie dans le presse-papiers');
    }
  };

  const isActionComplete = (action: ActionType) => completedActions.includes(action);
  const isActionActive = (action: ActionType) => activeAction === action;

  return (
    <div className="space-y-6">
      {/* Document Summary */}
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{templateName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Document pret a etre finalise
            </p>
            {document?.status && (
              <Badge
                variant={document.status === 'FINALIZED' ? 'success' : document.status === 'SIGNED' ? 'success' : 'gray'}
                className="mt-2"
              >
                {document.status === 'DRAFT' && 'Brouillon'}
                {document.status === 'FINALIZED' && 'Finalise'}
                {document.status === 'SENT' && 'En attente de signature'}
                {document.status === 'SIGNED' && 'Signe'}
              </Badge>
            )}
          </div>
          {documentId && (
            <Button variant="ghost" size="sm" onClick={copyDocumentLink}>
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* Output Format Selection */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Format de sortie</h4>
        <div className="flex gap-4">
          {(['PDF', 'DOCX'] as OutputFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => setOutputFormat(format)}
              className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                outputFormat === format
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className={`h-5 w-5 ${outputFormat === format ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${outputFormat === format ? 'text-primary-700' : 'text-gray-700'}`}>
                  {format}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {format === 'PDF' ? 'Format universel' : 'Modifiable'}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Download/Save */}
        <Card className={`p-4 ${isActionComplete('download') ? 'border-green-200 bg-green-50' : ''}`}>
          <div className="flex flex-col items-center text-center">
            <div className={`p-3 rounded-full mb-3 ${
              isActionComplete('download') ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isActionComplete('download') ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Download className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Telecharger</h4>
            <p className="text-xs text-gray-500 mb-4">
              Finaliser et telecharger le document en {outputFormat}
            </p>
            <Button
              onClick={handleDownload}
              disabled={isLoading || isActionActive('download')}
              variant={isActionComplete('download') ? 'ghost' : 'primary'}
              className="w-full"
            >
              {isActionActive('download') ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Telechargement...
                </>
              ) : isActionComplete('download') ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Telecharge
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Telecharger
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Signature */}
        <Card className={`p-4 ${!hasSignature ? 'opacity-50' : ''} ${isActionComplete('signature') ? 'border-green-200 bg-green-50' : ''}`}>
          <div className="flex flex-col items-center text-center">
            <div className={`p-3 rounded-full mb-3 ${
              isActionComplete('signature') ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {isActionComplete('signature') ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <PenTool className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Signature electronique</h4>
            <p className="text-xs text-gray-500 mb-4">
              {!hasSignature
                ? 'Non configure pour ce modele'
                : !isFinalized
                ? 'Finalisez d\'abord le document'
                : 'Envoyer le document pour signature'}
            </p>
            <Button
              onClick={handleOpenSignatureModal}
              disabled={!hasSignature || !isFinalized || isLoading || isActionComplete('signature')}
              variant={isActionComplete('signature') ? 'ghost' : 'outline'}
              className="w-full"
            >
              {isActionComplete('signature') ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Envoye
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4 mr-2" />
                  Configurer la signature
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* LRAR */}
        <Card className={`p-4 ${!hasLrar ? 'opacity-50' : ''} ${isActionComplete('lrar') ? 'border-green-200 bg-green-50' : ''}`}>
          <div className="flex flex-col items-center text-center">
            <div className={`p-3 rounded-full mb-3 ${
              isActionComplete('lrar') ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {isActionComplete('lrar') ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Mail className="h-6 w-6 text-orange-600" />
              )}
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Envoi LRAR</h4>
            <p className="text-xs text-gray-500 mb-4">
              {hasLrar
                ? 'Preparer l\'envoi en recommande'
                : 'Non configure pour ce modele'}
            </p>
            <Button
              onClick={handleLrar}
              disabled={!hasLrar || isLoading || isActionActive('lrar')}
              variant={isActionComplete('lrar') ? 'ghost' : 'outline'}
              className="w-full"
            >
              {isActionActive('lrar') ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparation...
                </>
              ) : isActionComplete('lrar') ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Prepare
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Preparer LRAR
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Auto-store Info */}
      {hasAutoStore && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <Save className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Archivage automatique:</strong> Le document sera automatiquement
                enregistre dans le dossier selectionne.
              </p>
              {workflowConfig?.autoStore?.folderPath && (
                <p className="text-xs text-blue-600 mt-1">
                  Chemin: {workflowConfig.autoStore.folderPath}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Completion Summary */}
      {completedActions.length > 0 && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-800 font-medium">
                Actions completees
              </p>
              <div className="flex gap-2 mt-1">
                {completedActions.map((action) => (
                  <Badge key={action} variant="success" className="text-xs">
                    {action === 'download' && 'Telecharge'}
                    {action === 'signature' && 'Signature envoyee'}
                    {action === 'lrar' && 'LRAR preparee'}
                  </Badge>
                ))}
              </div>
            </div>
            {documentId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/document-generation/documents/${documentId}`, '_blank')}
                className="ml-auto"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Voir le document
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour a l'apercu
        </Button>
        {completedActions.length > 0 && (
          <Button variant="primary" onClick={() => window.location.href = '/document-generation'}>
            <Send className="h-4 w-4 mr-2" />
            Nouveau document
          </Button>
        )}
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSubmit={handleSendSignature}
        documentTitle={templateName}
        initialSignatories={prefilledSignatories}
        isLoading={sendSignatureMutation.isPending}
      />
    </div>
  );
};

export default Step4Workflow;
