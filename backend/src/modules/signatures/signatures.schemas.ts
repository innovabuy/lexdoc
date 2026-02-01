import { z } from 'zod';
import { SignatureProfile, SignatureStatus, SignatoryStatus } from '@prisma/client';

// Signatory schema
export const signatorySchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(100),
  lastName: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
});

// Create signature transaction
export const createSignatureSchema = z.object({
  documentId: z.string().uuid('ID document invalide'),
  signatories: z.array(signatorySchema).min(1, 'Au moins un signataire est requis').max(10),
  title: z.string().min(1, 'Le titre est requis').max(255),
  description: z.string().max(1000).optional(),
  profile: z.nativeEnum(SignatureProfile).default('DEFAULT'),
  language: z.enum(['fr', 'en']).default('fr'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateSignatureInput = z.infer<typeof createSignatureSchema>;

// List signatures query
export const listSignaturesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(SignatureStatus).optional(),
  documentId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListSignaturesInput = z.infer<typeof listSignaturesSchema>;

// Remind signer
export const remindSignerSchema = z.object({
  signerEmail: z.string().email('Email invalide'),
});

export type RemindSignerInput = z.infer<typeof remindSignerSchema>;

// Webhook payload from Universign
export const universignWebhookSchema = z.object({
  transactionId: z.string(),
  status: z.string(),
  customId: z.string().optional(),
  signers: z.array(z.object({
    email: z.string(),
    status: z.string(),
    signedAt: z.string().optional(),
    refusedAt: z.string().optional(),
    refusedReason: z.string().optional(),
  })).optional(),
});

export type UniversignWebhookPayload = z.infer<typeof universignWebhookSchema>;

// Response types
export interface SignatureTransactionResponse {
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
  expiresAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  signatories: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: SignatoryStatus;
    signOrder: number;
    signUrl?: string;
    signedAt?: Date;
    refusedAt?: Date;
    refusedReason?: string;
  }>;
}

export interface SignatureListResponse {
  data: SignatureTransactionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
