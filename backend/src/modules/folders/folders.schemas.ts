import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  parentId: z.string().uuid('Invalid parent folder ID').optional().nullable(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
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
