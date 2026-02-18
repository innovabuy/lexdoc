const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const documentGenerator = require('../services/document-generator.service');
const templateEngine = require('../services/template-engine.service');
const storageService = require('../services/storage.service');
const { sanitizeFilename } = require('../utils/helpers');
const logger = require('../config/logger');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// BUILDER BLOCKS
// ============================================================================

// List blocks (with filtering)
router.get('/blocks', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { category, search, isSystem, tags } = req.query;

    const where = {
      OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
    };

    if (category) where.category = category;
    if (isSystem !== undefined) where.isSystem = isSystem === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tags) {
      where.tags = { hasSome: tags.split(',') };
    }

    const [blocks, total] = await Promise.all([
      prisma.builderBlock.findMany({
        where,
        skip,
        take,
        orderBy: [{ isSystem: 'desc' }, { displayOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.builderBlock.count({ where }),
    ]);

    return paginatedResponse(res, blocks.map((b) => omitSensitiveFields(b)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get block by ID
router.get('/blocks/:id', async (req, res, next) => {
  try {
    const block = await prisma.builderBlock.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
    });

    if (!block) throw new NotFoundError('Block not found');

    return successResponse(res, omitSensitiveFields(block));
  } catch (error) {
    next(error);
  }
});

// Create block
router.post('/blocks', async (req, res, next) => {
  try {
    const { category, title, content, variables, tags, isMandatory, displayOrder } = req.body;

    // Auto-extract variables from content if not explicitly provided
    const autoVars = !variables ? documentGenerator.extractVariablesFull(content) : null;
    const finalVariables = variables || (autoVars && autoVars.length > 0 ? autoVars : null);

    const block = await prisma.builderBlock.create({
      data: {
        tenantId: req.tenant.id,
        category,
        title,
        content,
        variables: finalVariables,
        tags: tags || [],
        isMandatory: isMandatory || false,
        isSystem: false,
        displayOrder,
        createdById: req.user.id,
      },
    });

    return successResponse(res, omitSensitiveFields(block), 'Block created', 201);
  } catch (error) {
    next(error);
  }
});

// Update block
router.put('/blocks/:id', async (req, res, next) => {
  try {
    const existing = await prisma.builderBlock.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, isSystem: false },
    });

    if (!existing) throw new NotFoundError('Block not found or cannot be edited');

    const { category, title, content, variables, tags, isMandatory, displayOrder } = req.body;

    // Auto-extract variables if content changed but variables not explicitly provided
    let finalVariables = variables;
    if (content !== undefined && variables === undefined) {
      const autoVars = documentGenerator.extractVariablesFull(content);
      finalVariables = autoVars.length > 0 ? autoVars : existing.variables;
    }

    const block = await prisma.builderBlock.update({
      where: { id: req.params.id },
      data: { category, title, content, variables: finalVariables, tags, isMandatory, displayOrder },
    });

    return successResponse(res, omitSensitiveFields(block), 'Block updated');
  } catch (error) {
    next(error);
  }
});

// Delete block
router.delete('/blocks/:id', async (req, res, next) => {
  try {
    const existing = await prisma.builderBlock.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, isSystem: false },
    });

    if (!existing) throw new NotFoundError('Block not found or cannot be deleted');

    await prisma.builderBlock.delete({ where: { id: req.params.id } });

    return successResponse(res, null, 'Block deleted');
  } catch (error) {
    next(error);
  }
});

// Duplicate block (allows duplicating system blocks)
router.post('/blocks/:id/duplicate', async (req, res, next) => {
  try {
    const original = await prisma.builderBlock.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
    });

    if (!original) throw new NotFoundError('Block not found');

    const duplicate = await prisma.builderBlock.create({
      data: {
        tenantId: req.tenant.id,
        category: original.category,
        title: `${original.title} (Copie)`,
        content: original.content,
        variables: original.variables,
        tags: original.tags,
        isMandatory: original.isMandatory,
        displayOrder: original.displayOrder,
        isSystem: false,
        createdById: req.user.id,
      },
    });

    return successResponse(res, omitSensitiveFields(duplicate), 'Block duplicated', 201);
  } catch (error) {
    next(error);
  }
});

// Get block categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = [
      { value: 'INTRO', label: 'Introduction', description: 'Opening paragraphs and formalities' },
      { value: 'FAITS', label: 'Faits', description: 'Facts and circumstances' },
      { value: 'MOYENS', label: 'Moyens de droit', description: 'Legal arguments and citations' },
      { value: 'DISPOSITIF', label: 'Dispositif', description: 'Conclusions and requests' },
      { value: 'SIGNATURE', label: 'Signature', description: 'Signature blocks and closings' },
      { value: 'CLAUSE', label: 'Clauses', description: 'Contract clauses' },
      { value: 'CUSTOM', label: 'Custom', description: 'Custom blocks' },
    ];

    return successResponse(res, categories);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// BUILDER TEMPLATES
// ============================================================================

// List templates (with filtering)
router.get('/templates', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { documentType, category, search, isSystem, juridiction } = req.query;

    const where = {
      OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
    };

    if (documentType) where.documentType = documentType;
    if (category) where.category = category;
    if (isSystem !== undefined) where.isSystem = isSystem === 'true';
    if (juridiction) where.juridiction = juridiction;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [templates, total] = await Promise.all([
      prisma.builderTemplate.findMany({
        where,
        skip,
        take,
        orderBy: [{ isSystem: 'desc' }, { category: 'asc' }, { name: 'asc' }],
      }),
      prisma.builderTemplate.count({ where }),
    ]);

    return paginatedResponse(res, templates.map((t) => omitSensitiveFields(t)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get template by ID
router.get('/templates/:id', async (req, res, next) => {
  try {
    const template = await prisma.builderTemplate.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
    });

    if (!template) throw new NotFoundError('Template not found');

    return successResponse(res, omitSensitiveFields(template));
  } catch (error) {
    next(error);
  }
});

// Create template
router.post('/templates', async (req, res, next) => {
  try {
    const {
      name,
      description,
      documentType,
      juridiction,
      category,
      blocksStructure,
      requiredVariables,
      outputFormat,
      workflowConfig,
      legalMentions,
    } = req.body;

    const template = await prisma.builderTemplate.create({
      data: {
        tenantId: req.tenant.id,
        name,
        description,
        documentType,
        juridiction,
        category,
        blocksStructure: blocksStructure || [],
        requiredVariables,
        outputFormat: outputFormat || 'DOCX',
        workflowConfig,
        legalMentions,
        isSystem: false,
        createdById: req.user.id,
      },
    });

    return successResponse(res, omitSensitiveFields(template), 'Template created', 201);
  } catch (error) {
    next(error);
  }
});

// Update template
router.put('/templates/:id', async (req, res, next) => {
  try {
    const existing = await prisma.builderTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, isSystem: false },
    });

    if (!existing) throw new NotFoundError('Template not found or cannot be edited');

    const {
      name,
      description,
      documentType,
      juridiction,
      category,
      blocksStructure,
      requiredVariables,
      outputFormat,
      workflowConfig,
      legalMentions,
    } = req.body;

    const template = await prisma.builderTemplate.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        documentType,
        juridiction,
        category,
        blocksStructure,
        requiredVariables,
        outputFormat,
        workflowConfig,
        legalMentions,
      },
    });

    return successResponse(res, omitSensitiveFields(template), 'Template updated');
  } catch (error) {
    next(error);
  }
});

// Delete template
router.delete('/templates/:id', async (req, res, next) => {
  try {
    const existing = await prisma.builderTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, isSystem: false },
    });

    if (!existing) throw new NotFoundError('Template not found or cannot be deleted');

    await prisma.builderTemplate.delete({ where: { id: req.params.id } });

    return successResponse(res, null, 'Template deleted');
  } catch (error) {
    next(error);
  }
});

// Duplicate template (allows duplicating system templates)
router.post('/templates/:id/duplicate', async (req, res, next) => {
  try {
    const original = await prisma.builderTemplate.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
    });

    if (!original) throw new NotFoundError('Template not found');

    const duplicate = await prisma.builderTemplate.create({
      data: {
        tenantId: req.tenant.id,
        name: `${original.name} (Copie)`,
        description: original.description,
        documentType: original.documentType,
        juridiction: original.juridiction,
        category: original.category,
        blocksStructure: original.blocksStructure,
        requiredVariables: original.requiredVariables,
        outputFormat: original.outputFormat,
        workflowConfig: original.workflowConfig,
        legalMentions: original.legalMentions,
        isSystem: false,
        createdById: req.user.id,
      },
    });

    return successResponse(res, omitSensitiveFields(duplicate), 'Template duplicated', 201);
  } catch (error) {
    next(error);
  }
});

// Increment template usage count
router.post('/templates/:id/use', async (req, res, next) => {
  try {
    const template = await prisma.builderTemplate.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
    });

    if (!template) throw new NotFoundError('Template not found');

    await prisma.builderTemplate.update({
      where: { id: req.params.id },
      data: { usageCount: { increment: 1 } },
    });

    return successResponse(res, null, 'Usage recorded');
  } catch (error) {
    next(error);
  }
});

// Get template categories tree
router.get('/tree', async (req, res, next) => {
  try {
    const templates = await prisma.builderTemplate.findMany({
      where: {
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
      select: {
        id: true,
        name: true,
        documentType: true,
        category: true,
        juridiction: true,
        isSystem: true,
        usageCount: true,
      },
      orderBy: [{ category: 'asc' }, { documentType: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const tree = templates.reduce((acc, template) => {
      const cat = template.category || 'Autres';
      if (!acc[cat]) {
        acc[cat] = { name: cat, templates: [], count: 0 };
      }
      acc[cat].templates.push(template);
      acc[cat].count++;
      return acc;
    }, {});

    return successResponse(res, Object.values(tree));
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

// Generate document from template (optionally save to folder)
router.post('/generate', async (req, res, next) => {
  try {
    const { templateId, variables: userVariables, folderId } = req.body;

    if (!templateId) {
      throw new BadRequestError('templateId is required');
    }

    // Auto-collect context data (cabinet, avocat, date, etc.)
    let contextData = {};
    if (folderId) {
      contextData = await templateEngine.collectData(folderId, req.tenant.id);
    } else {
      contextData = await templateEngine.collectBasicData(req.tenant.id, req.user.id);
    }

    // User variables override auto-collected data
    const variables = { ...contextData, ...(userVariables || {}) };

    const result = await documentGenerator.generateDocument(
      templateId,
      variables,
      req.tenant.id
    );

    // If folderId provided, save the generated document to the folder
    if (folderId) {
      // Verify folder exists and belongs to tenant
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, tenantId: req.tenant.id },
      });

      if (!folder) {
        throw new NotFoundError('Folder not found');
      }

      const docName = `${result.templateName || 'Document'} - ${new Date().toLocaleDateString('fr-FR')}`;
      const filename = sanitizeFilename(`${docName}.html`);
      const objectKey = `${req.tenant.id}/documents/${Date.now()}-${filename}`;
      const contentBuffer = Buffer.from(result.content, 'utf-8');

      // Upload to MinIO
      const uploaded = await storageService.uploadFile(contentBuffer, objectKey, {
        originalName: filename,
        mimeType: 'text/html',
      }, true);

      // Create Document in database
      const document = await prisma.document.create({
        data: {
          name: docName,
          description: `Genere depuis le template: ${result.templateName}`,
          type: result.documentType || 'OTHER',
          filename: objectKey.split('/').pop(),
          originalName: filename,
          mimeType: 'text/html',
          size: BigInt(contentBuffer.length),
          checksum: uploaded.checksum,
          bucketName: uploaded.bucket,
          objectKey: uploaded.objectKey,
          isEncrypted: uploaded.isEncrypted,
          folderId,
          tenantId: req.tenant.id,
          createdById: req.user.id,
          status: 'DRAFT',
        },
        include: {
          folder: { select: { id: true, title: true } },
        },
      });

      // Store encryption keys
      if (uploaded.isEncrypted && uploaded.iv && uploaded.authTag) {
        await prisma.$executeRaw`
          UPDATE documents
          SET checksum = ${uploaded.checksum || ''} || '|' || ${uploaded.iv || ''} || '|' || ${uploaded.authTag || ''}
          WHERE id = ${document.id}
        `;
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'DOCUMENT_GENERATED',
          entityType: 'Document',
          entityId: document.id,
          userId: req.user.id,
          tenantId: req.tenant.id,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            templateId,
            templateName: result.templateName,
            folderId,
          },
        },
      });

      logger.info('Document generated and saved', {
        documentId: document.id,
        templateId,
        folderId,
        userId: req.user.id,
      });

      result.savedDocument = {
        id: document.id,
        name: document.name,
        folderId: document.folderId,
        folderTitle: document.folder?.title,
      };
    }

    return successResponse(res, result, 'Document generated successfully');
  } catch (error) {
    next(error);
  }
});

// Preview document generation (without incrementing usage count)
router.post('/preview', async (req, res, next) => {
  try {
    const { templateId, variables: userVariables, folderId } = req.body;

    if (!templateId) {
      throw new BadRequestError('templateId is required');
    }

    // Auto-collect context data (cabinet, avocat, date, etc.)
    let contextData = {};
    if (folderId) {
      contextData = await templateEngine.collectData(folderId, req.tenant.id);
    } else {
      contextData = await templateEngine.collectBasicData(req.tenant.id, req.user.id);
    }

    // User variables override auto-collected data
    const variables = { ...contextData, ...(userVariables || {}) };

    const result = await documentGenerator.previewDocument(
      templateId,
      variables,
      req.tenant.id
    );

    return successResponse(res, result, 'Document preview generated');
  } catch (error) {
    next(error);
  }
});

// Get all variables used in a template
router.get('/templates/:id/variables', async (req, res, next) => {
  try {
    const result = await documentGenerator.getTemplateVariables(
      req.params.id,
      req.tenant.id
    );

    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
