import { z } from 'zod';

// ============================================
// RGPD CONSENT SCHEMAS
// ============================================

export const consentTypesSchema = z.object({
  processing: z.boolean().describe('Autorisation de traitement des données'),
  storage: z.boolean().describe('Autorisation de stockage des données'),
  communication: z.boolean().optional().describe('Autorisation de communication'),
});

export const submitConsentSchema = z.object({
  clientId: z.string().uuid().optional(),
  consentTypes: consentTypesSchema,
  context: z.string().optional(),
  contextId: z.string().optional(),
  version: z.string().default('v1.0'),
});

export const revokeConsentSchema = z.object({
  consentId: z.string().uuid(),
  reason: z.string().optional(),
});

// ============================================
// RGPD DATA REQUEST SCHEMAS
// ============================================

export const rgpdRequestTypeSchema = z.enum([
  'ACCESS',
  'RECTIFICATION',
  'ERASURE',
  'PORTABILITY',
  'RESTRICTION',
  'OPPOSITION',
]);

export const submitRgpdRequestSchema = z.object({
  type: rgpdRequestTypeSchema,
  email: z.string().email(),
  name: z.string().optional(),
  details: z.string().optional(),
});

export const verifyRgpdRequestSchema = z.object({
  token: z.string(),
});

export const processRgpdRequestSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['COMPLETED', 'REJECTED']),
  processingNotes: z.string().optional(),
  responseData: z.any().optional(),
});

// ============================================
// RGPD DATA RETENTION SCHEMAS
// ============================================

export const createRetentionPolicySchema = z.object({
  entityType: z.enum(['Client', 'Folder', 'Document']),
  entityId: z.string().uuid(),
  retentionYears: z.number().int().min(1).max(30).default(10),
  reason: z.string(),
  legalBasis: z.string().optional(),
  notes: z.string().optional(),
});

export const updateRetentionPolicySchema = z.object({
  retentionUntil: z.string().datetime().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// RGPD QUERY SCHEMAS
// ============================================

export const listRgpdRequestsSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'PROCESSING', 'COMPLETED', 'REJECTED']).optional(),
  type: rgpdRequestTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listConsentsSchema = z.object({
  clientId: z.string().uuid().optional(),
  isRevoked: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type ConsentTypes = z.infer<typeof consentTypesSchema>;
export type SubmitConsentInput = z.infer<typeof submitConsentSchema>;
export type RevokeConsentInput = z.infer<typeof revokeConsentSchema>;
export type RgpdRequestType = z.infer<typeof rgpdRequestTypeSchema>;
export type SubmitRgpdRequestInput = z.infer<typeof submitRgpdRequestSchema>;
export type VerifyRgpdRequestInput = z.infer<typeof verifyRgpdRequestSchema>;
export type ProcessRgpdRequestInput = z.infer<typeof processRgpdRequestSchema>;
export type CreateRetentionPolicyInput = z.infer<typeof createRetentionPolicySchema>;
export type UpdateRetentionPolicyInput = z.infer<typeof updateRetentionPolicySchema>;
export type ListRgpdRequestsQuery = z.infer<typeof listRgpdRequestsSchema>;
export type ListConsentsQuery = z.infer<typeof listConsentsSchema>;

// ============================================
// RGPD REQUEST TYPE LABELS
// ============================================

export const RGPD_REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: 'Droit d\'accès',
  RECTIFICATION: 'Droit de rectification',
  ERASURE: 'Droit à l\'effacement',
  PORTABILITY: 'Droit à la portabilité',
  RESTRICTION: 'Droit à la limitation',
  OPPOSITION: 'Droit d\'opposition',
};

export const RGPD_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  VERIFIED: 'Vérifié',
  PROCESSING: 'En traitement',
  COMPLETED: 'Terminé',
  REJECTED: 'Rejeté',
};
