import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import type { DocumentsQuery } from './extranet.schemas';

export class ExtranetService {
  /**
   * Get client dashboard data
   */
  async getDashboard(clientAccessId: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { id: clientAccessId },
      include: {
        folder: { select: { id: true, name: true } },
        cabinet: { select: { name: true, email: true, phone: true } },
        client: { select: { id: true, nom: true, prenom: true, denomination: true } },
      },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client non trouve');
    }

    // Get documents stats for allowed folders
    const documents = await prisma.document.findMany({
      where: {
        folderId: { in: clientAccess.allowedFolders },
        deletedAt: null,
      },
      include: {
        tracking: true,
      },
    });

    const stats = {
      totalDocuments: documents.length,
      pendingSignature: documents.filter(d => d.tracking?.status === 'PENDING_SIGNATURE').length,
      signed: documents.filter(d => d.tracking?.status === 'SIGNED').length,
      pendingDelivery: documents.filter(d => d.tracking?.status === 'PENDING_DELIVERY').length,
      delivered: documents.filter(d => d.tracking?.status === 'DELIVERED').length,
      activeFolders: clientAccess.allowedFolders.length,
    };

    // Get recent documents
    const recentDocuments = await prisma.document.findMany({
      where: {
        folderId: { in: clientAccess.allowedFolders },
        deletedAt: null,
      },
      include: {
        tracking: {
          include: {
            reminderLogs: {
              orderBy: { sentAt: 'desc' },
              take: 5,
            },
          },
        },
        folder: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      client: {
        id: clientAccess.id,
        email: clientAccess.email,
        firstName: clientAccess.firstName,
        lastName: clientAccess.lastName,
        companyName: clientAccess.companyName,
        cabinetName: clientAccess.cabinet.name,
        cabinetEmail: clientAccess.cabinet.email,
        cabinetPhone: clientAccess.cabinet.phone,
        mainFolder: clientAccess.folder,
        linkedClient: clientAccess.client,
        permissions: clientAccess.permissions,
      },
      stats,
      recentDocuments,
    };
  }

  /**
   * Get documents for a client
   */
  async getDocuments(clientAccessId: string, query: DocumentsQuery, ipAddress?: string, userAgent?: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { id: clientAccessId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client non trouve');
    }

    const { page, limit, folderId, type, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      folderId: { in: clientAccess.allowedFolders },
      deletedAt: null,
    };

    if (folderId) {
      if (!clientAccess.allowedFolders.includes(folderId)) {
        throw new ForbiddenError('Acces non autorise a ce dossier');
      }
      where.folderId = folderId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.tracking = { status };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          tracking: {
            include: {
              reminderLogs: {
                orderBy: { sentAt: 'desc' },
              },
            },
          },
          folder: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    // Log access
    await prisma.clientAccessLog.create({
      data: {
        clientAccessId,
        action: 'VIEW_FOLDER',
        folderId: folderId || null,
        ipAddress,
        userAgent,
      },
    });

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single document
   */
  async getDocument(clientAccessId: string, documentId: string, ipAddress?: string, userAgent?: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { id: clientAccessId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client non trouve');
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        folderId: { in: clientAccess.allowedFolders },
        deletedAt: null,
      },
      include: {
        tracking: {
          include: {
            reminderLogs: {
              orderBy: { sentAt: 'desc' },
            },
          },
        },
        folder: { select: { id: true, name: true } },
        signatureTransactions: {
          where: { deletedAt: null },
          include: {
            signatories: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        lrarShipments: {
          where: { deletedAt: null },
          include: {
            trackingEvents: {
              orderBy: { eventAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve ou acces refuse');
    }

    // Log access
    await prisma.clientAccessLog.create({
      data: {
        clientAccessId,
        action: 'VIEW_DOCUMENT',
        documentId,
        folderId: document.folderId,
        ipAddress,
        userAgent,
      },
    });

    return document;
  }

  /**
   * Get folders accessible to client
   */
  async getFolders(clientAccessId: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { id: clientAccessId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client non trouve');
    }

    const folders = await prisma.folder.findMany({
      where: {
        id: { in: clientAccess.allowedFolders },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        folderType: true,
        _count: {
          select: {
            documents: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return folders;
  }

  /**
   * Get document download info (checks permissions)
   */
  async getDocumentDownloadInfo(clientAccessId: string, documentId: string, ipAddress?: string, userAgent?: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { id: clientAccessId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client non trouve');
    }

    const permissions = clientAccess.permissions as { canDownload?: boolean };
    if (!permissions.canDownload) {
      throw new ForbiddenError('Telechargement non autorise');
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        folderId: { in: clientAccess.allowedFolders },
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    // Log download
    await prisma.clientAccessLog.create({
      data: {
        clientAccessId,
        action: 'DOWNLOAD_DOCUMENT',
        documentId,
        folderId: document.folderId,
        ipAddress,
        userAgent,
      },
    });

    logger.info(`[Extranet] Document ${documentId} downloaded by client ${clientAccessId}`);

    return document;
  }

  /**
   * Log sign document action
   */
  async logSignDocument(clientAccessId: string, documentId: string, ipAddress?: string, userAgent?: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { id: clientAccessId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client non trouve');
    }

    const permissions = clientAccess.permissions as { canSign?: boolean };
    if (!permissions.canSign) {
      throw new ForbiddenError('Signature non autorisee');
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        folderId: { in: clientAccess.allowedFolders },
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    // Log sign action
    await prisma.clientAccessLog.create({
      data: {
        clientAccessId,
        action: 'SIGN_DOCUMENT',
        documentId,
        folderId: document.folderId,
        ipAddress,
        userAgent,
      },
    });

    logger.info(`[Extranet] Document ${documentId} sign initiated by client ${clientAccessId}`);
  }
}

export const extranetService = new ExtranetService();
