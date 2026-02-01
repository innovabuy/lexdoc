import { prisma } from '@/config/database';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import { GeneratedDocumentStatus, OutputFormat } from '@prisma/client';
import crypto from 'crypto';

import { renderTemplate, validateTemplateSyntax } from './engines/handlebars.engine';
import { generateDocx, generateHtmlPreview, BlockContent, LegalMentionsConfig } from './engines/docx.generator';
import {
  loadAvocatContext,
  buildLegalMentionsConfig,
  mergeContextWithVariables,
  LegalMentionsTemplate,
  loadClientContext,
  loadAffaireContext,
} from './engines/legal-mentions.injector';

import type {
  PreviewGenerationInput,
  GenerateDocumentInput,
  SendToSignatureInput,
  SendToLrarInput,
} from './document-generation.schemas';

// Block reference interface
interface BlockReference {
  blockId: string;
  order: number;
  isOptional?: boolean;
}

export class DocumentGenerationService {
  /**
   * Generate HTML preview of assembled document
   */
  async generatePreview(userId: string, cabinetId: string, input: PreviewGenerationInput) {
    // Load template with blocks
    const template = await this.loadTemplateWithBlocks(input.templateId, cabinetId);

    // Build context with all variables
    const context = await this.buildFullContext(userId, cabinetId, input.filledVariables);

    // Load legal mentions context
    const avocatContext = await loadAvocatContext(userId);
    const legalMentionsConfig = buildLegalMentionsConfig(
      template.legalMentions as LegalMentionsTemplate | null,
      avocatContext
    );

    // Merge avocat context with variables
    const fullVariables = mergeContextWithVariables(context, avocatContext);

    // Prepare blocks content
    const blocks: BlockContent[] = template.expandedBlocks
      .filter((b) => b.block)
      .map((b) => ({
        content: b.block!.content,
        title: b.block!.title,
        category: b.block!.category,
        isOptional: b.isOptional,
      }));

    // Generate HTML preview
    const html = generateHtmlPreview(blocks, fullVariables, legalMentionsConfig);

    // Check for missing variables
    const missingVariables = this.checkMissingVariables(template, input.filledVariables);

    return {
      html,
      missingVariables,
      template: {
        id: template.id,
        name: template.name,
        documentType: template.documentType,
        blockCount: blocks.length,
      },
    };
  }

  /**
   * Generate and save DOCX document
   */
  async generateDocument(userId: string, cabinetId: string, input: GenerateDocumentInput) {
    // Validate folder exists and belongs to cabinet
    const folder = await prisma.folder.findFirst({
      where: {
        id: input.folderId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new NotFoundError('Dossier non trouvé');
    }

    // Load template with blocks
    const template = await this.loadTemplateWithBlocks(input.templateId, cabinetId);

    // Build context with all variables
    const context = await this.buildFullContext(
      userId,
      cabinetId,
      input.filledVariables,
      input.clientId,
      input.affaireId
    );

    // Load legal mentions context
    const avocatContext = input.includeLegalMentions
      ? await loadAvocatContext(userId)
      : null;

    const legalMentionsConfig = input.includeLegalMentions
      ? buildLegalMentionsConfig(
          template.legalMentions as LegalMentionsTemplate | null,
          avocatContext
        )
      : undefined;

    // Merge all context
    const fullVariables = mergeContextWithVariables(context, avocatContext);

    // Prepare blocks content
    const blocks: BlockContent[] = template.expandedBlocks
      .filter((b) => b.block)
      .map((b) => ({
        content: b.block!.content,
        title: b.block!.title,
        category: b.block!.category,
        isOptional: b.isOptional,
      }));

    // Generate document based on format
    let documentBuffer: Buffer;
    let mimeType: string;
    let fileExtension: string;

    if (input.outputFormat === OutputFormat.DOCX) {
      documentBuffer = await generateDocx(blocks, fullVariables, legalMentionsConfig);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    } else {
      // PDF generation would require additional library (like puppeteer or pdf-lib)
      // For now, generate DOCX
      documentBuffer = await generateDocx(blocks, fullVariables, legalMentionsConfig);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    }

    // Generate filename
    const title = input.title || `${template.name}_${new Date().toISOString().split('T')[0]}`;
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_');
    const filename = `${sanitizedTitle}_${Date.now()}.${fileExtension}`;

    // Storage path
    const storagePath = `${cabinetId}/${input.folderId}/generated/${filename}`;

    // Upload to MinIO
    await minioClient.putObject(
      config.minio.buckets.documents,
      storagePath,
      documentBuffer,
      documentBuffer.length,
      {
        'Content-Type': mimeType,
        'x-amz-meta-cabinet-id': cabinetId,
        'x-amz-meta-folder-id': input.folderId,
        'x-amz-meta-template-id': input.templateId,
        'x-amz-meta-generated-by': userId,
      }
    );

    // Generate text content for storage
    const textContent = blocks.map((b) => {
      try {
        return renderTemplate(b.content, fullVariables);
      } catch {
        return b.content;
      }
    }).join('\n\n');

    // Create GeneratedDocument record
    const generatedDoc = await prisma.generatedDocument.create({
      data: {
        cabinetId,
        templateId: input.templateId,
        folderId: input.folderId,
        affaireId: input.affaireId,
        clientId: input.clientId,
        title,
        filledVariables: input.filledVariables,
        generatedContent: textContent,
        outputFilePath: storagePath,
        status: GeneratedDocumentStatus.DRAFT,
        workflowStatus: {
          signature: null,
          lrar: null,
        },
        createdById: userId,
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

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_CREATED',
        entity: 'GeneratedDocument',
        entityId: generatedDoc.id,
        details: {
          title,
          templateId: input.templateId,
          templateName: template.name,
          folderId: input.folderId,
          outputFormat: input.outputFormat,
        },
      },
    });

    // Generate download URL
    const downloadUrl = await this.getDownloadUrl(storagePath);

    return {
      document: generatedDoc,
      downloadUrl,
    };
  }

  /**
   * Download generated document
   */
  async downloadDocument(documentId: string, userId: string, cabinetId: string) {
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouvé');
    }

    if (!document.outputFilePath) {
      throw new BadRequestError('Le document n\'a pas de fichier associé');
    }

    // Get file from MinIO
    const stream = await minioClient.getObject(
      config.minio.buckets.documents,
      document.outputFilePath
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    // Extract filename from path
    const filename = document.outputFilePath.split('/').pop() || 'document.docx';

    return {
      buffer,
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  /**
   * Get download URL for document
   */
  async getDocumentDownloadUrl(documentId: string, userId: string, cabinetId: string) {
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouvé');
    }

    if (!document.outputFilePath) {
      throw new BadRequestError('Le document n\'a pas de fichier associé');
    }

    const downloadUrl = await this.getDownloadUrl(document.outputFilePath);

    return { downloadUrl };
  }

  /**
   * Send document for electronic signature
   */
  async sendToSignature(
    documentId: string,
    userId: string,
    cabinetId: string,
    input: SendToSignatureInput
  ) {
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouvé');
    }

    if (document.status === GeneratedDocumentStatus.SIGNED) {
      throw new BadRequestError('Ce document est déjà signé');
    }

    // TODO: Integrate with Universign API
    // For now, just update the workflow status
    const workflowStatus = (document.workflowStatus as Record<string, unknown>) || {};

    const updatedDocument = await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        status: GeneratedDocumentStatus.SENT,
        sentAt: new Date(),
        workflowStatus: {
          ...workflowStatus,
          signature: {
            status: 'PENDING',
            sentAt: new Date().toISOString(),
            signataires: input.signataires,
            message: input.message,
            // transactionId would come from Universign
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'SIGNATURE_CREATED',
        entity: 'GeneratedDocument',
        entityId: documentId,
        details: {
          type: 'signature',
          signataires: input.signataires.map((s) => s.email),
        },
      },
    });

    return updatedDocument;
  }

  /**
   * Send document via LRAR
   */
  async sendToLrar(
    documentId: string,
    userId: string,
    cabinetId: string,
    input: SendToLrarInput
  ) {
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouvé');
    }

    // TODO: Integrate with SendingBox API
    // For now, just update the workflow status
    const workflowStatus = (document.workflowStatus as Record<string, unknown>) || {};

    const updatedDocument = await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        status: GeneratedDocumentStatus.SENT,
        sentAt: new Date(),
        workflowStatus: {
          ...workflowStatus,
          lrar: {
            status: 'PENDING',
            sentAt: new Date().toISOString(),
            destinataire: input.destinataire,
            options: input.options,
            // trackingNumber would come from SendingBox
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'LRAR_CREATED',
        entity: 'GeneratedDocument',
        entityId: documentId,
        details: {
          type: 'lrar',
          destinataire: `${input.destinataire.nom}, ${input.destinataire.ville}`,
        },
      },
    });

    return updatedDocument;
  }

  /**
   * Load template with expanded blocks
   */
  private async loadTemplateWithBlocks(templateId: string, cabinetId: string) {
    const template = await prisma.builderTemplate.findFirst({
      where: {
        id: templateId,
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemTemplate: true }],
      },
    });

    if (!template) {
      throw new NotFoundError('Template non trouvé');
    }

    // Load blocks
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

    // Map blocks with their order
    const expandedBlocks = blocksStructure
      .sort((a, b) => a.order - b.order)
      .map((ref) => {
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
   * Build full context with all available variables
   */
  private async buildFullContext(
    userId: string,
    cabinetId: string,
    filledVariables: Record<string, unknown>,
    clientId?: string,
    affaireId?: string
  ): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {
      ...filledVariables,
      // Add date helpers
      date_jour: new Date().toLocaleDateString('fr-FR'),
      date_jour_long: new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    // Load client context if provided
    if (clientId) {
      const clientContext = await loadClientContext(clientId);
      if (clientContext) {
        Object.assign(context, clientContext);
      }
    }

    // Load affaire context if provided
    if (affaireId) {
      const affaireContext = await loadAffaireContext(affaireId);
      if (affaireContext) {
        Object.assign(context, affaireContext);
      }
    }

    return context;
  }

  /**
   * Check for missing required variables
   */
  private checkMissingVariables(
    template: { requiredVariables?: unknown },
    filledVariables: Record<string, unknown>
  ): string[] {
    const missing: string[] = [];
    const requiredVars = (template.requiredVariables || []) as Array<{
      name: string;
      required?: boolean;
    }>;

    for (const v of requiredVars) {
      if (v.required && !filledVariables[v.name]) {
        missing.push(v.name);
      }
    }

    return missing;
  }

  /**
   * Generate presigned URL for download
   */
  private async getDownloadUrl(storagePath: string): Promise<string> {
    return await minioClient.presignedGetObject(
      config.minio.buckets.documents,
      storagePath,
      3600 // 1 hour expiry
    );
  }
}

export const documentGenerationService = new DocumentGenerationService();
