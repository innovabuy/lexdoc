import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useSignature, useCancelSignature } from '@/hooks/useSignatures';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SignatureTracking } from '@/components/signatures';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const SignatureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: signature, isLoading } = useSignature(id!);
  const cancelMutation = useCancelSignature();
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  const handleCancel = () => {
    cancelMutation.mutate(id!, {
      onSuccess: () => {
        setShowCancelDialog(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!signature) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Signature introuvable</p>
        <Link to="/signatures" className="text-primary-600 hover:underline mt-2 inline-block">
          Retour a la liste
        </Link>
      </div>
    );
  }

  const canCancel = signature.status === 'PENDING' || signature.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/signatures"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {signature.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Suivi de la signature
            </p>
          </div>
        </div>

        {canCancel && (
          <Button
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        )}
      </div>

      {/* Tracking */}
      <SignatureTracking signatureId={id!} />

      {/* Cancel confirmation dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Annuler la signature"
        message="Etes-vous sur de vouloir annuler cette demande de signature ? Cette action est irreversible."
        confirmLabel="Annuler la signature"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};

export default SignatureDetailPage;
