import { prisma } from '@/config/database';
import { DocumentType, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import {
  uploadToMinio,
  downloadFromMinio,
  deleteFromMinio,
} from './upload.middleware';
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  ListDocumentsInput,
  SearchDocumentsInput,
} from './documents.schemas';

export class DocumentsService {
  /**
   * Upload and create a new document
   */
  async uploadDocument(
    file: Express.Multer.File,
    cabinetId: string,
    folderId: string,
    userId: string,
    metadata?: Partial<CreateDocumentInput>
  ) {
    // Verify folder exists and belongs to cabinet
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, cabinetId, deletedAt: null },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Upload to MinIO with encryption
    const uploadResult = await uploadToMinio(file, cabinetId, folderId);

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: metadata?.name || file.originalname,
        description: metadata?.description,
        type: metadata?.type || DocumentType.OTHER,
        filename: uploadResult.storagePath.split('/').pop() || file.originalname,
        originalName: file.originalname,
        minioPath: uploadResult.storagePath,
        minioBucket: 'documents',
        mimeType: uploadResult.mimeType,
        size: BigInt(uploadResult.fileSize),
        isEncrypted: true,
        encryptionKey: uploadResult.storageKey,
        folderId,
        cabinetId,
        createdById: userId,
      },
      include: {
        folder: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_CREATED',
        entity: 'Document',
        entityId: document.id,
        details: {
          title: document.title,
          type: document.type,
          folderId,
          fileSize: Number(document.size),
        },
      },
    });

    return this.formatDocument(document);
  }

  /**
   * Upload multiple documents
   */
  async uploadDocuments(
    files: Express.Multer.File[],
    cabinetId: string,
    folderId: string,
    userId: string
  ) {
    const results = await Promise.all(
      files.map((file) => this.uploadDocument(file, cabinetId, folderId, userId))
    );
    return results;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, cabinetId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
      include: {
        folder: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        versions: {
          select: {
            id: true,
            version: true,
            createdAt: true,
            size: true,
            createdById: true,
          },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return this.formatDocument(document);
  }

  /**
   * List documents with filtering and pagination
   */
  async listDocuments(cabinetId: string, query: ListDocumentsInput) {
    const { page, limit, folderId, type, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      cabinetId,
      deletedAt: null,
      isLatestVersion: true,
    };

    if (folderId) {
      where.folderId = folderId;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Map sortBy fields
    const sortField = sortBy === 'name' ? 'title' : sortBy === 'fileSize' ? 'size' : sortBy;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          folder: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: documents.map(this.formatDocument),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Search documents with advanced filters
   */
  async searchDocuments(cabinetId: string, filters: SearchDocumentsInput) {
    const { page, limit, query, type, folderId, createdById, dateFrom, dateTo, minSize, maxSize } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      cabinetId,
      deletedAt: null,
      isLatestVersion: true,
    };

    // Full-text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ];
    }

    // Type filter
    if (type && type.length > 0) {
      where.type = { in: type };
    }

    // Folder filter
    if (folderId) {
      where.folderId = folderId;
    }

    // Creator filter
    if (createdById) {
      where.createdById = createdById;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Size filter
    if (minSize || maxSize) {
      where.size = {};
      if (minSize) where.size.gte = BigInt(minSize);
      if (maxSize) where.size.lte = BigInt(maxSize);
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          folder: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: documents.map(this.formatDocument),
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
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    cabinetId: string,
    userId: string,
    data: UpdateDocumentInput
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const updateData: Prisma.DocumentUpdateInput = {};
    if (data.name !== undefined) updateData.title = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        folder: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_UPDATED',
        entity: 'Document',
        entityId: documentId,
        details: { changes: data },
      },
    });

    return this.formatDocument(updated);
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string, cabinetId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Soft delete - mark as deleted
    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // Delete from MinIO
    try {
      await deleteFromMinio(document.minioPath);
    } catch (error) {
      // Log but don't fail - file might already be deleted
      console.error('Failed to delete from MinIO:', error);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_DELETED',
        entity: 'Document',
        entityId: documentId,
        details: { title: document.title },
      },
    });
  }

  /**
   * Move document to another folder
   */
  async moveDocument(
    documentId: string,
    cabinetId: string,
    userId: string,
    targetFolderId: string
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Verify target folder
    const targetFolder = await prisma.folder.findFirst({
      where: { id: targetFolderId, cabinetId, deletedAt: null },
    });

    if (!targetFolder) {
      throw new NotFoundError('Target folder not found');
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { folderId: targetFolderId },
      include: {
        folder: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_UPDATED',
        entity: 'Document',
        entityId: documentId,
        details: { action: 'moved', targetFolderId },
      },
    });

    return this.formatDocument(updated);
  }

  /**
   * Bulk move documents
   */
  async bulkMoveDocuments(
    documentIds: string[],
    cabinetId: string,
    userId: string,
    targetFolderId: string
  ) {
    // Verify target folder
    const targetFolder = await prisma.folder.findFirst({
      where: { id: targetFolderId, cabinetId, deletedAt: null },
    });

    if (!targetFolder) {
      throw new NotFoundError('Target folder not found');
    }

    // Verify all documents belong to cabinet
    const documents = await prisma.document.findMany({
      where: { id: { in: documentIds }, cabinetId, deletedAt: null },
    });

    if (documents.length !== documentIds.length) {
      throw new BadRequestError('Some documents not found');
    }

    await prisma.document.updateMany({
      where: { id: { in: documentIds } },
      data: { folderId: targetFolderId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_UPDATED',
        entity: 'Document',
        entityId: documentIds[0],
        details: { action: 'bulk_move', documentIds, targetFolderId },
      },
    });

    return { moved: documentIds.length };
  }

  /**
   * Bulk delete documents
   */
  async bulkDeleteDocuments(documentIds: string[], cabinetId: string, userId: string) {
    const documents = await prisma.document.findMany({
      where: { id: { in: documentIds }, cabinetId, deletedAt: null },
    });

    if (documents.length !== documentIds.length) {
      throw new BadRequestError('Some documents not found');
    }

    // Soft delete from database
    await prisma.document.updateMany({
      where: { id: { in: documentIds } },
      data: { deletedAt: new Date() },
    });

    // Delete from MinIO
    for (const doc of documents) {
      try {
        await deleteFromMinio(doc.minioPath);
      } catch (error) {
        console.error('Failed to delete from MinIO:', error);
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_DELETED',
        entity: 'Document',
        entityId: documentIds[0],
        details: { action: 'bulk_delete', documentIds },
      },
    });

    return { deleted: documents.length };
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string, cabinetId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (!document.encryptionKey) {
      throw new BadRequestError('Document encryption key not found');
    }

    const { buffer, originalMime } = await downloadFromMinio(
      document.minioPath,
      document.encryptionKey
    );

    return {
      buffer,
      mimeType: originalMime || document.mimeType,
      filename: document.originalName || document.title,
    };
  }

  /**
   * Create a new version of a document
   */
  async createVersion(
    documentId: string,
    file: Express.Multer.File,
    cabinetId: string,
    userId: string
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Upload new version to MinIO
    const uploadResult = await uploadToMinio(file, cabinetId, document.folderId || '');

    // Get current max version
    const maxVersion = await prisma.documentVersion.aggregate({
      where: { documentId },
      _max: { version: true },
    });

    const newVersion = (maxVersion._max.version || document.version) + 1;

    // Create version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        version: newVersion,
        filename: file.originalname,
        minioPath: uploadResult.storagePath,
        size: BigInt(uploadResult.fileSize),
        createdById: userId,
      },
    });

    // Update document with new version info
    await prisma.document.update({
      where: { id: documentId },
      data: {
        version: newVersion,
        minioPath: uploadResult.storagePath,
        encryptionKey: uploadResult.storageKey,
        size: BigInt(uploadResult.fileSize),
        mimeType: uploadResult.mimeType,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_UPDATED',
        entity: 'Document',
        entityId: documentId,
        details: { action: 'new_version', version: newVersion },
      },
    });

    return {
      id: version.id,
      version: version.version,
      filename: version.filename,
      size: Number(version.size),
      createdAt: version.createdAt,
    };
  }

  /**
   * Get document versions
   */
  async getVersions(documentId: string, cabinetId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
      include: {
        document: {
          select: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    // Include current version
    const allVersions = [
      {
        id: document.id,
        version: document.version,
        filename: document.filename,
        size: Number(document.size),
        createdAt: document.updatedAt,
        isCurrent: true,
      },
      ...versions.map((v) => ({
        id: v.id,
        version: v.version,
        filename: v.filename,
        size: Number(v.size),
        createdAt: v.createdAt,
        isCurrent: false,
      })),
    ];

    return allVersions;
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(
    documentId: string,
    versionId: string,
    cabinetId: string,
    userId: string
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const versionToRestore = await prisma.documentVersion.findFirst({
      where: { id: versionId, documentId },
    });

    if (!versionToRestore) {
      throw new NotFoundError('Version not found');
    }

    // Create a new version from the old one
    const maxVersion = await prisma.documentVersion.aggregate({
      where: { documentId },
      _max: { version: true },
    });

    const newVersion = (maxVersion._max.version || document.version) + 1;

    // Create new version record pointing to restored file
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        version: newVersion,
        filename: versionToRestore.filename,
        minioPath: versionToRestore.minioPath,
        size: versionToRestore.size,
        comment: `Restored from version ${versionToRestore.version}`,
        createdById: userId,
      },
    });

    // Update document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        version: newVersion,
        minioPath: versionToRestore.minioPath,
        size: versionToRestore.size,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'DOCUMENT_UPDATED',
        entity: 'Document',
        entityId: documentId,
        details: { action: 'restore_version', restoredVersion: versionToRestore.version, newVersion },
      },
    });

    return {
      id: version.id,
      version: version.version,
      filename: version.filename,
      size: Number(version.size),
      createdAt: version.createdAt,
    };
  }

  /**
   * Duplicate a document
   */
  async duplicateDocument(documentId: string, cabinetId: string, userId: string) {
    const original = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
    });

    if (!original) {
      throw new NotFoundError('Document not found');
    }

    if (!original.encryptionKey) {
      throw new BadRequestError('Document encryption key not found');
    }

    // Download original file
    const { buffer } = await downloadFromMinio(original.minioPath, original.encryptionKey);

    // Create a mock file object
    const file = {
      buffer,
      originalname: `${original.title} (copie)`,
      mimetype: original.mimeType,
      size: Number(original.size),
    } as Express.Multer.File;

    // Upload as new document
    const duplicate = await this.uploadDocument(file, cabinetId, original.folderId || '', userId, {
      name: `${original.title} (copie)`,
      description: original.description || undefined,
      type: original.type,
      folderId: original.folderId || '',
    });

    return duplicate;
  }

  /**
   * Format document for API response (handle BigInt)
   */
  private formatDocument(document: Record<string, unknown>): Record<string, unknown> {
    return {
      ...document,
      size: document.size ? Number(document.size) : 0,
      // Map title to name for API consistency
      name: document.title,
    };
  }
}

export const documentsService = new DocumentsService();
