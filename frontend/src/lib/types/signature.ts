export type SignatureStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'ERROR';
export type SignatureProfile = 'DEFAULT' | 'CERTIFIED' | 'ADVANCED';
export type SignatoryStatus = 'PENDING' | 'IN_PROGRESS' | 'SIGNED' | 'REFUSED';

export interface Signatory {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: SignatoryStatus;
  signOrder: number;
  signUrl?: string;
  signedAt?: string;
  refusedAt?: string;
  refusedReason?: string;
}

export interface SignatureTransaction {
  id: string;
  documentId: string;
  title: string;
  description?: string;
  status: SignatureStatus;
  profile: SignatureProfile;
  language: string;
  universignId?: string;
  signedDocumentPath?: string;
  certificatesPath?: string;
  expiresAt?: string;
  completedAt?: string;
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
  signatories: Signatory[];
}

export interface CreateSignatureInput {
  documentId: string;
  signatories: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }>;
  title: string;
  description?: string;
  profile?: SignatureProfile;
  language?: 'fr' | 'en';
  successUrl?: string;
  cancelUrl?: string;
}

export interface SignatureFilters {
  page?: number;
  limit?: number;
  status?: SignatureStatus;
  documentId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
}
