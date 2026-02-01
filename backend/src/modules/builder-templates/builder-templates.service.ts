import { prisma } from '@/config/database';
import { BuilderDocumentType, Juridiction, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import Handlebars from 'handlebars';
import type {
  CreateBuilderTemplateInput,
  UpdateBuilderTemplateInput,
  BuilderTemplateQuery,
} from './builder-templates.schemas';

interface BlockReference {
  blockId: string;
  order: number;
  isOptional?: boolean;
}

interface Variable {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export class BuilderTemplatesService {
  /**
   * List builder templates with filters
   */
  async list(cabinetId: string, query: BuilderTemplateQuery) {
    const { documentType, juridiction, isSystemTemplate, search, page, limit, sortBy, sortOrder } = query;

    const where: Prisma.BuilderTemplateWhereInput = {
      deletedAt: null,
      OR: [{ cabinetId }, { isSystemTemplate: true }],
    };

    if (documentType) {
      where.documentType = documentType;
    }

    if (juridiction) {
      where.juridiction = juridiction;
    }

    if (typeof isSystemTemplate === 'boolean') {
      where.isSystemTemplate = isSystemTemplate;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.builderTemplate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.builderTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get a single template by ID with expanded blocks
   */
  async getById(id: string, cabinetId: string) {
    const template = await prisma.builderTemplate.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemTemplate: true }],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Builder template not found');
    }

    // Fetch full block data for the template
    const blocksStructure = (template.blocksStructure || []) as unknown as BlockReference[];
    const blockIds = blocksStructure.map((b) => b.blockId);

    const blocks = await prisma.documentBlock.findMany({
      where: {
        id: { in: blockIds },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        variables: true,
        isMandatory: true,
      },
    });

    // Map blocks with their order and optional flag
    const expandedBlocks = blocksStructure.map((ref) => {
      const block = blocks.find((b) => b.id === ref.blockId);
      return {
        ...ref,
        block: block || null,
      };
    });

    return {
      ...template,
      expandedBlocks,
    };
  }

  /**
   * Create a new builder template
   */
  async create(cabinetId: string, userId: string, data: CreateBuilderTemplateInput) {
    // Validate block references
    if (data.blocksStructure && data.blocksStructure.length > 0) {
      const blockIds = data.blocksStructure.map((b) => b.blockId);
      const validBlocks = await prisma.documentBlock.count({
        where: {
          id: { in: blockIds },
          deletedAt: null,
          OR: [{ cabinetId }, { isSystemBlock: true }],
        },
      });

      if (validBlocks !== blockIds.length) {
        throw new BadRequestError('One or more blocks are invalid or not accessible');
      }
    }

    // Collect all variables from blocks
    const allVariables: any[] = [...(data.requiredVariables || [])];
    if (data.blocksStructure && data.blocksStructure.length > 0) {
      const blockIds = data.blocksStructure.map((b) => b.blockId);
      const blocks = await prisma.documentBlock.findMany({
        where: { id: { in: blockIds } },
        select: { variables: true },
      });

      const blockVariables = blocks.flatMap((b) => (b.variables || []) as unknown as Variable[]);

      // Merge variables (avoid duplicates)
      const existingNames = new Set(allVariables.map((v) => v.name));
      for (const v of blockVariables) {
        if (!existingNames.has(v.name)) {
          existingNames.add(v.name);
          allVariables.push(v);
        }
      }
    }

    const template = await prisma.builderTemplate.create({
      data: {
        cabinetId,
        createdById: userId,
        name: data.name,
        documentType: data.documentType,
        juridiction: data.juridiction,
        blocksStructure: data.blocksStructure as Prisma.InputJsonValue,
        requiredVariables: allVariables as Prisma.InputJsonValue,
        outputFormat: data.outputFormat,
        workflowConfig: data.workflowConfig as Prisma.InputJsonValue,
        legalMentions: data.legalMentions as Prisma.InputJsonValue,
        isSystemTemplate: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return template;
  }

  /**
   * Update a builder template
   */
  async update(id: string, cabinetId: string, userId: string, data: UpdateBuilderTemplateInput) {
    const existing = await prisma.builderTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Builder template not found');
    }

    if (existing.isSystemTemplate) {
      throw new ForbiddenError('System templates cannot be modified');
    }

    if (existing.cabinetId !== cabinetId) {
      throw new ForbiddenError('You can only modify templates from your own cabinet');
    }

    // Validate block references if provided
    if (data.blocksStructure && data.blocksStructure.length > 0) {
      const blockIds = data.blocksStructure.map((b) => b.blockId);
      const validBlocks = await prisma.documentBlock.count({
        where: {
          id: { in: blockIds },
          deletedAt: null,
          OR: [{ cabinetId }, { isSystemBlock: true }],
        },
      });

      if (validBlocks !== blockIds.length) {
        throw new BadRequestError('One or more blocks are invalid or not accessible');
      }
    }

    // Collect variables if blocks changed
    let requiredVariables: any[] | undefined = data.requiredVariables;
    if (data.blocksStructure) {
      const blockIds = data.blocksStructure.map((b) => b.blockId);
      const blocks = await prisma.documentBlock.findMany({
        where: { id: { in: blockIds } },
        select: { variables: true },
      });

      const blockVariables = blocks.flatMap((b) => (b.variables || []) as unknown as Variable[]);
      const existingVars: any[] = [...(requiredVariables || [])];
      const existingNames = new Set(existingVars.map((v) => v.name));

      for (const v of blockVariables) {
        if (!existingNames.has(v.name)) {
          existingNames.add(v.name);
          existingVars.push(v);
        }
      }
      requiredVariables = existingVars;
    }

    const template = await prisma.builderTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.documentType && { documentType: data.documentType }),
        ...(data.juridiction !== undefined && { juridiction: data.juridiction }),
        ...(data.blocksStructure && { blocksStructure: data.blocksStructure as Prisma.InputJsonValue }),
        ...(requiredVariables && { requiredVariables: requiredVariables as Prisma.InputJsonValue }),
        ...(data.outputFormat && { outputFormat: data.outputFormat }),
        ...(data.workflowConfig && { workflowConfig: data.workflowConfig as Prisma.InputJsonValue }),
        ...(data.legalMentions && { legalMentions: data.legalMentions as Prisma.InputJsonValue }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return template;
  }

  /**
   * Soft delete a builder template
   */
  async delete(id: string, cabinetId: string) {
    const existing = await prisma.builderTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Builder template not found');
    }

    if (existing.isSystemTemplate) {
      throw new ForbiddenError('System templates cannot be deleted');
    }

    if (existing.cabinetId !== cabinetId) {
      throw new ForbiddenError('You can only delete templates from your own cabinet');
    }

    // Check if template has generated documents
    const generatedDocs = await prisma.generatedDocument.count({
      where: {
        templateId: id,
        deletedAt: null,
      },
    });

    if (generatedDocs > 0) {
      throw new BadRequestError(
        `Cannot delete template: it has ${generatedDocs} generated document(s). Archive them first.`
      );
    }

    await prisma.builderTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Duplicate a template for customization
   */
  async duplicate(id: string, cabinetId: string, userId: string) {
    const original = await prisma.builderTemplate.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemTemplate: true }],
      },
    });

    if (!original) {
      throw new NotFoundError('Builder template not found');
    }

    const duplicate = await prisma.builderTemplate.create({
      data: {
        cabinetId,
        createdById: userId,
        name: `${original.name} (copie)`,
        documentType: original.documentType,
        juridiction: original.juridiction,
        blocksStructure: original.blocksStructure as Prisma.InputJsonValue,
        requiredVariables: original.requiredVariables as Prisma.InputJsonValue,
        outputFormat: original.outputFormat,
        workflowConfig: original.workflowConfig as Prisma.InputJsonValue,
        legalMentions: original.legalMentions as Prisma.InputJsonValue,
        isSystemTemplate: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return duplicate;
  }

  /**
   * Generate a preview of the document from template
   */
  async generatePreview(id: string, cabinetId: string, variables: Record<string, any>) {
    const template = await this.getById(id, cabinetId);

    // Compile and render each block
    const renderedBlocks: string[] = [];
    const missingVariables: string[] = [];

    for (const item of template.expandedBlocks) {
      if (!item.block) continue;

      try {
        const compiledTemplate = Handlebars.compile(item.block.content);
        const rendered = compiledTemplate(variables);
        renderedBlocks.push(rendered);
      } catch (error) {
        renderedBlocks.push(`[Error rendering block: ${item.block.title}]`);
      }

      // Check for missing required variables
      const blockVars = (item.block.variables || []) as unknown as Variable[];
      for (const v of blockVars) {
        if (v.required && !variables[v.name]) {
          if (!missingVariables.includes(v.name)) {
            missingVariables.push(v.name);
          }
        }
      }
    }

    // Increment usage count
    await prisma.builderTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return {
      preview: renderedBlocks.join('\n\n'),
      missingVariables,
      template: {
        id: template.id,
        name: template.name,
        documentType: template.documentType,
      },
    };
  }

  /**
   * Get templates by document type
   */
  async getByDocumentType(cabinetId: string, documentType: BuilderDocumentType) {
    const templates = await prisma.builderTemplate.findMany({
      where: {
        documentType,
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemTemplate: true }],
      },
      orderBy: [
        { isSystemTemplate: 'desc' }, // System templates first
        { usageCount: 'desc' },       // Then by popularity
        { name: 'asc' },              // Then alphabetically
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Add preview (first block content) for each template
    const templatesWithPreview = await Promise.all(
      templates.map(async (template) => {
        const blocksStructure = (template.blocksStructure || []) as unknown as BlockReference[];
        let preview: string | null = null;

        if (blocksStructure.length > 0) {
          const firstBlockId = blocksStructure[0].blockId;
          const firstBlock = await prisma.documentBlock.findUnique({
            where: { id: firstBlockId },
            select: { content: true, title: true },
          });

          if (firstBlock) {
            // Truncate content for preview
            preview = firstBlock.content.substring(0, 200);
            if (firstBlock.content.length > 200) {
              preview += '...';
            }
          }
        }

        return {
          ...template,
          preview,
          blockCount: blocksStructure.length,
        };
      })
    );

    return templatesWithPreview;
  }

  /**
   * Get all available document types with counts
   */
  async getDocumentTypes(cabinetId: string) {
    const types = await prisma.builderTemplate.groupBy({
      by: ['documentType'],
      where: {
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemTemplate: true }],
      },
      _count: {
        documentType: true,
      },
    });

    return types.map((t) => ({
      documentType: t.documentType,
      count: t._count.documentType,
    }));
  }

  /**
   * Get all available juridictions with counts
   */
  async getJuridictions(cabinetId: string) {
    const juridictions = await prisma.builderTemplate.groupBy({
      by: ['juridiction'],
      where: {
        deletedAt: null,
        juridiction: { not: null },
        OR: [{ cabinetId }, { isSystemTemplate: true }],
      },
      _count: {
        juridiction: true,
      },
    });

    return juridictions
      .filter((j) => j.juridiction !== null)
      .map((j) => ({
        juridiction: j.juridiction,
        count: j._count.juridiction,
      }));
  }

  /**
   * Get all required variables for a template
   */
  async getTemplateVariables(id: string, cabinetId: string) {
    const template = await this.getById(id, cabinetId);

    // Collect all variables from blocks
    const allVariables: Variable[] = [];
    const seenNames = new Set<string>();

    for (const item of template.expandedBlocks) {
      if (!item.block) continue;

      const blockVars = (item.block.variables || []) as unknown as Variable[];
      for (const v of blockVars) {
        if (!seenNames.has(v.name)) {
          seenNames.add(v.name);
          allVariables.push({
            ...v,
            // Mark as required if block is not optional and var is required
            required: v.required && !item.isOptional,
          });
        }
      }
    }

    // Add template-level variables
    const templateVars = (template.requiredVariables || []) as unknown as Variable[];
    for (const v of templateVars) {
      if (!seenNames.has(v.name)) {
        seenNames.add(v.name);
        allVariables.push(v);
      }
    }

    return allVariables.sort((a, b) => {
      // Required first, then alphabetically
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
}

export const builderTemplatesService = new BuilderTemplatesService();
