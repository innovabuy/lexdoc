import { z } from 'zod';
import { ClientType, Civilite } from '@prisma/client';

// Create client schema
export const createClientSchema = z.object({
  type: z.nativeEnum(ClientType).default(ClientType.PARTICULIER),
  civilite: z.nativeEnum(Civilite).optional(),
  nom: z.string().min(1, 'Le nom est requis').max(255),
  prenom: z.string().max(255).optional(),
  denomination: z.string().max(255).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().max(20).optional(),
  mobile: z.string().max(20).optional(),
  adresse: z.string().max(500).optional(),
  codePostal: z.string().max(10).optional(),
  ville: z.string().max(100).optional(),
  pays: z.string().max(100).optional().default('France'),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres').optional().or(z.literal('')),
  rcs: z.string().max(100).optional(),
  formeJuridique: z.string().max(50).optional(),
  capital: z.number().positive().optional(),
  representant: z.string().max(255).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional().default([]),
});

// Update client schema
export const updateClientSchema = createClientSchema.partial();

// Query params schema
export const clientQuerySchema = z.object({
  search: z.string().optional(),
  type: z.nativeEnum(ClientType).optional(),
  tags: z.string().optional(), // comma-separated
  page: z.string().optional().default('1').transform((val) => parseInt(val, 10)),
  limit: z.string().optional().default('20').transform((val) => Math.min(parseInt(val, 10), 100)),
  sortBy: z.enum(['nom', 'createdAt', 'updatedAt', 'type']).optional().default('nom'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ID param schema
export const clientIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Types
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQuery = z.infer<typeof clientQuerySchema>;
export type ClientIdParam = z.infer<typeof clientIdParamSchema>;
