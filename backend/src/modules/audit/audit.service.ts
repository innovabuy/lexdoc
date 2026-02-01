import { prisma } from '@/config/database';
import { AuditAction, Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';

interface AuditLogInput {
  action: string;
  entity: string;
  entityId: string;
  userId?: string;
  cabinetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogService {
  /**
   * Log an audit event
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      // Map action string to enum if valid, otherwise use a generic action
      const validAction = this.mapAction(input.action);

      await prisma.auditLog.create({
        data: {
          action: validAction,
          entity: input.entity,
          entityId: input.entityId,
          userId: input.userId || null,
          cabinetId: input.cabinetId,
          details: input.details ? (input.details as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break main operations
      logger.error('Failed to create audit log', {
        error,
        input: { ...input, details: undefined },
      });
    }
  }

  /**
   * Map action string to AuditAction enum
   */
  private mapAction(action: string): AuditAction {
    const actionMap: Record<string, AuditAction> = {
      // User actions
      USER_LOGIN: AuditAction.USER_LOGIN,
      USER_LOGOUT: AuditAction.USER_LOGOUT,
      USER_CREATED: AuditAction.USER_CREATED,
      USER_UPDATED: AuditAction.USER_UPDATED,
      USER_DELETED: AuditAction.USER_DELETED,
      USER_2FA_ENABLED: AuditAction.USER_2FA_ENABLED,
      USER_2FA_DISABLED: AuditAction.USER_2FA_DISABLED,
      USER_PASSWORD_CHANGED: AuditAction.USER_PASSWORD_CHANGED,
      USER_PASSWORD_RESET: AuditAction.USER_PASSWORD_RESET,

      // Document actions
      DOCUMENT_CREATED: AuditAction.DOCUMENT_CREATED,
      DOCUMENT_UPDATED: AuditAction.DOCUMENT_UPDATED,
      DOCUMENT_DELETED: AuditAction.DOCUMENT_DELETED,
      DOCUMENT_DOWNLOADED: AuditAction.DOCUMENT_DOWNLOADED,
      DOCUMENT_SHARED: AuditAction.DOCUMENT_SHARED,
      DOCUMENT_MOVED: AuditAction.DOCUMENT_UPDATED,
      DOCUMENT_DUPLICATED: AuditAction.DOCUMENT_CREATED,
      DOCUMENT_VERSION_CREATED: AuditAction.DOCUMENT_UPDATED,
      DOCUMENT_VERSION_RESTORED: AuditAction.DOCUMENT_UPDATED,

      // Folder actions
      FOLDER_CREATED: AuditAction.FOLDER_CREATED,
      FOLDER_UPDATED: AuditAction.FOLDER_UPDATED,
      FOLDER_DELETED: AuditAction.FOLDER_DELETED,
      FOLDER_MOVED: AuditAction.FOLDER_UPDATED,

      // Template actions
      TEMPLATE_CREATED: AuditAction.TEMPLATE_CREATED,
      TEMPLATE_USED: AuditAction.TEMPLATE_USED,

      // Cabinet actions
      CABINET_UPDATED: AuditAction.CABINET_UPDATED,
    };

    return actionMap[action] || AuditAction.DOCUMENT_UPDATED;
  }

  /**
   * Get audit logs for a cabinet
   */
  async getLogs(
    cabinetId: string,
    options: {
      page?: number;
      limit?: number;
      action?: AuditAction;
      entity?: string;
      entityId?: string;
      userId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ) {
    const { page = 1, limit = 50, action, entity, entityId, userId, dateFrom, dateTo } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      cabinetId,
    };

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditLogService = new AuditLogService();
