import { z } from 'zod';
import { OutputFormat } from '@prisma/client';

// Preview generation schema
export const previewGenerationSchema = z.object({
  templateId: z.string().uuid('ID de template invalide'),
  filledVariables: z.record(z.any()).default({}),
});

// Document generation schema
export const generateDocumentSchema = z.object({
  templateId: z.string().uuid('ID de template invalide'),
  folderId: z.string().uuid('ID de dossier invalide'),
  affaireId: z.string().uuid('ID d\'affaire invalide').optional(),
  clientId: z.string().uuid('ID de client invalide').optional(),
  title: z.string().min(1, 'Le titre est requis').max(255).optional(),
  filledVariables: z.record(z.any()).default({}),
  outputFormat: z.nativeEnum(OutputFormat).default(OutputFormat.DOCX),
  includeSignature: z.boolean().default(true),
  includeLegalMentions: z.boolean().default(true),
});

// Document ID param schema
export const documentIdParamSchema = z.object({
  id: z.string().uuid('ID de document invalide'),
});

// Send to signature schema
export const sendToSignatureSchema = z.object({
  signataires: z.array(z.object({
    email: z.string().email('Email invalide'),
    nom: z.string().min(1),
    prenom: z.string().min(1),
    telephone: z.string().optional(),
  })).min(1, 'Au moins un signataire requis'),
  message: z.string().max(1000).optional(),
  dateExpiration: z.string().datetime().optional(),
});

// Send to LRAR schema
export const sendToLrarSchema = z.object({
  destinataire: z.object({
    nom: z.string().min(1, 'Le nom est requis'),
    prenom: z.string().optional(),
    adresse: z.string().min(1, 'L\'adresse est requise'),
    codePostal: z.string().regex(/^[0-9]{5}$/, 'Code postal invalide'),
    ville: z.string().min(1, 'La ville est requise'),
    pays: z.string().default('France'),
  }),
  options: z.object({
    accuseReception: z.boolean().default(true),
    couleur: z.boolean().default(false),
    rectoVerso: z.boolean().default(true),
  }).optional(),
});

// Types
export type PreviewGenerationInput = z.infer<typeof previewGenerationSchema>;
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;
export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;
export type SendToSignatureInput = z.infer<typeof sendToSignatureSchema>;
export type SendToLrarInput = z.infer<typeof sendToLrarSchema>;
