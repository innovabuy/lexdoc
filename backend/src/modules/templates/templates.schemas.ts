import { z } from 'zod';

// Template category enum
export const templateCategorySchema = z.enum([
  'CONTRAT',
  'ACTE',
  'COURRIER',
  'PROCEDURE',
  'OTHER',
]);

// Variable type enum
export const variableTypeSchema = z.enum([
  'text',
  'date',
  'currency',
  'boolean',
  'email',
  'phone',
  'number',
]);

// Template variable schema
export const templateVariableSchema = z.object({
  name: z.string(),
  type: variableTypeSchema,
  label: z.string(),
  required: z.boolean().default(true),
});

// Create template schema (multipart form data)
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  category: templateCategorySchema.default('OTHER'),
});

// Update template schema
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: templateCategorySchema.optional(),
});

// List templates query schema
export const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: templateCategorySchema.optional(),
  sortBy: z.enum(['name', 'createdAt', 'usageCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Template ID param schema
export const templateIdParamSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
});

// Generate document schema
export const generateDocumentSchema = z.object({
  documentTitle: z.string().min(1, 'Document title is required').max(255),
  folderId: z.string().uuid().optional(),
  data: z.record(z.string(), z.unknown()),
});

// Preview schema (same as generate but lighter)
export const previewTemplateSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
});

// Export types
export type TemplateCategory = z.infer<typeof templateCategorySchema>;
export type VariableType = z.infer<typeof variableTypeSchema>;
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;
export type PreviewTemplateInput = z.infer<typeof previewTemplateSchema>;
