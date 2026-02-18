const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const emailService = require('../services/email.service');
const reminderJob = require('../jobs/reminder.job');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// DOCUMENT TRACKING
// ============================================================================

// List all tracked documents
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { status, deliveryMethod, pendingReminders } = req.query;

    const where = {
      document: { tenantId: req.tenant.id },
    };

    if (status) where.status = status;
    if (deliveryMethod) where.deliveryMethod = deliveryMethod;
    if (pendingReminders === 'true') {
      where.autoRemindersEnabled = true;
      where.nextReminderAt = { lte: new Date() };
    }

    const [trackings, total] = await Promise.all([
      prisma.documentTracking.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          document: {
            select: { id: true, name: true, type: true, status: true },
          },
          reminders: {
            orderBy: { sentAt: 'desc' },
            take: 3,
          },
        },
      }),
      prisma.documentTracking.count({ where }),
    ]);

    return paginatedResponse(res, trackings.map((t) => omitSensitiveFields(t)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get tracking by document ID
router.get('/document/:documentId', async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, tenantId: req.tenant.id },
    });

    if (!document) throw new NotFoundError('Document not found');

    let tracking = await prisma.documentTracking.findUnique({
      where: { documentId: req.params.documentId },
      include: {
        document: { select: { id: true, name: true, type: true, status: true } },
        reminders: { orderBy: { sentAt: 'desc' } },
      },
    });

    if (!tracking) {
      // Create tracking if it doesn't exist
      tracking = await prisma.documentTracking.create({
        data: { documentId: req.params.documentId },
        include: {
          document: { select: { id: true, name: true, type: true, status: true } },
          reminders: true,
        },
      });
    }

    return successResponse(res, omitSensitiveFields(tracking));
  } catch (error) {
    next(error);
  }
});

// Update tracking status
router.put('/document/:documentId', async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, tenantId: req.tenant.id },
    });

    if (!document) throw new NotFoundError('Document not found');

    const {
      status,
      deliveryMethod,
      signatureRequestId,
      signatureStatus,
      signedAt,
      signedBy,
      lrarTrackingNumber,
      lrarStatus,
      sentAt,
      deliveredAt,
      autoRemindersEnabled,
      nextReminderAt,
    } = req.body;

    const tracking = await prisma.documentTracking.upsert({
      where: { documentId: req.params.documentId },
      update: {
        status,
        deliveryMethod,
        signatureRequestId,
        signatureStatus,
        signedAt,
        signedBy,
        lrarTrackingNumber,
        lrarStatus,
        sentAt,
        deliveredAt,
        autoRemindersEnabled,
        nextReminderAt,
      },
      create: {
        documentId: req.params.documentId,
        status,
        deliveryMethod,
        signatureRequestId,
        signatureStatus,
        signedAt,
        signedBy,
        lrarTrackingNumber,
        lrarStatus,
        sentAt,
        deliveredAt,
        autoRemindersEnabled,
        nextReminderAt,
      },
      include: {
        document: { select: { id: true, name: true, type: true, status: true } },
        reminders: { orderBy: { sentAt: 'desc' } },
      },
    });

    return successResponse(res, omitSensitiveFields(tracking), 'Tracking updated');
  } catch (error) {
    next(error);
  }
});

// Enable/disable auto reminders
router.post('/document/:documentId/reminders', async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, tenantId: req.tenant.id },
    });

    if (!document) throw new NotFoundError('Document not found');

    const { enabled, nextReminderAt } = req.body;

    // Calculate next reminder date if enabling and not provided
    let reminderDate = nextReminderAt;
    if (enabled && !reminderDate) {
      reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 1); // Default: 1 day from now
    }

    const tracking = await prisma.documentTracking.upsert({
      where: { documentId: req.params.documentId },
      update: {
        autoRemindersEnabled: enabled,
        nextReminderAt: enabled ? reminderDate : null,
      },
      create: {
        documentId: req.params.documentId,
        autoRemindersEnabled: enabled,
        nextReminderAt: enabled ? reminderDate : null,
      },
    });

    return successResponse(
      res,
      omitSensitiveFields(tracking),
      enabled ? 'Auto reminders enabled' : 'Auto reminders disabled'
    );
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// REMINDER LOGS
// ============================================================================

// Get reminder history for a document
router.get('/document/:documentId/reminders', async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, tenantId: req.tenant.id },
    });

    if (!document) throw new NotFoundError('Document not found');

    const tracking = await prisma.documentTracking.findUnique({
      where: { documentId: req.params.documentId },
    });

    if (!tracking) {
      return successResponse(res, []);
    }

    const reminders = await prisma.reminderLog.findMany({
      where: { trackingId: tracking.id },
      orderBy: { sentAt: 'desc' },
    });

    return successResponse(res, reminders.map((r) => omitSensitiveFields(r)));
  } catch (error) {
    next(error);
  }
});

// Manually trigger a reminder
router.post('/document/:documentId/remind', async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, tenantId: req.tenant.id },
      include: {
        folder: { include: { client: true } },
        tenant: true,
        signatures: { where: { status: 'PENDING' } },
      },
    });

    if (!document) throw new NotFoundError('Document not found');

    // Get or create tracking
    let tracking = await prisma.documentTracking.findUnique({
      where: { documentId: req.params.documentId },
    });

    if (!tracking) {
      tracking = await prisma.documentTracking.create({
        data: { documentId: req.params.documentId },
      });
    }

    // Determine recipient and reminder details
    const client = document.folder?.client;
    const pendingSignature = document.signatures[0];
    const recipientEmail = pendingSignature?.signerEmail || client?.email;
    const recipientName = pendingSignature?.signerName ||
      client?.companyName ||
      (client ? `${client.firstName} ${client.lastName}` : 'Client');

    if (!recipientEmail) {
      throw new NotFoundError('No recipient email found for this document');
    }

    // Determine reminder number (1-based)
    const reminderNumber = Math.min(tracking.reminderCount + 1, 3);

    // Reminder type for logging
    const reminderTypes = ['FIRST_REMINDER', 'SECOND_REMINDER', 'THIRD_REMINDER', 'FINAL_NOTICE'];
    const reminderType = reminderTypes[Math.min(tracking.reminderCount, 3)];

    // Progressive subjects
    const subjects = {
      1: `Rappel : Document "${document.name}" en attente de signature`,
      2: `2e rappel : Document "${document.name}" - Action requise`,
      3: `URGENT - Dernier rappel : Document "${document.name}"`,
    };
    const emailSubject = subjects[reminderNumber];

    // Send email
    let emailSent = false;
    try {
      await emailService.sendTrackingReminder({
        recipientEmail,
        recipientName,
        documentName: document.name,
        folderName: document.folder?.title,
        signatureUrl: pendingSignature?.signatureUrl ||
          `${process.env.CLIENT_EXTRANET_URL || process.env.FRONTEND_URL}/documents/${document.id}`,
        reminderNumber,
        tenantName: document.tenant?.name || 'Votre cabinet',
      });
      emailSent = true;
    } catch (emailError) {
      // Continue even if email fails - we still log the attempt
      console.error('Failed to send reminder email:', emailError.message);
    }

    // Create reminder log
    const reminder = await prisma.reminderLog.create({
      data: {
        trackingId: tracking.id,
        type: reminderType,
        sentTo: recipientEmail,
        emailSubject,
        status: emailSent ? 'SENT' : 'FAILED',
      },
    });

    // Update tracking
    await prisma.documentTracking.update({
      where: { id: tracking.id },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_REMINDER_SENT',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          reminderType,
          sentTo: recipientEmail,
          emailSent,
        },
      },
    });

    return successResponse(res, omitSensitiveFields(reminder), emailSent ? 'Reminder sent' : 'Reminder logged but email failed');
  } catch (error) {
    next(error);
  }
});

// Get statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalTracked,
      pendingSignature,
      signed,
      pendingDelivery,
      delivered,
      pendingReminders,
    ] = await Promise.all([
      prisma.documentTracking.count({
        where: { document: { tenantId: req.tenant.id } },
      }),
      prisma.documentTracking.count({
        where: { document: { tenantId: req.tenant.id }, status: 'PENDING_SIGNATURE' },
      }),
      prisma.documentTracking.count({
        where: { document: { tenantId: req.tenant.id }, status: 'SIGNED' },
      }),
      prisma.documentTracking.count({
        where: { document: { tenantId: req.tenant.id }, status: 'PENDING_DELIVERY' },
      }),
      prisma.documentTracking.count({
        where: { document: { tenantId: req.tenant.id }, status: 'DELIVERED' },
      }),
      prisma.documentTracking.count({
        where: {
          document: { tenantId: req.tenant.id },
          autoRemindersEnabled: true,
          nextReminderAt: { lte: new Date() },
        },
      }),
    ]);

    return successResponse(res, {
      totalTracked,
      pendingSignature,
      signed,
      pendingDelivery,
      delivered,
      pendingReminders,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ADMIN - REMINDER JOB MANAGEMENT
// ============================================================================

/**
 * Run reminder job manually (admin only)
 * POST /api/tracking/reminders/run
 */
router.post('/reminders/run', async (req, res, next) => {
  try {
    // Only allow admins to run the job manually
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Admin access required' },
      });
    }

    const result = await reminderJob.run();

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'REMINDER_JOB_RUN_MANUAL',
        entityType: 'System',
        entityId: 'reminder-job',
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: result,
      },
    });

    return successResponse(res, result, 'Reminder job completed');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
