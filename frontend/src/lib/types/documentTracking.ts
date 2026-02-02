export type DocumentTrackingStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'PARTIALLY_SIGNED'
  | 'SIGNED'
  | 'PENDING_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export type DeliveryMethod = 'SIGNATURE_ELECTRONIQUE' | 'LRAR' | 'BOTH';

export type TrackingSignatureStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type TrackingLrarStatus =
  | 'PENDING'
  | 'SENT'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILED';

export type ReminderFrequency =
  | 'DAILY'
  | 'EVERY_2_DAYS'
  | 'EVERY_3_DAYS'
  | 'WEEKLY';

export interface DocumentTrackingRecipient {
  email: string;
  name: string;
  status?: string;
  signedAt?: string;
}

export interface DocumentTracking {
  id: string;
  documentId: string;
  status: DocumentTrackingStatus;
  deliveryMethod?: DeliveryMethod;
  signatureRequestId?: string;
  signatureStatus?: TrackingSignatureStatus;
  signedAt?: string;
  signedBy: string[];
  expiresAt?: string;
  lrarRequestId?: string;
  lrarTrackingNumber?: string;
  lrarStatus?: TrackingLrarStatus;
  sentAt?: string;
  deliveredAt?: string;
  reminderCount: number;
  lastReminderAt?: string;
  nextReminderAt?: string;
  autoRemindersEnabled: boolean;
  reminderFrequency: ReminderFrequency;
  maxReminders: number;
  recipients: DocumentTrackingRecipient[];
  customMessage?: string;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    name: string;
    title: string;
  };
}

export interface SendForSignatureInput {
  signatories: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }>;
  message?: string;
  deadline?: string;
  autoReminders?: boolean;
  reminderFrequency?: ReminderFrequency;
  maxReminders?: number;
}

export interface SendLrarInput {
  recipient: {
    name: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    city: string;
    country?: string;
  };
  options?: {
    acknowledgementOfReceipt?: boolean;
    color?: boolean;
  };
}

export interface DocumentTrackingFilters {
  status?: DocumentTrackingStatus;
  deliveryMethod?: DeliveryMethod;
  page?: number;
  limit?: number;
}

export interface DocumentTrackingStats {
  total: number;
  pendingSignature: number;
  signed: number;
  pendingDelivery: number;
  delivered: number;
  failed: number;
}
