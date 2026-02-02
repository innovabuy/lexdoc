import { z } from 'zod';
import { BuilderDocumentType, Juridiction, OutputFormat, BuilderTemplateCategory } from '@prisma/client';

// Block reference in template structure
const blockReferenceSchema = z.object({
  blockId: z.string().uuid(),
  order: z.number().int().min(0),
  isOptional: z.boolean().optional().default(false),
});

// Variable definition
const variableDefinitionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'date', 'boolean', 'text', 'array']),
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
});

// Workflow configuration
const workflowConfigSchema = z.object({
  signature: z.object({
    enabled: z.boolean().default(false),
    profile: z.enum(['DEFAULT', 'CERTIFIED', 'ADVANCED']).optional(),
  }).optional(),
  lrar: z.object({
    enabled: z.boolean().default(false),
  }).optional(),
  autoStore: z.object({
    enabled: z.boolean().default(true),
    folderPath: z.string().optional(),
  }).optional(),
});

// Legal mentions configuration
const legalMentionsSchema = z.object({
  header: z.string().optional(),
  footer: z.string().optional(),
  confidentiality: z.boolean().optional(),
  customMentions: z.array(z.string()).optional(),
});

// Create template schema
export const createBuilderTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  documentType: z.nativeEnum(BuilderDocumentType),
  juridiction: z.nativeEnum(Juridiction).optional(),
  blocksStructure: z.array(blockReferenceSchema).optional().default([]),
  requiredVariables: z.array(variableDefinitionSchema).optional().default([]),
  outputFormat: z.nativeEnum(OutputFormat).optional().default(OutputFormat.DOCX),
  workflowConfig: workflowConfigSchema.optional().default({}),
  legalMentions: legalMentionsSchema.optional().default({}),
  // Tree structure fields
  category: z.nativeEnum(BuilderTemplateCategory).optional().default(BuilderTemplateCategory.CUSTOM),
  subcategory: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  tags: z.array(z.string()).optional().default([]),
  basedOnTemplateId: z.string().uuid().optional(),
});

// Update template schema
export const updateBuilderTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  documentType: z.nativeEnum(BuilderDocumentType).optional(),
  juridiction: z.nativeEnum(Juridiction).nullable().optional(),
  blocksStructure: z.array(blockReferenceSchema).optional(),
  requiredVariables: z.array(variableDefinitionSchema).optional(),
  outputFormat: z.nativeEnum(OutputFormat).optional(),
  workflowConfig: workflowConfigSchema.optional(),
  legalMentions: legalMentionsSchema.optional(),
  // Tree structure fields
  category: z.nativeEnum(BuilderTemplateCategory).optional(),
  subcategory: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  tags: z.array(z.string()).optional(),
  basedOnTemplateId: z.string().uuid().nullable().optional(),
});

// Query params schema
export const builderTemplateQuerySchema = z.object({
  documentType: z.nativeEnum(BuilderDocumentType).optional(),
  juridiction: z.nativeEnum(Juridiction).optional(),
  category: z.nativeEnum(BuilderTemplateCategory).optional(),
  isSystemTemplate: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  isFavorite: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  tags: z.string().optional().transform((val) => val ? val.split(',') : undefined),
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
  sortBy: z.enum(['name', 'documentType', 'createdAt', 'usageCount', 'lastUsedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Tree query params schema
export const treeQuerySchema = z.object({
  includeEmpty: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

// ID param schema
export const templateIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Document type param schema
export const documentTypeParamSchema = z.object({
  documentType: z.nativeEnum(BuilderDocumentType),
});

// Preview generation schema
export const previewGenerationSchema = z.object({
  variables: z.record(z.any()).optional().default({}),
});

// Types
export type CreateBuilderTemplateInput = z.infer<typeof createBuilderTemplateSchema>;
export type UpdateBuilderTemplateInput = z.infer<typeof updateBuilderTemplateSchema>;
export type BuilderTemplateQuery = z.infer<typeof builderTemplateQuerySchema>;
export type TreeQuery = z.infer<typeof treeQuerySchema>;
export type TemplateIdParam = z.infer<typeof templateIdParamSchema>;
export type DocumentTypeParam = z.infer<typeof documentTypeParamSchema>;
export type PreviewGenerationInput = z.infer<typeof previewGenerationSchema>;
