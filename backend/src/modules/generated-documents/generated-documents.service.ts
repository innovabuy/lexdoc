import { prisma } from '@/config/database';
import { GeneratedDocumentStatus, OutputFormat, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import Handlebars from 'handlebars';
import type {
  CreateGeneratedDocumentInput,
  UpdateGeneratedDocumentInput,
  GeneratedDocumentQuery,
  FinalizeDocumentInput,
} from './generated-documents.schemas';

interface BlockReference {
  blockId: string;
  order: number;
  isOptional?: boolean;
}

interface Variable {
  name: string;
  type: string;
  required: boolean;
}

export class GeneratedDocumentsService {
  /**
   * List generated documents with filters
   */
  async list(cabinetId: string, query: GeneratedDocumentQuery) {
    const { folderId, affaireId, templateId, status, search, page, limit, sortBy, sortOrder } = query;

    const where: Prisma.GeneratedDocumentWhereInput = {
      cabinetId,
      deletedAt: null,
    };

    if (folderId) {
      where.folderId = folderId;
    }

    if (affaireId) {
      where.affaireId = affaireId;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [documents, total] = await Promise.all([
      prisma.generatedDocument.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              documentType: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.generatedDocument.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: documents,
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
   * Get a single generated document by ID
   */
  async getById(id: string, cabinetId: string) {
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id,
        cabinetId,
        deletedAt: null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
            blocksStructure: true,
            requiredVariables: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Generated document not found');
    }

    return document;
  }

  /**
   * Create a new generated document from a template
   */
  async create(cabinetId: string, userId: string, data: CreateGeneratedDocumentInput) {
    // Verify folder exists and belongs to cabinet
    const folder = await prisma.folder.findFirst({
      where: {
        id: data.folderId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // If template provided, verify it exists
    let generatedContent = '';
    if (data.templateId) {
      const template = await prisma.builderTemplate.findFirst({
        where: {
          id: data.templateId,
          deletedAt: null,
          OR: [{ cabinetId }, { isSystemTemplate: true }],
        },
      });

      if (!template) {
        throw new NotFoundError('Builder template not found');
      }

      // Generate content from template
      generatedContent = await this.generateContent(template, data.filledVariables || {}, cabinetId);
    }

    const document = await prisma.generatedDocument.create({
      data: {
        cabinetId,
        createdById: userId,
        templateId: data.templateId,
        folderId: data.folderId,
        title: data.title,
        affaireId: data.affaireId,
        clientId: data.clientId,
        filledVariables: data.filledVariables as Prisma.InputJsonValue,
        generatedContent,
        status: GeneratedDocumentStatus.DRAFT,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return document;
  }

  /**
   * Update a generated document
   */
  async update(id: string, cabinetId: string, userId: string, data: UpdateGeneratedDocumentInput) {
    const existing = await prisma.generatedDocument.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Generated document not found');
    }

    if (existing.status === GeneratedDocumentStatus.FINALIZED) {
      throw new ForbiddenError('Cannot modify a finalized document');
    }

    // If folder changed, verify new folder
    if (data.folderId && data.folderId !== existing.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: data.folderId,
          cabinetId,
          deletedAt: null,
        },
      });

      if (!folder) {
        throw new NotFoundError('Folder not found');
      }
    }

    // Regenerate content if variables changed
    let generatedContent: string | undefined;
    if (data.filledVariables && existing.templateId) {
      const template = await prisma.builderTemplate.findFirst({
        where: { id: existing.templateId, deletedAt: null },
      });

      if (template) {
        generatedContent = await this.generateContent(template, data.filledVariables, cabinetId);
      }
    }

    const document = await prisma.generatedDocument.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.folderId && { folderId: data.folderId }),
        ...(data.filledVariables && { filledVariables: data.filledVariables as Prisma.InputJsonValue }),
        ...(generatedContent && { generatedContent }),
        ...(data.status && { status: data.status }),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return document;
  }

  /**
   * Finalize a document (mark as complete, generate final file)
   */
  async finalize(id: string, cabinetId: string, userId: string, options: FinalizeDocumentInput) {
    const existing = await prisma.generatedDocument.findFirst({
      where: { id, cabinetId, deletedAt: null },
      include: {
        template: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Generated document not found');
    }

    if (existing.status === GeneratedDocumentStatus.FINALIZED) {
      throw new BadRequestError('Document is already finalized');
    }

    // Check for missing required variables
    if (existing.template) {
      const requiredVars = (existing.template.requiredVariables || []) as unknown as Variable[];
      const filledVars = (existing.filledVariables || {}) as Record<string, any>;

      const missing = requiredVars
        .filter((v) => v.required && !filledVars[v.name])
        .map((v) => v.name);

      if (missing.length > 0) {
        throw new BadRequestError(`Missing required variables: ${missing.join(', ')}`);
      }
    }

    // TODO: Generate final document file (DOCX/PDF)
    // For now, just update status
    const document = await prisma.generatedDocument.update({
      where: { id },
      data: {
        status: GeneratedDocumentStatus.FINALIZED,
        // outputFilePath would be set here after generating the file
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return document;
  }

  /**
   * Soft delete a generated document
   */
  async delete(id: string, cabinetId: string) {
    const existing = await prisma.generatedDocument.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Generated document not found');
    }

    await prisma.generatedDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Duplicate a generated document
   */
  async duplicate(id: string, cabinetId: string, userId: string) {
    const original = await prisma.generatedDocument.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!original) {
      throw new NotFoundError('Generated document not found');
    }

    const duplicate = await prisma.generatedDocument.create({
      data: {
        cabinetId,
        createdById: userId,
        templateId: original.templateId,
        folderId: original.folderId,
        title: `${original.title} (copie)`,
        affaireId: original.affaireId,
        clientId: original.clientId,
        filledVariables: original.filledVariables as Prisma.InputJsonValue,
        generatedContent: original.generatedContent,
        status: GeneratedDocumentStatus.DRAFT,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
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
   * Get preview/rendered content
   */
  async getPreview(id: string, cabinetId: string) {
    const document = await this.getById(id, cabinetId);

    return {
      content: document.generatedContent || '',
      status: document.status,
      missingVariables: this.getMissingVariables(document),
    };
  }

  /**
   * Regenerate content from template with current variables
   */
  async regenerate(id: string, cabinetId: string, userId: string) {
    const document = await prisma.generatedDocument.findFirst({
      where: { id, cabinetId, deletedAt: null },
      include: { template: true },
    });

    if (!document) {
      throw new NotFoundError('Generated document not found');
    }

    if (document.status === GeneratedDocumentStatus.FINALIZED) {
      throw new ForbiddenError('Cannot regenerate a finalized document');
    }

    if (!document.template) {
      throw new BadRequestError('Document has no associated template');
    }

    const filledVariables = (document.filledVariables || {}) as Record<string, any>;
    const generatedContent = await this.generateContent(document.template, filledVariables, cabinetId);

    const updated = await prisma.generatedDocument.update({
      where: { id },
      data: { generatedContent },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get statistics for generated documents
   */
  async getStats(cabinetId: string) {
    const [byStatus, byTemplate, recent] = await Promise.all([
      prisma.generatedDocument.groupBy({
        by: ['status'],
        where: { cabinetId, deletedAt: null },
        _count: { status: true },
      }),
      prisma.generatedDocument.groupBy({
        by: ['templateId'],
        where: { cabinetId, deletedAt: null, templateId: { not: null } },
        _count: { templateId: true },
        orderBy: { _count: { templateId: 'desc' } },
        take: 5,
      }),
      prisma.generatedDocument.count({
        where: {
          cabinetId,
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Get template names for top templates
    const templateIds = byTemplate
      .filter((t) => t.templateId)
      .map((t) => t.templateId as string);

    const templates = await prisma.builderTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true },
    });

    const templateMap = new Map(templates.map((t) => [t.id, t.name]));

    return {
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      topTemplates: byTemplate.map((t) => ({
        templateId: t.templateId,
        templateName: templateMap.get(t.templateId as string) || 'Unknown',
        count: t._count.templateId,
      })),
      recentWeekCount: recent,
    };
  }

  /**
   * Generate content from template and variables
   */
  private async generateContent(
    template: { blocksStructure: any },
    variables: Record<string, any>,
    cabinetId: string
  ): Promise<string> {
    const blocksStructure = (template.blocksStructure || []) as unknown as BlockReference[];
    const blockIds = blocksStructure.map((b) => b.blockId);

    if (blockIds.length === 0) {
      return '';
    }

    const blocks = await prisma.documentBlock.findMany({
      where: {
        id: { in: blockIds },
        deletedAt: null,
      },
      select: {
        id: true,
        content: true,
        title: true,
      },
    });

    const blockMap = new Map(blocks.map((b) => [b.id, b]));
    const renderedParts: string[] = [];

    for (const ref of blocksStructure) {
      const block = blockMap.get(ref.blockId);
      if (!block) continue;

      try {
        const compiled = Handlebars.compile(block.content);
        const rendered = compiled(variables);
        renderedParts.push(rendered);
      } catch (error) {
        renderedParts.push(`[Error rendering: ${block.title}]`);
      }
    }

    return renderedParts.join('\n\n');
  }

  /**
   * Get list of missing required variables
   */
  private getMissingVariables(document: any): string[] {
    if (!document.template) return [];

    const requiredVars = (document.template.requiredVariables || []) as unknown as Variable[];
    const filledVars = (document.filledVariables || {}) as Record<string, any>;

    return requiredVars
      .filter((v) => v.required && !filledVars[v.name])
      .map((v) => v.name);
  }
}

export const generatedDocumentsService = new GeneratedDocumentsService();
