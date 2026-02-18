const prisma = require('../config/database');
const emailService = require('./email.service');
const logger = require('../config/logger');

class NotificationService {
  /**
   * Create a notification and optionally send email
   */
  async create({
    userId,
    tenantId,
    type,
    title,
    message,
    entityType = null,
    entityId = null,
    link = null,
    sendEmail = true,
  }) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          tenantId,
          type,
          title,
          message,
          entityType,
          entityId,
          link,
        },
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      });

      // Check if user wants email notifications
      if (sendEmail) {
        const prefs = await this.getUserPreferences(userId);
        const shouldEmail = this.shouldSendEmail(type, prefs);

        if (shouldEmail) {
          await this.sendNotificationEmail(notification);
        }
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulk(notifications) {
    const results = [];
    for (const notif of notifications) {
      const result = await this.create(notif);
      results.push(result);
    }
    return results;
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(userId, { page = 1, pageSize = 20, unreadOnly = false }) {
    const skip = (page - 1) * pageSize;
    const where = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });
  }

  /**
   * Get or create user notification preferences
   */
  async getUserPreferences(userId) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId, updates) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates },
    });
  }

  /**
   * Check if email should be sent based on type and preferences
   */
  shouldSendEmail(type, prefs) {
    if (!prefs) return true;

    const typeToPreference = {
      SIGNATURE_PENDING: 'emailSignatures',
      SIGNATURE_COMPLETED: 'emailSignatures',
      SIGNATURE_REMINDER: 'emailSignatures',
      DOCUMENT_UPLOADED: 'emailDocuments',
      DOCUMENT_SHARED: 'emailDocuments',
      DOCUMENT_REQUEST: 'emailDocuments',
      DOCUMENT_REQUEST_FULFILLED: 'emailDocuments',
      DEADLINE_APPROACHING: 'emailDeadlines',
      DEADLINE_PASSED: 'emailDeadlines',
      MESSAGE_RECEIVED: 'emailMessages',
    };

    const prefKey = typeToPreference[type];
    return prefKey ? prefs[prefKey] !== false : true;
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(notification) {
    try {
      const html = this.generateEmailHtml(notification);

      await emailService.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@lexdoc.fr',
        to: notification.user.email,
        subject: notification.title,
        html,
      });

      // Log email sent
      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailSent: true, emailSentAt: new Date() },
      });

      await prisma.emailLog.create({
        data: {
          to: notification.user.email,
          subject: notification.title,
          template: 'notification',
          status: 'SENT',
          notificationId: notification.id,
          tenantId: notification.tenantId,
        },
      });
    } catch (error) {
      logger.error('Error sending notification email:', error);

      await prisma.emailLog.create({
        data: {
          to: notification.user.email,
          subject: notification.title,
          template: 'notification',
          status: 'FAILED',
          errorMessage: error.message,
          notificationId: notification.id,
          tenantId: notification.tenantId,
        },
      });
    }
  }

  /**
   * Generate HTML for notification email
   */
  generateEmailHtml(notification) {
    const linkHtml = notification.link
      ? `<p style="text-align: center; margin-top: 20px;">
          <a href="${notification.link}" style="display: inline-block; background: #0066ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
            Voir les details
          </a>
        </p>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066ff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LexDoc</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${linkHtml}
          </div>
          <div class="footer">
            <p>Cet email a ete envoye automatiquement via LexDoc.</p>
            <p><a href="#">Gerer mes preferences de notification</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================================================
  // NOTIFICATION HELPERS FOR SPECIFIC EVENTS
  // ============================================================================

  /**
   * Notify about pending signature
   */
  async notifySignaturePending({ userId, tenantId, documentName, signerName, folderId }) {
    return this.create({
      userId,
      tenantId,
      type: 'SIGNATURE_PENDING',
      title: 'Signature en attente',
      message: `Le document "${documentName}" est en attente de signature par ${signerName}.`,
      entityType: 'Signature',
      link: '/signatures',
    });
  }

  /**
   * Notify about completed signature
   */
  async notifySignatureCompleted({ userId, tenantId, documentName, signerName }) {
    return this.create({
      userId,
      tenantId,
      type: 'SIGNATURE_COMPLETED',
      title: 'Document signe',
      message: `${signerName} a signe le document "${documentName}".`,
      entityType: 'Signature',
      link: '/signatures',
    });
  }

  /**
   * Notify about new document upload
   */
  async notifyDocumentUploaded({ userId, tenantId, documentName, uploaderName, folderId }) {
    return this.create({
      userId,
      tenantId,
      type: 'DOCUMENT_UPLOADED',
      title: 'Nouveau document',
      message: `${uploaderName} a televerse le document "${documentName}".`,
      entityType: 'Document',
      link: folderId ? `/folders/${folderId}` : '/documents',
    });
  }

  /**
   * Notify about document request
   */
  async notifyDocumentRequest({ userId, tenantId, requestTitle, requesterName, folderId }) {
    return this.create({
      userId,
      tenantId,
      type: 'DOCUMENT_REQUEST',
      title: 'Nouvelle demande de document',
      message: `${requesterName} a cree une demande: "${requestTitle}".`,
      entityType: 'DocumentRequest',
      link: '/document-requests',
    });
  }

  /**
   * Notify about deadline approaching
   */
  async notifyDeadlineApproaching({ userId, tenantId, title, dueDate, entityType, entityId, link }) {
    const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return this.create({
      userId,
      tenantId,
      type: 'DEADLINE_APPROACHING',
      title: 'Echeance proche',
      message: `"${title}" arrive a echeance dans ${daysLeft} jour(s).`,
      entityType,
      entityId,
      link,
    });
  }

  /**
   * Notify about new message
   */
  async notifyMessageReceived({ userId, tenantId, senderName, preview, conversationId }) {
    return this.create({
      userId,
      tenantId,
      type: 'MESSAGE_RECEIVED',
      title: `Nouveau message de ${senderName}`,
      message: preview.length > 100 ? preview.substring(0, 100) + '...' : preview,
      entityType: 'Message',
      entityId: conversationId,
      link: `/messages/${conversationId}`,
    });
  }
}

module.exports = new NotificationService();
