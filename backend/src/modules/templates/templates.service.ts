import { prisma } from '@/config/database';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { templateParserService } from './template-parser.service';
import { templateGeneratorService } from './template-generator.service';
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  ListTemplatesQuery,
  GenerateDocumentInput,
  TemplateVariable,
  TemplateCategory,
} from './templates.schemas';
import { v4 as uuidv4 } from 'uuid';

export class TemplatesService {
  private readonly bucket = config.minio.buckets.templates;
  private readonly documentsBucket = config.minio.buckets.documents;

  /**
   * List templates with filters and pagination
   */
  async listTemplates(cabinetId: string, query: ListTemplatesQuery) {
    const { page, limit, search, category, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      cabinetId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category }),
    };

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          filename: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.template.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: templates,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string, cabinetId: string) {
    const template = await prisma.template.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      filename: template.filename,
      variables: template.variables as TemplateVariable[],
      usageCount: template.usageCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Create template from uploaded DOCX file
   */
  async createTemplate(
    cabinetId: string,
    input: CreateTemplateInput,
    file: Express.Multer.File,
    userId: string
  ) {
    // Validate DOCX
    const validation = templateParserService.validateTemplate(file.buffer);
    if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid DOCX template');
    }

    // Extract variables
    const variables = templateParserService.extractVariables(file.buffer);

    // Generate unique filename
    const ext = '.docx';
    const filename = `${uuidv4()}${ext}`;
    const minioPath = `${cabinetId}/${filename}`;

    // Upload to MinIO
    await minioClient.putObject(this.bucket, minioPath, file.buffer, file.size, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'x-amz-meta-original-name': encodeURIComponent(file.originalname),
    });

    // Create database record
    const template = await prisma.template.create({
      data: {
        cabinetId,
        name: input.name,
        description: input.description,
        category: input.category,
        filename: file.originalname,
        minioPath,
        variables: variables as unknown as any,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        filename: true,
        variables: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'TEMPLATE_CREATED',
        entity: 'Template',
        entityId: template.id,
        details: { name: input.name, variableCount: variables.length },
      },
    });

    return {
      ...template,
      variables: template.variables as TemplateVariable[],
    };
  }

  /**
   * Update template metadata
   */
  async updateTemplate(
    id: string,
    cabinetId: string,
    input: UpdateTemplateInput,
    userId: string
  ) {
    const existing = await prisma.template.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Template not found');
    }

    const template = await prisma.template.update({
      where: { id },
      data: input,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        filename: true,
        variables: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'TEMPLATE_CREATED', // Using same action type for updates
        entity: 'Template',
        entityId: id,
        details: { changes: input },
      },
    });

    return {
      ...template,
      variables: template.variables as TemplateVariable[],
    };
  }

  /**
   * Soft delete template
   */
  async deleteTemplate(id: string, cabinetId: string, userId: string) {
    const existing = await prisma.template.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Template not found');
    }

    await prisma.template.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'TEMPLATE_CREATED', // Using same action type for deletes
        entity: 'Template',
        entityId: id,
        details: { action: 'deleted' },
      },
    });
  }

  /**
   * Get template variables
   */
  async getTemplateVariables(id: string, cabinetId: string): Promise<TemplateVariable[]> {
    const template = await prisma.template.findFirst({
      where: { id, cabinetId, deletedAt: null },
      select: { variables: true },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template.variables as TemplateVariable[];
  }

  /**
   * Generate document from template
   */
  async generateDocument(
    templateId: string,
    cabinetId: string,
    input: GenerateDocumentInput,
    userId: string
  ) {
    // Get template
    const template = await prisma.template.findFirst({
      where: { id: templateId, cabinetId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Get template file from MinIO
    const templateStream = await minioClient.getObject(this.bucket, template.minioPath);
    const chunks: Buffer[] = [];
    for await (const chunk of templateStream) {
      chunks.push(chunk);
    }
    const templateBuffer = Buffer.concat(chunks);

    const variables = template.variables as TemplateVariable[];

    // Generate document
    const documentBuffer = templateGeneratorService.generateDocument(
      templateBuffer,
      input.data,
      variables
    );

    // Generate unique filename for output document
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFilename = `${input.documentTitle}-${timestamp}.docx`;
    const minioPath = `${cabinetId}/${uuidv4()}.docx`;

    // Upload generated document to MinIO
    await minioClient.putObject(
      this.documentsBucket,
      minioPath,
      documentBuffer,
      documentBuffer.length,
      {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
    );

    // Create document record
    const document = await prisma.document.create({
      data: {
        cabinetId,
        folderId: input.folderId || null,
        createdById: userId,
        filename: outputFilename,
        originalName: outputFilename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: documentBuffer.length,
        minioPath,
        minioBucket: this.documentsBucket,
        type: 'TEMPLATE',
        title: input.documentTitle,
        description: `Generated from template: ${template.name}`,
      },
      select: {
        id: true,
        filename: true,
        title: true,
        createdAt: true,
      },
    });

    // Increment template usage count
    await prisma.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    // Audit logs
    await Promise.all([
      prisma.auditLog.create({
        data: {
          cabinetId,
          userId,
          action: 'TEMPLATE_USED',
          entity: 'Template',
          entityId: templateId,
          details: { documentId: document.id, documentTitle: input.documentTitle },
        },
      }),
      prisma.auditLog.create({
        data: {
          cabinetId,
          userId,
          action: 'DOCUMENT_CREATED',
          entity: 'Document',
          entityId: document.id,
          details: { fromTemplate: templateId, templateName: template.name },
        },
      }),
    ]);

    return document;
  }

  /**
   * Generate preview document buffer
   */
  async generatePreview(
    templateId: string,
    cabinetId: string,
    data?: Record<string, unknown>
  ): Promise<{ buffer: Buffer; filename: string }> {
    // Get template
    const template = await prisma.template.findFirst({
      where: { id: templateId, cabinetId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Get template file from MinIO
    const templateStream = await minioClient.getObject(this.bucket, template.minioPath);
    const chunks: Buffer[] = [];
    for await (const chunk of templateStream) {
      chunks.push(chunk);
    }
    const templateBuffer = Buffer.concat(chunks);

    const variables = template.variables as TemplateVariable[];

    // Use provided data or generate sample data
    const previewData = data || templateGeneratorService.generateSampleData(variables);

    // Generate document
    const documentBuffer = templateGeneratorService.generateDocument(
      templateBuffer,
      previewData,
      variables
    );

    const filename = `preview-${template.name.replace(/[^a-z0-9]/gi, '-')}.docx`;

    return { buffer: documentBuffer, filename };
  }

  /**
   * Get list of categories
   */
  async getCategories(): Promise<{ value: TemplateCategory; label: string }[]> {
    return [
      { value: 'CONTRAT', label: 'Contrat' },
      { value: 'ACTE', label: 'Acte' },
      { value: 'COURRIER', label: 'Courrier' },
      { value: 'PROCEDURE', label: 'Procédure' },
      { value: 'OTHER', label: 'Autre' },
    ];
  }
}

export const templatesService = new TemplatesService();
