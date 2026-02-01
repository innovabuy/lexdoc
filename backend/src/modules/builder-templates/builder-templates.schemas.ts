import { z } from 'zod';
import { BuilderDocumentType, Juridiction, OutputFormat } from '@prisma/client';

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
  documentType: z.nativeEnum(BuilderDocumentType),
  juridiction: z.nativeEnum(Juridiction).optional(),
  blocksStructure: z.array(blockReferenceSchema).optional().default([]),
  requiredVariables: z.array(variableDefinitionSchema).optional().default([]),
  outputFormat: z.nativeEnum(OutputFormat).optional().default(OutputFormat.DOCX),
  workflowConfig: workflowConfigSchema.optional().default({}),
  legalMentions: legalMentionsSchema.optional().default({}),
});

// Update template schema
export const updateBuilderTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  documentType: z.nativeEnum(BuilderDocumentType).optional(),
  juridiction: z.nativeEnum(Juridiction).nullable().optional(),
  blocksStructure: z.array(blockReferenceSchema).optional(),
  requiredVariables: z.array(variableDefinitionSchema).optional(),
  outputFormat: z.nativeEnum(OutputFormat).optional(),
  workflowConfig: workflowConfigSchema.optional(),
  legalMentions: legalMentionsSchema.optional(),
});

// Query params schema
export const builderTemplateQuerySchema = z.object({
  documentType: z.nativeEnum(BuilderDocumentType).optional(),
  juridiction: z.nativeEnum(Juridiction).optional(),
  isSystemTemplate: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
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
  sortBy: z.enum(['name', 'documentType', 'createdAt', 'usageCount']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ID param schema
export const templateIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Preview generation schema
export const previewGenerationSchema = z.object({
  variables: z.record(z.any()).optional().default({}),
});

// Types
export type CreateBuilderTemplateInput = z.infer<typeof createBuilderTemplateSchema>;
export type UpdateBuilderTemplateInput = z.infer<typeof updateBuilderTemplateSchema>;
export type BuilderTemplateQuery = z.infer<typeof builderTemplateQuerySchema>;
export type TemplateIdParam = z.infer<typeof templateIdParamSchema>;
export type PreviewGenerationInput = z.infer<typeof previewGenerationSchema>;
