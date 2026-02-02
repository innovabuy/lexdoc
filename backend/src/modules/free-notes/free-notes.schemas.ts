import { z } from 'zod';
import { BlockCategory } from '@prisma/client';

/**
 * Schema for creating a free note
 */
export const createFreeNoteSchema = z.object({
  title: z.string().min(1).max(200).optional().default('Note personnalisée'),
  content: z.string().min(1).max(50000),
  linkedCategory: z.nativeEnum(BlockCategory).optional(),
  position: z.number().int().min(0).optional(),
});

/**
 * Schema for updating a free note
 */
export const updateFreeNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  linkedCategory: z.nativeEnum(BlockCategory).optional(),
  position: z.number().int().min(0).optional(),
});

/**
 * Schema for converting free note to reusable block
 */
export const convertToBlockSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.nativeEnum(BlockCategory),
  tags: z.array(z.string()).optional().default([]),
});

/**
 * Schema for folder ID param
 */
export const folderIdParamSchema = z.object({
  folderId: z.string().uuid(),
});

/**
 * Schema for note ID param
 */
export const noteIdParamSchema = z.object({
  noteId: z.string().uuid(),
});

/**
 * Schema for query params
 */
export const freeNotesQuerySchema = z.object({
  linkedCategory: z.nativeEnum(BlockCategory).optional(),
  search: z.string().optional(),
});

export type CreateFreeNoteInput = z.infer<typeof createFreeNoteSchema>;
export type UpdateFreeNoteInput = z.infer<typeof updateFreeNoteSchema>;
export type ConvertToBlockInput = z.infer<typeof convertToBlockSchema>;
