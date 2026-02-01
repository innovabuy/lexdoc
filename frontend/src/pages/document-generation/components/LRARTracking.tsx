import React from 'react';
import {
  Mail,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Download,
  MapPin,
  Calendar,
  Loader2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { LrarTrackingStatus } from '@/lib/api/documentBuilder';

interface LRARTrackingProps {
  tracking: LrarTrackingStatus | null;
  isLoading?: boolean;
  onDownloadProof?: () => void;
  onDownloadAR?: () => void;
}

// Status configuration
const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  PENDING: {
    label: 'En attente',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  PROCESSING: {
    label: 'En preparation',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  SENT: {
    label: 'Poste',
    icon: Mail,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  IN_TRANSIT: {
    label: 'En cours de livraison',
    icon: Truck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  DELIVERED: {
    label: 'Livre',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  RETURNED: {
    label: 'Retourne',
    icon: RotateCcw,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  ERROR: {
    label: 'Erreur',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

// Event type to icon mapping
const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  printed: Package,
  sent: Mail,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  returned: RotateCcw,
};

export const LRARTracking: React.FC<LRARTrackingProps> = ({
  tracking,
  isLoading = false,
  onDownloadProof,
  onDownloadAR,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucun envoi LRAR pour ce document</p>
        </div>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[tracking.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Suivi LRAR</h3>
              <p className="text-sm text-gray-500">
                Lettre ID: {tracking.letterId.slice(0, 12)}...
              </p>
            </div>
          </div>
          <Badge
            variant={
              tracking.status === 'DELIVERED' ? 'success' :
              tracking.status === 'RETURNED' || tracking.status === 'ERROR' ? 'error' :
              'gray'
            }
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Tracking Info */}
      <div className="p-4 space-y-4">
        {/* Tracking Number */}
        {tracking.trackingNumber && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">N de suivi:</span>
            <span className="font-mono font-medium text-gray-900">
              {tracking.trackingNumber}
            </span>
          </div>
        )}

        {/* Estimated Delivery */}
        {tracking.estimatedDelivery && tracking.status !== 'DELIVERED' && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Livraison estimee:</span>
            <span className="font-medium text-gray-900">
              {formatDate(tracking.estimatedDelivery)}
            </span>
          </div>
        )}

        {/* Delivered At */}
        {tracking.deliveredAt && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-gray-500">Livre le:</span>
            <span className="font-medium text-green-700">
              {formatDate(tracking.deliveredAt)}
            </span>
          </div>
        )}

        {/* Events Timeline */}
        {tracking.events && tracking.events.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Historique</h4>
            <div className="space-y-3">
              {tracking.events.map((event, index) => {
                const EventIcon = EVENT_ICONS[event.type.toLowerCase()] || Mail;
                const isLast = index === 0;
                const isFirst = index === tracking.events.length - 1;

                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`p-1.5 rounded-full ${isLast ? 'bg-primary-100' : 'bg-gray-100'}`}>
                        <EventIcon className={`h-3.5 w-3.5 ${isLast ? 'text-primary-600' : 'text-gray-400'}`} />
                      </div>
                      {!isFirst && (
                        <div className="w-0.5 h-full bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isLast ? 'text-gray-900' : 'text-gray-600'}`}>
                          {event.description || event.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span>{formatEventDate(event.date)} {formatEventTime(event.date)}</span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty events */}
        {(!tracking.events || tracking.events.length === 0) && (
          <div className="py-4 text-center text-sm text-gray-500">
            <Clock className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p>En attente des mises a jour de suivi...</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
        {onDownloadProof && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadProof}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Preuve de depot
          </Button>
        )}
        {tracking.proofAvailable && onDownloadAR && (
          <Button
            variant="primary"
            size="sm"
            onClick={onDownloadAR}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Telecharger AR
          </Button>
        )}
        {!tracking.proofAvailable && tracking.status !== 'DELIVERED' && (
          <p className="text-xs text-gray-500 text-center w-full py-2">
            L'accuse de reception sera disponible apres livraison
          </p>
        )}
      </div>
    </Card>
  );
};

export default LRARTracking;
