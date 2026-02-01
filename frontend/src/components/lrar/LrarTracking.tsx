import React from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Mail,
  Download,
  MapPin,
} from 'lucide-react';
import { useLrarShipment, useDownloadProof } from '@/hooks/useLrar';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils/formatters';
import type { LrarStatus } from '@/lib/types';

interface Props {
  lrarId: string;
}

const statusConfig: Record<LrarStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  PENDING: { label: 'En preparation', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  PROCESSING: { label: 'En cours d\'impression', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Package },
  SENT: { label: 'Envoye', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: Mail },
  IN_TRANSIT: { label: 'En transit', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Truck },
  DELIVERED: { label: 'Distribue', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  RETURNED: { label: 'Retourne', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: XCircle },
  ERROR: { label: 'Erreur', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  CANCELLED: { label: 'Annule', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

const LrarTracking: React.FC<Props> = ({ lrarId }) => {
  const { data: shipment, isLoading } = useLrarShipment(lrarId);
  const downloadProofMutation = useDownloadProof();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-12 text-gray-500">
        Envoi LRAR introuvable
      </div>
    );
  }

  const status = statusConfig[shipment.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Global status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statut de l'envoi
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${status.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${status.color}`} />
            </div>
            <div>
              <p className={`text-lg font-semibold ${status.color}`}>
                {status.label}
              </p>
              <p className="text-sm text-gray-500">
                {shipment.subject}
              </p>
            </div>
          </div>

          {shipment.status === 'DELIVERED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadProofMutation.mutate(lrarId)}
              isLoading={downloadProofMutation.isPending}
            >
              <Download className="h-4 w-4 mr-1" />
              Telecharger l'AR
            </Button>
          )}
        </div>

        {shipment.trackingNumber && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Numero de suivi</p>
            <p className="font-mono font-medium text-gray-900">
              {shipment.trackingNumber}
            </p>
          </div>
        )}

        {shipment.estimatedDeliveryAt && shipment.status !== 'DELIVERED' && (
          <p className="text-sm text-gray-500 mt-4">
            Livraison estimee le {formatDate(shipment.estimatedDeliveryAt)}
          </p>
        )}

        {shipment.deliveredAt && (
          <p className="text-sm text-green-600 mt-4">
            Distribue le {formatDate(shipment.deliveredAt)}
          </p>
        )}
      </div>

      {/* Tracking events */}
      {shipment.trackingEvents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Suivi du courrier
          </h3>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {shipment.trackingEvents.map((event, index) => (
                <div key={event.id} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div
                    className={`
                      absolute left-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${index === 0 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}
                    `}
                  >
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>

                  {/* Event content */}
                  <div className="ml-12">
                    <p className="font-medium text-gray-900">
                      {event.status}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <span>{formatDate(event.eventAt)}</span>
                      {event.location && (
                        <>
                          <span className="mx-2">-</span>
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recipient info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Destinataire
        </h3>
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">
              {shipment.recipient.firstName} {shipment.recipient.lastName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {shipment.recipient.address}
            </p>
            <p className="text-sm text-gray-500">
              {shipment.recipient.postalCode} {shipment.recipient.city}
            </p>
          </div>
        </div>
      </div>

      {/* Document info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Document
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              {shipment.document.title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Initie par {shipment.initiator.firstName} {shipment.initiator.lastName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cree le {formatDate(shipment.createdAt)}
            </p>
          </div>
          {shipment.cost && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Cout</p>
              <p className="font-medium text-gray-900">
                {shipment.cost.toFixed(2)} EUR
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LrarTracking;
