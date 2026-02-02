import { z } from 'zod';
import { FolderType } from '@prisma/client';

// Metadata schemas for different folder types
export const affaireMetadataSchema = z.object({
  intitule: z.string().max(500).optional(),
  numeroRG: z.string().max(50).optional(),
  juridiction: z.string().max(100).optional(),
  typeAffaire: z.string().max(100).optional(),
  dateOuverture: z.string().optional(),
  dateAudience: z.string().optional(),
  dateCloture: z.string().optional(),
  montantLitige: z.number().optional(),
  montantProvision: z.number().optional(),
  partieAdverse: z.object({
    nom: z.string().optional(),
    adresse: z.string().optional(),
    representant: z.string().optional(),
  }).optional(),
});

export const cessionMetadataSchema = z.object({
  // Societe cible
  societeCible_denomination: z.string().max(255).optional(),
  societeCible_siret: z.string().max(14).optional(),
  societeCible_rcs: z.string().max(100).optional(),
  societeCible_capital: z.number().optional(),
  societeCible_formeJuridique: z.string().max(50).optional(),
  // Acquereur
  acquereur_denomination: z.string().max(255).optional(),
  acquereur_siret: z.string().max(14).optional(),
  acquereur_representant: z.string().max(255).optional(),
  // Cedant
  cedant_nom: z.string().max(255).optional(),
  cedant_nombreParts: z.number().int().optional(),
  cedant_pourcentageCapital: z.number().optional(),
  // Transaction
  prixEstime: z.number().optional(),
  prixFinal: z.number().optional(),
  dateLOI: z.string().optional(),
  dateSignatureProtocole: z.string().optional(),
  dateCession: z.string().optional(),
  // Garanties GAP
  gap_plafond: z.number().optional(),
  gap_franchise: z.number().optional(),
  gap_dureeAns: z.number().int().optional(),
  // Earn-out
  earnout_montant: z.number().optional(),
  earnout_conditions: z.string().max(2000).optional(),
});

export const contentieuxMetadataSchema = z.object({
  numeroRG: z.string().max(50).optional(),
  juridiction: z.string().max(100).optional(),
  typeContentieux: z.string().max(100).optional(),
  chambre: z.string().max(100).optional(),
  // Demandeur
  demandeur_nom: z.string().max(255).optional(),
  demandeur_qualite: z.string().max(100).optional(),
  // Defendeur
  defendeur_nom: z.string().max(255).optional(),
  defendeur_adresse: z.string().max(500).optional(),
  defendeur_avocat: z.string().max(255).optional(),
  // Montants
  montantDemande: z.number().optional(),
  montantObtenu: z.number().optional(),
  // Dates
  dateAssignation: z.string().optional(),
  dateMiseEnEtat: z.string().optional(),
  dateCloture: z.string().optional(),
  dateAudience: z.string().optional(),
  dateJugement: z.string().optional(),
});

export const immobilierMetadataSchema = z.object({
  // Bien
  adresseBien: z.string().max(500).optional(),
  typeBien: z.string().max(100).optional(),
  surfaceM2: z.number().optional(),
  // Bail
  typeBail: z.string().max(100).optional(),
  montantLoyer: z.number().optional(),
  dateDebutBail: z.string().optional(),
  dateFinBail: z.string().optional(),
  // Locataire
  locataire_nom: z.string().max(255).optional(),
  locataire_adresse: z.string().max(500).optional(),
  // Bailleur
  bailleur_nom: z.string().max(255).optional(),
  bailleur_adresse: z.string().max(500).optional(),
  // Contentieux
  arriereLoyers: z.number().optional(),
  montantDegats: z.number().optional(),
});

// Union schema for all metadata types
export const folderMetadataSchema = z.union([
  affaireMetadataSchema,
  cessionMetadataSchema,
  contentieuxMetadataSchema,
  immobilierMetadataSchema,
  z.object({}), // Empty metadata
]).optional();

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  parentId: z.string().uuid('Invalid parent folder ID').optional().nullable(),
  folderType: z.nativeEnum(FolderType).optional().default(FolderType.AFFAIRE_GENERALE),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  metadata: folderMetadataSchema,
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  folderType: z.nativeEnum(FolderType).optional(),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  metadata: folderMetadataSchema,
});

// Dedicated metadata update schema
export const updateFolderMetadataSchema = z.object({
  metadata: z.record(z.any()),
});

export const moveFolderSchema = z.object({
  parentId: z.string().uuid('Invalid parent folder ID').nullable(),
});

export const listFoldersSchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const getFolderTreeSchema = z.object({
  depth: z.coerce.number().int().positive().max(10).default(3),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
export type ListFoldersInput = z.infer<typeof listFoldersSchema>;
export type GetFolderTreeInput = z.infer<typeof getFolderTreeSchema>;
export type UpdateFolderMetadataInput = z.infer<typeof updateFolderMetadataSchema>;
export type AffaireMetadata = z.infer<typeof affaireMetadataSchema>;
export type CessionMetadata = z.infer<typeof cessionMetadataSchema>;
export type ContentieuxMetadata = z.infer<typeof contentieuxMetadataSchema>;
export type ImmobilierMetadata = z.infer<typeof immobilierMetadataSchema>;
