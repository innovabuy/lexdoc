import { z } from 'zod';
import { GeneratedDocumentStatus, OutputFormat } from '@prisma/client';

// Create generated document schema
export const createGeneratedDocumentSchema = z.object({
  templateId: z.string().uuid().optional(),
  folderId: z.string().uuid(),
  title: z.string().min(1).max(255),
  affaireId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  filledVariables: z.record(z.any()).optional().default({}),
  outputFormat: z.nativeEnum(OutputFormat).optional().default(OutputFormat.DOCX),
  freeNoteIds: z.array(z.string().uuid()).optional(),
});

// Update generated document schema
export const updateGeneratedDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  folderId: z.string().uuid().optional(),
  filledVariables: z.record(z.any()).optional(),
  status: z.nativeEnum(GeneratedDocumentStatus).optional(),
});

// Finalize document schema
export const finalizeDocumentSchema = z.object({
  outputFormat: z.nativeEnum(OutputFormat).optional(),
});

// Query params schema
export const generatedDocumentQuerySchema = z.object({
  folderId: z.string().uuid().optional(),
  affaireId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  status: z.nativeEnum(GeneratedDocumentStatus).optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(parseInt(val, 10), 100)),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ID param schema
export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Signatory for signature request
const signatorySchema = z.object({
  firstName: z.string().min(1, 'Le prenom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  role: z.enum(['client', 'avocat', 'partie_adverse', 'temoin', 'autre']),
});

// Send signature request schema
export const sendSignatureRequestSchema = z.object({
  signatories: z.array(signatorySchema).min(1, 'Au moins un signataire est requis'),
  signingOrder: z.enum(['sequential', 'parallel']).optional().default('sequential'),
  customMessage: z.string().max(500).optional(),
  profile: z.enum(['default', 'certified', 'advanced']).optional().default('default'),
});

// LRAR recipient schema
const lrarRecipientSchema = z.object({
  name: z.string().min(1, 'Le nom du destinataire est requis'),
  address: z.string().min(1, 'L\'adresse est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  city: z.string().min(1, 'La ville est requise'),
  country: z.string().optional().default('FR'),
});

// Send LRAR request schema
export const sendLrarRequestSchema = z.object({
  recipient: lrarRecipientSchema,
  options: z.object({
    color: z.boolean().optional().default(false),
    duplex: z.boolean().optional().default(false),
    registered: z.boolean().optional().default(true),
  }).optional().default({}),
});

// Types
export type CreateGeneratedDocumentInput = z.infer<typeof createGeneratedDocumentSchema>;
export type UpdateGeneratedDocumentInput = z.infer<typeof updateGeneratedDocumentSchema>;
export type FinalizeDocumentInput = z.infer<typeof finalizeDocumentSchema>;
export type GeneratedDocumentQuery = z.infer<typeof generatedDocumentQuerySchema>;
export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;
export type SendSignatureRequestInput = z.infer<typeof sendSignatureRequestSchema>;
export type SignatoryInput = z.infer<typeof signatorySchema>;
export type SendLrarRequestInput = z.infer<typeof sendLrarRequestSchema>;
export type LrarRecipientInput = z.infer<typeof lrarRecipientSchema>;
