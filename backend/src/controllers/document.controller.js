const prisma = require('../config/database');
const storageService = require('../services/storage.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, sanitizeFilename, omitSensitiveFields } = require('../utils/helpers');
const logger = require('../config/logger');
const timeline = require('../services/timeline.service');

/**
 * List documents with search, filters and pagination
 */
const list = async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { folderId, status, type, search, tags, dateFrom, dateTo } = req.query;

    const where = {
      tenantId: req.tenant.id,
      deletedAt: null,
    };

    // Filters
    if (folderId) where.folderId = folderId;
    if (status) where.status = status;
    if (type) where.type = type;

    // Tags filter (array contains)
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      where.tags = { hasSome: tagArray };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Full-text search on name and description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: { select: { id: true, title: true, reference: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { versions: true, signatures: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    // Sanitize response
    const sanitized = documents.map(d => ({
      ...omitSensitiveFields(d),
      versionsCount: d._count?.versions || 0,
      signaturesCount: d._count?.signatures || 0,
    }));

    return paginatedResponse(res, sanitized, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Create (upload) a new document with encryption
 */
const create = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw new BadRequestError('File is required');
    }

    const { folderId, name, type, description, tags, category } = req.body;

    if (!folderId) {
      throw new BadRequestError('Folder ID is required');
    }

    // Verify folder exists and belongs to tenant
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId: req.tenant.id },
    });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Generate object key
    const objectKey = `${req.tenant.id}/documents/${Date.now()}-${sanitizeFilename(file.originalname)}`;

    // Upload with encryption
    const uploaded = await storageService.uploadFile(file.buffer, objectKey, {
      originalName: file.originalname,
      mimeType: file.mimetype,
    }, true);

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Create document in database
    const document = await prisma.document.create({
      data: {
        name: name || file.originalname,
        description: description || null,
        type: type || 'OTHER',
        tags: parsedTags,
        filename: objectKey.split('/').pop(),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
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
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    // Store encryption keys separately (in a real system, use secure key management)
    if (uploaded.isEncrypted) {
      await prisma.$executeRaw`
        UPDATE documents
        SET checksum = ${uploaded.checksum || ''} || '|' || ${uploaded.iv || ''} || '|' || ${uploaded.authTag || ''}
        WHERE id = ${document.id}
      `;
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_UPLOADED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
      },
    });

    // Timeline event
    if (folderId) {
      await timeline.addEvent({
        folderId,
        type: 'document_cree',
        description: `Document "${document.name}" ajouté`,
        userId: req.user.id,
        documentId: document.id,
        metadata: { originalName: file.originalname, mimeType: file.mimetype, size: file.size },
      });
    }

    logger.info('Document uploaded', {
      documentId: document.id,
      userId: req.user.id,
      tenantId: req.tenant.id,
    });

    return successResponse(res, omitSensitiveFields(document), 'Document uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get document by ID
 */
const getById = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        deletedAt: null,
      },
      include: {
        folder: { select: { id: true, title: true, reference: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
          select: { id: true, version: true, createdAt: true },
        },
        tracking: true,
        signatures: {
          select: { id: true, signerName: true, signerEmail: true, status: true, signedAt: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Create audit log for view
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_VIEWED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, omitSensitiveFields(document));
  } catch (error) {
    next(error);
  }
};

/**
 * Preview document (inline display)
 */
const preview = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Only allow preview for certain file types
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/html',
    ];

    if (!previewableTypes.includes(document.mimeType)) {
      return res.status(415).json({
        success: false,
        message: 'Ce type de fichier ne peut pas etre previsualise',
      });
    }

    let fileBuffer;

    if (document.isEncrypted && document.checksum) {
      const parts = document.checksum.split('|');
      if (parts.length === 3) {
        const [, iv, authTag] = parts;
        fileBuffer = await storageService.downloadDecrypted(document.objectKey, iv, authTag);
      } else {
        const url = await storageService.generatePresignedUrl(document.objectKey);
        return res.redirect(url);
      }
    } else {
      fileBuffer = await storageService.downloadFile(document.objectKey);
    }

    // Set headers for inline display
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Download document (with decryption)
 */
const download = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    let fileBuffer;

    if (document.isEncrypted && document.checksum) {
      // Extract encryption info from checksum field (format: checksum|iv|authTag)
      const parts = document.checksum.split('|');
      if (parts.length === 3) {
        const [, iv, authTag] = parts;
        fileBuffer = await storageService.downloadDecrypted(document.objectKey, iv, authTag);
      } else {
        // Fallback to presigned URL for legacy docs
        const url = await storageService.generatePresignedUrl(document.objectKey);
        return res.redirect(url);
      }
    } else {
      fileBuffer = await storageService.downloadFile(document.objectKey);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_DOWNLOADED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    // Set headers and send file
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    return res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Update document metadata
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, tags, category, status, folderId } = req.body;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: req.tenant.id,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // If changing folder, verify new folder exists
    if (folderId && folderId !== document.folderId) {
      const newFolder = await prisma.folder.findFirst({
        where: { id: folderId, tenantId: req.tenant.id },
      });
      if (!newFolder) {
        throw new NotFoundError('Destination folder not found');
      }
    }

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        tags: parsedTags,
        status: status || undefined,
        folderId: folderId || undefined,
      },
      include: {
        folder: { select: { id: true, title: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_UPDATED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: { name, description, tags, category, status, folderId },
      },
    });

    return successResponse(res, omitSensitiveFields(updated), 'Document updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload new version of document
 */
const uploadVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new BadRequestError('File is required');
    }

    // Find parent document
    const parentDoc = await prisma.document.findFirst({
      where: {
        id,
        tenantId: req.tenant.id,
        deletedAt: null,
      },
    });

    if (!parentDoc) {
      throw new NotFoundError('Document not found');
    }

    // Get next version number
    const maxVersion = await prisma.document.aggregate({
      where: {
        OR: [
          { id: parentDoc.id },
          { parentId: parentDoc.id },
        ],
      },
      _max: { version: true },
    });
    const nextVersion = (maxVersion._max.version || 1) + 1;

    // Upload new file with encryption
    const objectKey = `${req.tenant.id}/documents/${Date.now()}-v${nextVersion}-${sanitizeFilename(file.originalname)}`;
    const uploaded = await storageService.uploadFile(file.buffer, objectKey, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      version: nextVersion.toString(),
    }, true);

    // Create new version document
    const newVersion = await prisma.document.create({
      data: {
        name: parentDoc.name,
        description: parentDoc.description,
        type: parentDoc.type,
        category: parentDoc.category,
        tags: parentDoc.tags,
        filename: objectKey.split('/').pop(),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        checksum: `${uploaded.checksum}|${uploaded.iv}|${uploaded.authTag}`,
        bucketName: uploaded.bucket,
        objectKey: uploaded.objectKey,
        isEncrypted: uploaded.isEncrypted,
        version: nextVersion,
        parentId: parentDoc.id,
        folderId: parentDoc.folderId,
        tenantId: req.tenant.id,
        createdById: req.user.id,
        status: 'DRAFT',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_VERSION_UPLOADED',
        entityType: 'Document',
        entityId: newVersion.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          parentId: parentDoc.id,
          version: nextVersion,
          filename: file.originalname,
        },
      },
    });

    // Timeline event
    if (parentDoc.folderId) {
      await timeline.addEvent({
        folderId: parentDoc.folderId,
        type: 'document_modifie',
        description: `Nouvelle version (v${nextVersion}) de "${parentDoc.name}"`,
        userId: req.user.id,
        documentId: newVersion.id,
        metadata: { version: nextVersion, parentId: parentDoc.id },
      });
    }

    logger.info('Document version uploaded', {
      documentId: newVersion.id,
      parentId: parentDoc.id,
      version: nextVersion,
    });

    return successResponse(res, omitSensitiveFields(newVersion), `Version ${nextVersion} uploaded`, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get document versions
 */
const getVersions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: req.tenant.id,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const versions = await prisma.document.findMany({
      where: {
        OR: [
          { id: document.id },
          { parentId: document.id },
        ],
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        originalName: true,
        size: true,
        createdAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return successResponse(res, versions);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete document
 */
const deleteDoc = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Soft delete (keep file for recovery)
    await prisma.document.update({
      where: { id: document.id },
      data: { deletedAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_DELETED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    // Timeline event
    if (document.folderId) {
      await timeline.addEvent({
        folderId: document.folderId,
        type: 'document_supprime',
        description: `Document "${document.name}" supprimé`,
        userId: req.user.id,
        documentId: document.id,
      });
    }

    logger.info('Document deleted', {
      documentId: document.id,
      userId: req.user.id,
    });

    return successResponse(res, null, 'Document deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore deleted document
 */
const restore = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        deletedAt: { not: null },
      },
    });

    if (!document) {
      throw new NotFoundError('Deleted document not found');
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { deletedAt: null },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_RESTORED',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, null, 'Document restored');
  } catch (error) {
    next(error);
  }
};

/**
 * Get deleted documents (trash)
 */
const getDeleted = async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);

    const where = {
      tenantId: req.tenant.id,
      deletedAt: { not: null },
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { deletedAt: 'desc' },
        include: {
          folder: { select: { id: true, title: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return paginatedResponse(res, documents.map(d => omitSensitiveFields(d)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk download - return document info for selected IDs
 */
const bulkDownload = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('ids array is required');
    }

    if (ids.length > 100) {
      throw new BadRequestError('Maximum 100 documents at once');
    }

    const documents = await prisma.document.findMany({
      where: {
        id: { in: ids },
        tenantId: req.tenant.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
      },
    });

    return successResponse(res, documents);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete documents
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('ids array is required');
    }

    if (ids.length > 100) {
      throw new BadRequestError('Maximum 100 documents at once');
    }

    // Verify all documents belong to tenant
    const documents = await prisma.document.findMany({
      where: {
        id: { in: ids },
        tenantId: req.tenant.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    const validIds = documents.map((d) => d.id);

    if (validIds.length === 0) {
      throw new NotFoundError('No documents found');
    }

    // Soft delete all
    await prisma.document.updateMany({
      where: { id: { in: validIds } },
      data: { deletedAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENTS_BULK_DELETED',
        entityType: 'Document',
        entityId: validIds[0],
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: { documentIds: validIds, count: validIds.length },
      },
    });

    logger.info('Bulk delete documents', {
      count: validIds.length,
      userId: req.user.id,
      tenantId: req.tenant.id,
    });

    return successResponse(res, { deleted: validIds.length }, `${validIds.length} document(s) deleted`);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle document extranet visibility
 */
const toggleExtranet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;

    const document = await prisma.document.findFirst({
      where: { id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!document) throw new NotFoundError('Document not found');

    const updated = await prisma.document.update({
      where: { id },
      data: { visibleExtranet: visible !== undefined ? !!visible : !document.visibleExtranet },
      select: {
        id: true,
        name: true,
        visibleExtranet: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_UPDATED',
        entityType: 'Document',
        entityId: id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        metadata: { visibleExtranet: updated.visibleExtranet },
      },
    });

    return successResponse(res, updated, 'Extranet visibility updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  preview,
  download,
  update,
  uploadVersion,
  getVersions,
  delete: deleteDoc,
  restore,
  getDeleted,
  bulkDownload,
  bulkDelete,
  toggleExtranet,
};
