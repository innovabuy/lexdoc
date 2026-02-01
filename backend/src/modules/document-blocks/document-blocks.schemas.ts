import { z } from 'zod';
import { BlockCategory } from '@prisma/client';

// Variable schema
const variableSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'date', 'boolean', 'text', 'array']),
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
});

// Create document block schema
export const createDocumentBlockSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.nativeEnum(BlockCategory),
  content: z.string().min(1),
  variables: z.array(variableSchema).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  isMandatory: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
});

// Update document block schema
export const updateDocumentBlockSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.nativeEnum(BlockCategory).optional(),
  content: z.string().min(1).optional(),
  variables: z.array(variableSchema).optional(),
  tags: z.array(z.string()).optional(),
  isMandatory: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

// Query params schema
export const documentBlockQuerySchema = z.object({
  category: z.nativeEnum(BlockCategory).optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined)),
  search: z.string().optional(),
  isSystemBlock: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
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
  sortBy: z.enum(['title', 'category', 'createdAt', 'usageCount', 'displayOrder']).optional().default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ID param schema
export const blockIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Types
export type CreateDocumentBlockInput = z.infer<typeof createDocumentBlockSchema>;
export type UpdateDocumentBlockInput = z.infer<typeof updateDocumentBlockSchema>;
export type DocumentBlockQuery = z.infer<typeof documentBlockQuerySchema>;
export type BlockIdParam = z.infer<typeof blockIdParamSchema>;
