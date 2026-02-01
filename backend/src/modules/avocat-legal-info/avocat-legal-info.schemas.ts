import { z } from 'zod';
import { Civilite } from '@prisma/client';

// French phone number regex (accepts formats: 0612345678, 06 12 34 56 78, +33612345678)
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

// French postal code regex
const postalCodeRegex = /^[0-9]{5}$/;

// Email validation
const emailSchema = z.string().email('Adresse email invalide');

// Phone validation
const phoneSchema = z.string().regex(phoneRegex, 'Numéro de téléphone invalide');

// Postal code validation
const postalCodeSchema = z.string().regex(postalCodeRegex, 'Code postal invalide (5 chiffres)');

// Create schema - required fields for initial creation
export const createAvocatLegalInfoSchema = z.object({
  civilite: z.nativeEnum(Civilite).default(Civilite.MAITRE),
  nom: z.string().min(1, 'Le nom est requis').max(100),
  prenom: z.string().min(1, 'Le prénom est requis').max(100),
  barreau: z.string().min(1, 'Le barreau est requis').max(200),
  numeroToque: z.string().max(50).optional().nullable(),
  adresseCabinet: z.string().min(1, 'L\'adresse du cabinet est requise').max(500),
  codePostal: postalCodeSchema,
  ville: z.string().min(1, 'La ville est requise').max(100),
  telephone: phoneSchema,
  fax: z.string().regex(phoneRegex, 'Numéro de fax invalide').optional().nullable(),
  email: emailSchema,
  siteWeb: z.string().url('URL du site web invalide').optional().nullable(),
  mentionsLegalesDefaut: z.record(z.any()).optional().default({}),
});

// Update schema - all fields optional
export const updateAvocatLegalInfoSchema = z.object({
  civilite: z.nativeEnum(Civilite).optional(),
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().min(1).max(100).optional(),
  barreau: z.string().min(1).max(200).optional(),
  numeroToque: z.string().max(50).optional().nullable(),
  adresseCabinet: z.string().min(1).max(500).optional(),
  codePostal: postalCodeSchema.optional(),
  ville: z.string().min(1).max(100).optional(),
  telephone: phoneSchema.optional(),
  fax: z.string().regex(phoneRegex, 'Numéro de fax invalide').optional().nullable(),
  email: emailSchema.optional(),
  siteWeb: z.string().url('URL du site web invalide').optional().nullable(),
  mentionsLegalesDefaut: z.record(z.any()).optional(),
});

// ID param schema
export const legalInfoIdParamSchema = z.object({
  id: z.string().uuid('ID invalide'),
});

// Types
export type CreateAvocatLegalInfoInput = z.infer<typeof createAvocatLegalInfoSchema>;
export type UpdateAvocatLegalInfoInput = z.infer<typeof updateAvocatLegalInfoSchema>;
export type LegalInfoIdParam = z.infer<typeof legalInfoIdParamSchema>;
