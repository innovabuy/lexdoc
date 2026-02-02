import React from 'react';
import {
  Clock,
  PenTool,
  Check,
  Mail,
  Truck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { DocumentTrackingStatus, DeliveryMethod } from '@/lib/types';

interface DocumentStatusBadgeProps {
  status?: DocumentTrackingStatus;
  deliveryMethod?: DeliveryMethod;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig: Record<
  DocumentTrackingStatus,
  {
    label: string;
    variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gray';
    icon: React.ElementType;
  }
> = {
  DRAFT: {
    label: 'Brouillon',
    variant: 'gray',
    icon: FileText,
  },
  PENDING_SIGNATURE: {
    label: 'En attente de signature',
    variant: 'warning',
    icon: PenTool,
  },
  PARTIALLY_SIGNED: {
    label: 'Partiellement signe',
    variant: 'primary',
    icon: Clock,
  },
  SIGNED: {
    label: 'Signe',
    variant: 'success',
    icon: Check,
  },
  PENDING_DELIVERY: {
    label: 'En cours d\'envoi',
    variant: 'primary',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Delivre',
    variant: 'success',
    icon: Mail,
  },
  CANCELLED: {
    label: 'Annule',
    variant: 'gray',
    icon: AlertCircle,
  },
  EXPIRED: {
    label: 'Expire',
    variant: 'error',
    icon: Clock,
  },
  FAILED: {
    label: 'Echec',
    variant: 'error',
    icon: AlertCircle,
  },
};

const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  SIGNATURE_ELECTRONIQUE: 'Signature',
  LRAR: 'LRAR',
  BOTH: 'Signature + LRAR',
};

export function DocumentStatusBadge({
  status,
  deliveryMethod,
  size = 'sm',
  showIcon = true,
}: DocumentStatusBadgeProps) {
  if (!status) {
    return null;
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  const label = deliveryMethod
    ? `${deliveryMethodLabels[deliveryMethod]} - ${config.label}`
    : config.label;

  return (
    <Badge variant={config.variant} size={size}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}

interface DocumentStatusIndicatorProps {
  status?: DocumentTrackingStatus;
}

export function DocumentStatusIndicator({ status }: DocumentStatusIndicatorProps) {
  if (!status || status === 'DRAFT') {
    return null;
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  const dotColors: Record<DocumentTrackingStatus, string> = {
    DRAFT: 'bg-gray-400',
    PENDING_SIGNATURE: 'bg-yellow-500 animate-pulse',
    PARTIALLY_SIGNED: 'bg-blue-500 animate-pulse',
    SIGNED: 'bg-green-500',
    PENDING_DELIVERY: 'bg-blue-500 animate-pulse',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-gray-400',
    EXPIRED: 'bg-red-500',
    FAILED: 'bg-red-500',
  };

  return (
    <div
      className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm"
      title={config.label}
    >
      <span className={`h-2 w-2 rounded-full ${dotColors[status]}`} />
      <Icon className="h-3 w-3 text-gray-600" />
    </div>
  );
}

export default DocumentStatusBadge;
