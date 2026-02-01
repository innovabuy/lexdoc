import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Mail,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import type { LrarShipment, LrarStatus } from '@/lib/types';

interface Props {
  shipment: LrarShipment;
}

const statusConfig: Record<LrarStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  PENDING: { label: 'En preparation', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  PROCESSING: { label: 'Impression', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Package },
  SENT: { label: 'Envoye', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: Mail },
  IN_TRANSIT: { label: 'En transit', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Truck },
  DELIVERED: { label: 'Distribue', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  RETURNED: { label: 'Retourne', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: XCircle },
  ERROR: { label: 'Erreur', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  CANCELLED: { label: 'Annule', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

const LrarCard: React.FC<Props> = ({ shipment }) => {
  const status = statusConfig[shipment.status];
  const StatusIcon = status.icon;

  return (
    <Link
      to={`/lrar/${shipment.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {shipment.subject}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate">
              {shipment.recipient.firstName} {shipment.recipient.lastName} - {shipment.recipient.city}
            </span>
          </div>
        </div>

        <div className="flex items-center ml-4">
          <span
            className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${status.bgColor} ${status.color}
            `}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {shipment.trackingNumber ? (
          <div className="text-sm text-gray-500 font-mono">
            {shipment.trackingNumber}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">
            En attente de numero de suivi
          </div>
        )}

        <div className="flex items-center text-sm text-gray-400">
          <span>{formatDate(shipment.createdAt)}</span>
          <ChevronRight className="h-4 w-4 ml-2" />
        </div>
      </div>
    </Link>
  );
};

export default LrarCard;
