export type LrarStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'ERROR' | 'CANCELLED';

export interface LrarAddress {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface LrarTrackingEvent {
  id: string;
  status: string;
  description?: string;
  location?: string;
  eventAt: string;
}

export interface LrarShipment {
  id: string;
  documentId: string;
  subject: string;
  reference?: string;
  status: LrarStatus;
  sendingboxId?: string;
  trackingNumber?: string;
  recipient: LrarAddress;
  sender: LrarAddress;
  color: boolean;
  duplexPrinting: boolean;
  registeredMail: boolean;
  proofPath?: string;
  cost?: number;
  sentAt?: string;
  deliveredAt?: string;
  returnedAt?: string;
  estimatedDeliveryAt?: string;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    title: string;
    mimeType: string;
  };
  initiator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  trackingEvents: LrarTrackingEvent[];
}

export interface CreateLrarInput {
  documentId: string;
  subject: string;
  reference?: string;
  recipient: {
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    city: string;
    country?: string;
  };
  sender?: {
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    city: string;
    country?: string;
  };
  color?: boolean;
  duplexPrinting?: boolean;
  registeredMail?: boolean;
}

export interface LrarFilters {
  page?: number;
  limit?: number;
  status?: LrarStatus;
  documentId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'subject';
  sortOrder?: 'asc' | 'desc';
}
