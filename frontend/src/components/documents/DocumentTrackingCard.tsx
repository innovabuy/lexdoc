import React from 'react';
import {
  Clock,
  Bell,
  RefreshCw,
  X,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Truck,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import {
  useDocumentTracking,
  useSendReminder,
  useCancelSignatureRequest,
} from '@/hooks/useDocumentTracking';

interface DocumentTrackingCardProps {
  documentId: string;
}

export function DocumentTrackingCard({ documentId }: DocumentTrackingCardProps) {
  const { data: tracking, isLoading, error } = useDocumentTracking(documentId);
  const sendReminder = useSendReminder();
  const cancelSignature = useCancelSignatureRequest();

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (error || !tracking) {
    return null;
  }

  const canSendReminder =
    tracking.status === 'PENDING_SIGNATURE' &&
    tracking.reminderCount < tracking.maxReminders;

  const canCancel =
    tracking.status === 'PENDING_SIGNATURE' ||
    tracking.status === 'PENDING_DELIVERY';

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Suivi du document</h3>
          <div className="mt-1">
            <DocumentStatusBadge
              status={tracking.status}
              deliveryMethod={tracking.deliveryMethod}
            />
          </div>
        </div>

        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cancelSignature.mutate(documentId)}
            isLoading={cancelSignature.isPending}
            leftIcon={<X className="h-4 w-4" />}
            className="text-red-600 hover:bg-red-50"
          >
            Annuler
          </Button>
        )}
      </div>

      {/* Recipients */}
      {tracking.recipients && tracking.recipients.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Users className="h-4 w-4" />
            <span>Destinataires</span>
          </div>
          <div className="space-y-2">
            {tracking.recipients.map((recipient, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {recipient.name}
                  </p>
                  <p className="text-xs text-gray-500">{recipient.email}</p>
                </div>
                {recipient.status && (
                  <RecipientStatusBadge status={recipient.status} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {tracking.sentAt && (
          <TimelineItem
            icon={<Clock className="h-4 w-4" />}
            title="Envoye"
            date={tracking.sentAt}
          />
        )}

        {tracking.signedAt && (
          <TimelineItem
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            title="Signe"
            date={tracking.signedAt}
          />
        )}

        {tracking.deliveredAt && (
          <TimelineItem
            icon={<Truck className="h-4 w-4 text-green-500" />}
            title="Delivre"
            date={tracking.deliveredAt}
          />
        )}

        {tracking.status === 'FAILED' && (
          <TimelineItem
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
            title="Echec"
            date={tracking.updatedAt}
          />
        )}
      </div>

      {/* Reminders */}
      {tracking.status === 'PENDING_SIGNATURE' && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Bell className="h-4 w-4" />
                <span>Relances</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {tracking.reminderCount} / {tracking.maxReminders} envoyees
                {tracking.autoRemindersEnabled && ' (automatique)'}
              </p>
              {tracking.nextReminderAt && (
                <p className="text-xs text-gray-500">
                  Prochaine: {formatDate(tracking.nextReminderAt)}
                </p>
              )}
            </div>

            {canSendReminder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendReminder.mutate(documentId)}
                isLoading={sendReminder.isPending}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Relancer
              </Button>
            )}
          </div>
        </div>
      )}

      {/* LRAR tracking number */}
      {tracking.lrarTrackingNumber && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="h-4 w-4" />
            <span>Numero de suivi</span>
          </div>
          <p className="text-sm font-mono mt-1">{tracking.lrarTrackingNumber}</p>
        </div>
      )}

      {/* Expiration */}
      {tracking.expiresAt && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Date limite: {formatDate(tracking.expiresAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  date: string;
}

function TimelineItem({ icon, title, date }: TimelineItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 text-gray-400">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{formatDate(date)}</p>
      </div>
    </div>
  );
}

interface RecipientStatusBadgeProps {
  status: string;
}

function RecipientStatusBadge({ status }: RecipientStatusBadgeProps) {
  const statusMap: Record<
    string,
    { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gray' }
  > = {
    PENDING: { label: 'En attente', variant: 'warning' },
    IN_PROGRESS: { label: 'En cours', variant: 'primary' },
    SIGNED: { label: 'Signe', variant: 'success' },
    REFUSED: { label: 'Refuse', variant: 'error' },
  };

  const config = statusMap[status] || { label: status, variant: 'gray' as const };

  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default DocumentTrackingCard;
