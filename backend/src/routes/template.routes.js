const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { sanitizeFilename } = require('../utils/helpers');
const storageService = require('../services/storage.service');
const templateEngine = require('../services/template-engine.service');
const logger = require('../config/logger');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// LIST / SUGGESTIONS
// ============================================================================

// GET /api/templates/suggestions?type=juridique&nature=cession
router.get('/suggestions', async (req, res, next) => {
  try {
    const { type, nature } = req.query;

    const where = {
      tenantId: req.tenant.id,
      deletedAt: null,
    };

    if (type) {
      where.OR = [
        { folderType: type },
        { folderType: 'les_deux' },
        { folderType: null },
      ];
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        folderType: true,
        folderNature: true,
        isSystem: true,
        usageCount: true,
        variables: true,
        sourceFileUrl: true,
      },
    });

    // Mark recommended templates (matching nature or universal)
    const result = templates.map(t => ({
      ...t,
      recommended: nature ? (t.folderNature === nature || !t.folderNature) : true,
      hasSourceFile: !!t.sourceFileUrl,
    }));

    // Sort: recommended first, then by usage count
    result.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return (b.usageCount || 0) - (a.usageCount || 0);
    });

    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
});

// GET /api/templates — full list grouped by category
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;

    const where = {
      tenantId: req.tenant.id,
      deletedAt: null,
    };

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ category: 'asc' }, { usageCount: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        folderType: true,
        folderNature: true,
        isSystem: true,
        usageCount: true,
        variables: true,
        sourceFileUrl: true,
      },
    });

    return successResponse(res, templates);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TREE VIEW
// ============================================================================

// GET /api/templates/tree — arborescence par categorie
router.get('/tree', async (req, res, next) => {
  try {
    const templates = await prisma.template.findMany({
      where: { tenantId: req.tenant.id, deletedAt: null },
      select: {
        id: true, name: true, description: true, category: true,
        folderType: true, isSystem: true, isPersonalise: true,
        usageCount: true, sourceFileUrl: true, createdAt: true,
      },
      orderBy: [{ category: 'asc' }, { usageCount: 'desc' }, { name: 'asc' }],
    });

    const categoryMeta = {
      contrats: { label: 'Contrats', icon: 'file-text' },
      courriers: { label: 'Courriers', icon: 'mail' },
      actes_procedure: { label: 'Actes de procedure', icon: 'shield' },
      conclusions: { label: 'Conclusions', icon: 'file' },
      droit_societes: { label: 'Droit des societes', icon: 'building' },
      divers: { label: 'Divers', icon: 'folder' },
    };

    // Separate personalise templates
    const personalise = templates.filter(t => t.isPersonalise);
    const standard = templates.filter(t => !t.isPersonalise);

    const groups = {};
    standard.forEach(t => {
      const cat = t.category || 'divers';
      if (!groups[cat]) {
        const meta = categoryMeta[cat] || { label: cat, icon: 'folder' };
        groups[cat] = { name: meta.label, key: cat, icon: meta.icon, templates: [] };
      }
      groups[cat].templates.push(t);
    });

    const categories = [];

    // Personnalises en premier
    if (personalise.length > 0) {
      categories.push({
        name: 'Personnalises',
        key: 'personnalises',
        icon: 'sparkles',
        templates: personalise,
      });
    }

    // Puis les categories standard
    const catOrder = ['contrats', 'actes_procedure', 'courriers', 'conclusions', 'droit_societes', 'divers'];
    catOrder.forEach(cat => {
      if (groups[cat]) categories.push(groups[cat]);
    });
    // Any remaining categories
    Object.keys(groups).forEach(cat => {
      if (!catOrder.includes(cat)) categories.push(groups[cat]);
    });

    return successResponse(res, { categories });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CRUD TEMPLATES
// ============================================================================

// GET /api/templates/:id — single template with blocks and variables
router.get('/:id', async (req, res, next) => {
  try {
    const template = await prisma.template.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!template) throw new NotFoundError('Template not found');
    return successResponse(res, template);
  } catch (error) {
    next(error);
  }
});

// POST /api/templates — create template
router.post('/', async (req, res, next) => {
  try {
    const { name, description, category, folderType, folderNature, sourceFileUrl, variables, blocks } = req.body;
    if (!name) throw new BadRequestError('name is required');

    const template = await prisma.template.create({
      data: {
        tenantId: req.tenant.id,
        name,
        description: description || '',
        category: category || 'divers',
        folderType: folderType || 'les_deux',
        folderNature: folderNature || null,
        sourceFileUrl: sourceFileUrl || null,
        variables: variables || [],
        blocks: blocks || [],
        isSystem: false,
        isPersonalise: true,
      },
    });

    return successResponse(res, template, 'Template cree', 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/templates/:id — update template
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.template.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Template not found');

    const { name, description, category, folderType, folderNature, sourceFileUrl, variables, blocks } = req.body;

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(folderType !== undefined && { folderType }),
        ...(folderNature !== undefined && { folderNature }),
        ...(sourceFileUrl !== undefined && { sourceFileUrl }),
        ...(variables !== undefined && { variables }),
        ...(blocks !== undefined && { blocks }),
      },
    });

    return successResponse(res, template, 'Template mis a jour');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/templates/:id — soft delete
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.template.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Template not found');
    if (existing.isSystem) throw new BadRequestError('Cannot delete system template');

    await prisma.template.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    return successResponse(res, null, 'Template supprime');
  } catch (error) {
    next(error);
  }
});

// POST /api/templates/:id/duplicate — duplicate a template
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const original = await prisma.template.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!original) throw new NotFoundError('Template not found');

    const duplicate = await prisma.template.create({
      data: {
        tenantId: req.tenant.id,
        name: `${original.name} (Copie)`,
        description: original.description,
        category: original.category,
        sourceFileUrl: original.sourceFileUrl,
        folderType: original.folderType,
        folderNature: original.folderNature,
        variables: original.variables,
        blocks: original.blocks,
        isSystem: false,
        isPersonalise: true,
      },
    });

    return successResponse(res, duplicate, 'Template duplique', 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/templates/:id/blocks — save blocks composition
router.put('/:id/blocks', async (req, res, next) => {
  try {
    const existing = await prisma.template.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Template not found');

    const { blocks } = req.body;
    if (!Array.isArray(blocks)) throw new BadRequestError('blocks must be an array');

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: { blocks },
    });

    return successResponse(res, template, 'Blocs sauvegardes');
  } catch (error) {
    next(error);
  }
});

// POST /api/templates/:id/upload-source — upload .docx source
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/:id/upload-source', upload.single('file'), async (req, res, next) => {
  try {
    const existing = await prisma.template.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Template not found');

    if (!req.file) throw new BadRequestError('No file uploaded');

    const filename = sanitizeFilename(req.file.originalname);
    const objectKey = `${req.tenant.id}/templates/${Date.now()}-${filename}`;

    await storageService.uploadFile(req.file.buffer, objectKey, {
      originalName: filename,
      mimeType: req.file.mimetype,
    }, false);

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: { sourceFileUrl: objectKey },
    });

    return successResponse(res, template, 'Fichier source televerse');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DOCUMENT GENERATION FROM TEMPLATE (DOCX)
// ============================================================================

/**
 * POST /api/templates/generate
 * Body: { templateId, folderId, categoryId?, titre?, additionalData? }
 *
 * 1. Load template (get .docx source)
 * 2. Collect folder data
 * 3. Identify missing required fields
 * 4. If missing → return { status: 'missing_fields', fields: [...] }
 * 5. If OK → generate .docx → store in MinIO → return document
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { templateId, folderId, categoryId, titre, additionalData } = req.body;

    if (!templateId) throw new BadRequestError('templateId is required');
    if (!folderId) throw new BadRequestError('folderId is required');

    // 1. Load template
    const template = await prisma.template.findFirst({
      where: { id: templateId, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!template) throw new NotFoundError('Template not found');

    // Verify folder
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId: req.tenant.id },
      include: { client: { select: { id: true, firstName: true, lastName: true, companyName: true } } },
    });
    if (!folder) throw new NotFoundError('Folder not found');

    // 2. Collect data
    const data = await templateEngine.collectData(folderId, req.tenant.id);

    // Merge additional data if provided
    if (additionalData) {
      templateEngine.mergeAdditionalData(data, additionalData);
    }

    // 3. Check missing fields (only if no additionalData = first attempt)
    if (!additionalData && template.variables && Array.isArray(template.variables)) {
      const missing = templateEngine.findMissingFields(data, template.variables);
      const requiredMissing = missing.filter(m => m.required);

      if (requiredMissing.length > 0) {
        return successResponse(res, {
          status: 'missing_fields',
          fields: missing,
          templateName: template.name,
        });
      }
    }

    // 4. Load template .docx file
    let templateBuffer;
    if (template.sourceFileUrl) {
      // Download from MinIO
      try {
        // sourceFileUrl format: objectKey or full URL
        const objectKey = template.sourceFileUrl.startsWith('http')
          ? template.sourceFileUrl.split('/').slice(-2).join('/')
          : template.sourceFileUrl;

        // Try direct download (templates may not be encrypted)
        templateBuffer = await storageService.downloadFile(objectKey);
      } catch (err) {
        logger.warn('Could not download template file from storage, using fallback', { err: err.message });
        // Fallback: try filesystem
        const fs = require('fs');
        const path = require('path');
        const localPath = path.join(__dirname, '../../templates', template.sourceFileUrl);
        if (fs.existsSync(localPath)) {
          templateBuffer = fs.readFileSync(localPath);
        } else {
          throw new BadRequestError('Template source file not found');
        }
      }
    } else {
      throw new BadRequestError('Template has no source file (.docx)');
    }

    // 5. Generate document
    const docBuffer = templateEngine.generateDocument(templateBuffer, data);

    // 6. Store in MinIO
    const clientName = folder.client?.companyName || `${folder.client?.firstName || ''} ${folder.client?.lastName || ''}`.trim();
    const docName = titre || `${template.name} - ${clientName}`;
    const filename = sanitizeFilename(`${docName}.docx`);
    const objectKey = `${req.tenant.id}/documents/${Date.now()}-${filename}`;

    const uploaded = await storageService.uploadFile(docBuffer, objectKey, {
      originalName: filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }, false);

    // 7. Create Document record
    const document = await prisma.document.create({
      data: {
        name: docName,
        description: `Genere depuis le template: ${template.name}`,
        type: template.category === 'contrats' ? 'CONTRACT' : template.category === 'actes_procedure' ? 'DEED' : template.category === 'courriers' ? 'LETTER' : 'OTHER',
        filename: objectKey.split('/').pop(),
        originalName: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: BigInt(docBuffer.length),
        checksum: uploaded.checksum,
        bucketName: uploaded.bucket,
        objectKey: uploaded.objectKey,
        isEncrypted: false,
        folderId,
        tenantId: req.tenant.id,
        createdById: req.user.id,
        templateId: template.id,
        docCategoryId: categoryId || null,
        status: 'DRAFT',
      },
      include: {
        folder: { select: { id: true, title: true, reference: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // 8. Increment template usage
    await prisma.template.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 } },
    });

    // 9. Timeline event
    await prisma.timelineEvent.create({
      data: {
        folderId,
        documentId: document.id,
        type: 'document_cree',
        description: `Document "${docName}" genere depuis le template "${template.name}"`,
        userId: req.user.id,
      },
    });

    // 10. Audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_GENERATED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: { templateId, templateName: template.name, folderId },
      },
    });

    logger.info('Document generated from template', {
      documentId: document.id,
      templateId,
      folderId,
      userId: req.user.id,
    });

    return successResponse(res, {
      status: 'created',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        status: document.status,
        folderId: document.folderId,
        createdAt: document.createdAt,
      },
    }, 'Document genere avec succes', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/generate/force
 * Same as /generate but forces generation even with missing fields
 */
router.post('/generate/force', async (req, res, next) => {
  // Forward to generate with a flag to skip missing fields check
  req.body._forceGenerate = true;
  req.body.additionalData = req.body.additionalData || {};

  // Delegate to generate handler (additionalData presence skips check)
  try {
    const { templateId, folderId, categoryId, titre, additionalData } = req.body;

    if (!templateId) throw new BadRequestError('templateId is required');
    if (!folderId) throw new BadRequestError('folderId is required');

    const template = await prisma.template.findFirst({
      where: { id: templateId, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!template) throw new NotFoundError('Template not found');

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId: req.tenant.id },
      include: { client: { select: { id: true, firstName: true, lastName: true, companyName: true } } },
    });
    if (!folder) throw new NotFoundError('Folder not found');

    const data = await templateEngine.collectData(folderId, req.tenant.id);
    if (additionalData) {
      templateEngine.mergeAdditionalData(data, additionalData);
    }

    // Also update client/folder with additionalData
    if (additionalData && Object.keys(additionalData).length > 0) {
      const clientUpdates = {};
      const folderUpdates = {};
      for (const [key, value] of Object.entries(additionalData)) {
        if (!value) continue;
        const [section, field] = key.split('.');
        if (section === 'client') {
          // Map back from template field names to Prisma field names
          const fieldMap = {
            nom: 'lastName', prenom: 'firstName', civilite: 'civilite',
            adresse: 'address', email: 'email', telephone: 'phone',
            nationalite: 'nationalite', date_naissance: 'birthDate',
            lieu_naissance: 'lieuNaissance', profession: 'profession',
            secu: 'secu',
          };
          const prismaField = fieldMap[field];
          if (prismaField) {
            if (prismaField === 'birthDate') {
              clientUpdates[prismaField] = new Date(value);
            } else {
              clientUpdates[prismaField] = value;
            }
          }
        } else if (section === 'dossier') {
          const fieldMap = {
            juridiction: 'juridiction', rg: 'numeroRG', chambre: 'chambre',
          };
          if (fieldMap[field]) {
            folderUpdates[fieldMap[field]] = value;
          }
        }
      }

      if (Object.keys(clientUpdates).length > 0 && folder.clientId) {
        await prisma.client.update({
          where: { id: folder.clientId },
          data: clientUpdates,
        });
      }
      if (Object.keys(folderUpdates).length > 0) {
        await prisma.folder.update({
          where: { id: folderId },
          data: folderUpdates,
        });
      }
    }

    // Load template file
    let templateBuffer;
    if (template.sourceFileUrl) {
      try {
        const objectKey = template.sourceFileUrl.startsWith('http')
          ? template.sourceFileUrl.split('/').slice(-2).join('/')
          : template.sourceFileUrl;
        templateBuffer = await storageService.downloadFile(objectKey);
      } catch {
        const fs = require('fs');
        const path = require('path');
        const localPath = path.join(__dirname, '../../templates', template.sourceFileUrl);
        if (fs.existsSync(localPath)) {
          templateBuffer = fs.readFileSync(localPath);
        } else {
          throw new BadRequestError('Template source file not found');
        }
      }
    } else {
      throw new BadRequestError('Template has no source file (.docx)');
    }

    // Generate
    const docBuffer = templateEngine.generateDocument(templateBuffer, data);

    // Store
    const clientName = folder.client?.companyName || `${folder.client?.firstName || ''} ${folder.client?.lastName || ''}`.trim();
    const docName = titre || `${template.name} - ${clientName}`;
    const filename = sanitizeFilename(`${docName}.docx`);
    const objectKey = `${req.tenant.id}/documents/${Date.now()}-${filename}`;

    const uploaded = await storageService.uploadFile(docBuffer, objectKey, {
      originalName: filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }, false);

    const document = await prisma.document.create({
      data: {
        name: docName,
        description: `Genere depuis le template: ${template.name}`,
        type: template.category === 'contrats' ? 'CONTRACT' : template.category === 'actes_procedure' ? 'DEED' : template.category === 'courriers' ? 'LETTER' : 'OTHER',
        filename: objectKey.split('/').pop(),
        originalName: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: BigInt(docBuffer.length),
        checksum: uploaded.checksum,
        bucketName: uploaded.bucket,
        objectKey: uploaded.objectKey,
        isEncrypted: false,
        folderId,
        tenantId: req.tenant.id,
        createdById: req.user.id,
        templateId: template.id,
        docCategoryId: categoryId || null,
        status: 'DRAFT',
      },
    });

    await prisma.template.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 } },
    });

    await prisma.timelineEvent.create({
      data: {
        folderId,
        documentId: document.id,
        type: 'document_cree',
        description: `Document "${docName}" genere depuis le template "${template.name}"`,
        userId: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_GENERATED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        metadata: { templateId, templateName: template.name, folderId, forced: true },
      },
    });

    return successResponse(res, {
      status: 'created',
      document: {
        id: document.id,
        name: document.name,
        folderId: document.folderId,
      },
    }, 'Document genere avec succes', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/check-duplicate?folderId=...&templateId=...&type=...
 */
router.get('/check-duplicate', async (req, res, next) => {
  try {
    const { folderId, templateId, type } = req.query;

    if (!folderId) throw new BadRequestError('folderId is required');

    const where = {
      folderId,
      tenantId: req.tenant.id,
      deletedAt: null,
    };

    if (templateId) where.templateId = templateId;
    if (type) where.type = type;

    const existing = await prisma.document.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true,
      },
    });

    return successResponse(res, {
      exists: !!existing,
      existingDocument: existing || null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
