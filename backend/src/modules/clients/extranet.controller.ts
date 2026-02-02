import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedClientRequest, canAccessFolder, canAccessDocument } from '../../middlewares/client-auth';
import { minioService } from '../../services/minio.service';
import { pushNotificationService } from '../../services/push-notification.service';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class ExtranetController {
  /**
   * Get client dashboard data
   * GET /api/extranet/dashboard
   */
  async getDashboard(req: AuthenticatedClientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientAccess = req.clientAccess!;

      // Get accessible folders
      const folderIds = clientAccess.folderId
        ? [clientAccess.folderId, ...clientAccess.allowedFolders]
        : clientAccess.allowedFolders;

      // Count total documents
      const totalDocuments = await prisma.document.count({
        where: {
          folderId: { in: folderIds },
          deletedAt: null,
        },
      });

      // Count pending signatures
      const pendingSignatures = await prisma.documentTracking.count({
        where: {
          document: {
            folderId: { in: folderIds },
            deletedAt: null,
          },
          status: { in: ['PENDING_SIGNATURE', 'PARTIALLY_SIGNED'] },
        },
      });

      // Get recent documents
      const recentDocuments = await prisma.document.findMany({
        where: {
          folderId: { in: folderIds },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          tracking: {
            select: {
              status: true,
              reminderCount: true,
              lastReminderAt: true,
              nextReminderAt: true,
              autoRemindersEnabled: true,
            },
          },
        },
      });

      // Log dashboard view
      await prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'VIEW_FOLDER',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { view: 'dashboard' },
        },
      });

      res.json({
        totalDocuments,
        pendingSignatures,
        recentDocuments: recentDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title,
          filename: doc.originalName,
          type: doc.type,
          createdAt: doc.createdAt,
          tracking: doc.tracking,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents list
   * GET /api/extranet/documents
   */
  async getDocuments(req: AuthenticatedClientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientAccess = req.clientAccess!;
      const { status, search, page = '1', limit = '20' } = req.query;

      // Get accessible folders
      const folderIds = clientAccess.folderId
        ? [clientAccess.folderId, ...clientAccess.allowedFolders]
        : clientAccess.allowedFolders;

      const where: any = {
        folderId: { in: folderIds },
        deletedAt: null,
      };

      // Filter by tracking status
      if (status) {
        where.tracking = { status: status as string };
      }

      // Search filter
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { originalName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          include: {
            tracking: {
              select: {
                status: true,
                reminderCount: true,
                lastReminderAt: true,
                nextReminderAt: true,
                autoRemindersEnabled: true,
                deliveryMethod: true,
              },
            },
            folder: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.document.count({ where }),
      ]);

      res.json({
        documents: documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          filename: doc.originalName,
          type: doc.type,
          size: doc.size.toString(),
          createdAt: doc.createdAt,
          folder: doc.folder,
          tracking: doc.tracking,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single document details
   * GET /api/extranet/documents/:id
   */
  async getDocument(req: AuthenticatedClientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientAccess = req.clientAccess!;
      const { id } = req.params;

      // Check access
      const hasAccess = await canAccessDocument(clientAccess, id);
      if (!hasAccess) {
        res.status(403).json({ error: 'Accès non autorisé à ce document' });
        return;
      }

      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          tracking: true,
          folder: {
            select: { id: true, name: true },
          },
        },
      });

      if (!document || document.deletedAt) {
        res.status(404).json({ error: 'Document non trouvé' });
        return;
      }

      // Log view
      await prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'VIEW_DOCUMENT',
          documentId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        id: document.id,
        title: document.title,
        filename: document.originalName,
        type: document.type,
        size: document.size.toString(),
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        folder: document.folder,
        tracking: document.tracking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download document
   * GET /api/extranet/documents/:id/download
   */
  async downloadDocument(req: AuthenticatedClientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientAccess = req.clientAccess!;
      const { id } = req.params;

      // Check permission
      if (!clientAccess.permissions.canDownload) {
        res.status(403).json({ error: 'Téléchargement non autorisé' });
        return;
      }

      // Check access
      const hasAccess = await canAccessDocument(clientAccess, id);
      if (!hasAccess) {
        res.status(403).json({ error: 'Accès non autorisé à ce document' });
        return;
      }

      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document || document.deletedAt) {
        res.status(404).json({ error: 'Document non trouvé' });
        return;
      }

      // Get file from MinIO
      const { stream } = await minioService.downloadFile(document.minioPath, document.minioBucket);

      // Log download
      await prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'DOWNLOAD_DOCUMENT',
          documentId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Length', document.size.toString());

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Subscribe to push notifications
   * POST /api/extranet/push/subscribe
   */
  async subscribePush(req: AuthenticatedClientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientAccess = req.clientAccess!;
      const { endpoint, keys } = req.body;

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        res.status(400).json({ error: 'Données de souscription invalides' });
        return;
      }

      const success = await pushNotificationService.subscribe(clientAccess.id, {
        endpoint,
        keys,
      });

      if (success) {
        res.json({ message: 'Souscription aux notifications activée' });
      } else {
        res.status(500).json({ error: 'Erreur lors de la souscription' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unsubscribe from push notifications
   * POST /api/extranet/push/unsubscribe
   */
  async unsubscribePush(req: AuthenticatedClientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        res.status(400).json({ error: 'Endpoint requis' });
        return;
      }

      await pushNotificationService.unsubscribe(endpoint);

      res.json({ message: 'Souscription aux notifications désactivée' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get VAPID public key
   * GET /api/extranet/push/vapid-key
   */
  async getVapidKey(req: AuthenticatedClientRequest, res: Response): Promise<void> {
    const publicKey = pushNotificationService.getPublicKey();

    if (!publicKey) {
      res.status(503).json({ error: 'Notifications push non configurées' });
      return;
    }

    res.json({ publicKey });
  }

  /**
   * Logout client
   * POST /api/extranet/auth/logout
   */
  async logout(req: AuthenticatedClientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientAccess = req.clientAccess!;

      // Log logout
      await prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'LOGOUT',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Client logged out: ${clientAccess.email}`);

      res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
      next(error);
    }
  }
}

export const extranetController = new ExtranetController();
export default extranetController;
