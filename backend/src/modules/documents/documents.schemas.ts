import { z } from 'zod';
import { DocumentType } from '@prisma/client';

export const createDocumentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(DocumentType).default(DocumentType.OTHER),
  folderId: z.string().uuid('Invalid folder ID'),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: z.nativeEnum(DocumentType).optional(),
});

export const moveDocumentSchema = z.object({
  folderId: z.string().uuid('Invalid folder ID'),
});

export const bulkMoveSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document required'),
  folderId: z.string().uuid('Invalid folder ID'),
});

export const bulkDeleteSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document required'),
});

export const searchDocumentsSchema = z.object({
  query: z.string().optional(),
  type: z.array(z.nativeEnum(DocumentType)).optional(),
  folderId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minSize: z.number().int().positive().optional(),
  maxSize: z.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const listDocumentsSchema = z.object({
  folderId: z.string().uuid().optional(),
  type: z.nativeEnum(DocumentType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'fileSize']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>;
export type BulkMoveInput = z.infer<typeof bulkMoveSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
