import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useLrarShipment, useCancelLrar } from '@/hooks/useLrar';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LrarTracking } from '@/components/lrar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const LrarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: shipment, isLoading } = useLrarShipment(id!);
  const cancelMutation = useCancelLrar();
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

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Envoi LRAR introuvable</p>
        <Link to="/lrar" className="text-primary-600 hover:underline mt-2 inline-block">
          Retour a la liste
        </Link>
      </div>
    );
  }

  const canCancel = shipment.status === 'PENDING' || shipment.status === 'PROCESSING';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/lrar"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {shipment.subject}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Suivi de l'envoi LRAR
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
      <LrarTracking lrarId={id!} />

      {/* Cancel confirmation dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Annuler l'envoi"
        message="Etes-vous sur de vouloir annuler cet envoi LRAR ? Cette action n'est possible que si le courrier n'a pas encore ete imprime."
        confirmLabel="Annuler l'envoi"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};

export default LrarDetailPage;
