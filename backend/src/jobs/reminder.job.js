const cron = require('node-cron');
const prisma = require('../config/database');
const logger = require('../config/logger');
const emailService = require('../services/email.service');

class ReminderJob {
  start() {
    // Exécution quotidienne à 10h
    cron.schedule('0 10 * * *', async () => {
      await this.run();
    });
    logger.info('Reminder job scheduled for 10:00 daily');
  }

  /**
   * Run reminder job manually (can be called from API for testing)
   */
  async run() {
    logger.info('🔔 Reminder job started');
    const startTime = Date.now();
    let signatureCount = 0;
    let trackingCount = 0;

    try {
      signatureCount = await this.sendSignatureReminders();
      trackingCount = await this.sendTrackingReminders();

      const duration = Date.now() - startTime;
      logger.info(`✅ Reminder job completed in ${duration}ms`, {
        signatureReminders: signatureCount,
        trackingReminders: trackingCount,
      });

      return {
        success: true,
        signatureReminders: signatureCount,
        trackingReminders: trackingCount,
        duration,
      };
    } catch (error) {
      logger.error('Reminder job failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Original signature-based reminders (returns count of reminders sent)
  async sendSignatureReminders() {
    let remindersSent = 0;
    const pendingSignatures = await prisma.signature.findMany({
      where: {
        status: 'PENDING',
        signedAt: null,
      },
      include: {
        document: { include: { folder: { include: { client: true } }, tenant: true } },
        reminders: { orderBy: { sentAt: 'desc' } },
      },
    });

    for (const signature of pendingSignatures) {
      try {
        const lastReminder = signature.reminders[0];
        const daysSinceLastReminder = lastReminder
          ? Math.floor((Date.now() - lastReminder.sentAt.getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - signature.invitedAt.getTime()) / (1000 * 60 * 60 * 24));

        const reminderCount = signature.reminders.length;
        const settings = await prisma.tenantSettings.findUnique({
          where: { tenantId: signature.document.tenantId },
        });

        if (!settings) continue;

        const schedule = settings.reminderSchedule.split(',').map(Number);

        if (schedule.includes(daysSinceLastReminder) && reminderCount < settings.maxReminders) {
          await this.sendReminderEmail(signature);
          await prisma.signatureReminder.create({
            data: {
              signatureId: signature.id,
              reminderNumber: reminderCount + 1,
            },
          });
          remindersSent++;
          logger.info(`Signature reminder sent for ${signature.id}`);
        }
      } catch (error) {
        logger.error(`Failed to send reminder for signature ${signature.id}`, { error: error.message });
      }
    }
    return remindersSent;
  }

  // New DocumentTracking-based reminders with progressive emails (returns count)
  async sendTrackingReminders() {
    let remindersSent = 0;
    const now = new Date();

    // Find documents needing reminders:
    // 1. Auto reminders enabled
    // 2. Either nextReminderAt is past OR (first reminder and created > 24h ago)
    const pendingTrackings = await prisma.documentTracking.findMany({
      where: {
        autoRemindersEnabled: true,
        status: { in: ['PENDING_SIGNATURE', 'PENDING_DELIVERY'] },
        OR: [
          { nextReminderAt: { lte: now } },
          {
            AND: [
              { reminderCount: 0 },
              { createdAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
            ],
          },
        ],
      },
      include: {
        document: {
          include: {
            folder: { include: { client: true } },
            tenant: true,
            signatures: { where: { status: 'PENDING' } },
          },
        },
        reminders: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    });

    logger.info(`Found ${pendingTrackings.length} documents needing reminders`);

    for (const tracking of pendingTrackings) {
      try {
        if (tracking.reminderCount >= 3) {
          // Max reminders reached, disable auto reminders
          await prisma.documentTracking.update({
            where: { id: tracking.id },
            data: { autoRemindersEnabled: false },
          });
          logger.info(`Max reminders reached for document ${tracking.documentId}, disabling auto reminders`);
          continue;
        }

        const document = tracking.document;
        const client = document.folder?.client;
        const pendingSignature = document.signatures[0];
        const recipientEmail = pendingSignature?.signerEmail || client?.email;
        const recipientName = pendingSignature?.signerName ||
          client?.companyName ||
          (client ? `${client.firstName} ${client.lastName}` : 'Client');

        if (!recipientEmail) {
          logger.warn(`No recipient email for document ${document.id}, skipping reminder`);
          continue;
        }

        // Reminder number (1-based for display)
        const reminderNumber = tracking.reminderCount + 1;

        // Determine reminder type for logging
        const reminderTypes = ['FIRST_REMINDER', 'SECOND_REMINDER', 'THIRD_REMINDER', 'FINAL_NOTICE'];
        const reminderType = reminderTypes[Math.min(tracking.reminderCount, 3)];

        // Progressive subjects
        const subjects = {
          1: `Rappel : Document "${document.name}" en attente de signature`,
          2: `2e rappel : Document "${document.name}" - Action requise`,
          3: `URGENT - Dernier rappel : Document "${document.name}"`,
        };
        const emailSubject = subjects[Math.min(reminderNumber, 3)];

        // Send email first
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
          logger.info(`Reminder email sent to ${recipientEmail} for document ${document.id}`);
        } catch (emailError) {
          logger.error('Failed to send tracking reminder email', {
            documentId: document.id,
            error: emailError.message,
          });
        }

        // Create reminder log
        await prisma.reminderLog.create({
          data: {
            trackingId: tracking.id,
            type: reminderType,
            sentTo: recipientEmail,
            emailSubject,
            status: emailSent ? 'SENT' : 'FAILED',
          },
        });

        // Calculate next reminder date based on schedule (J+1, J+3, J+5 = intervals of 2 days)
        const nextReminder = new Date();
        nextReminder.setDate(nextReminder.getDate() + 2);

        // Update tracking
        await prisma.documentTracking.update({
          where: { id: tracking.id },
          data: {
            reminderCount: { increment: 1 },
            lastReminderAt: now,
            nextReminderAt: tracking.reminderCount < 2 ? nextReminder : null,
          },
        });

        logger.info(`Tracking reminder ${reminderNumber} processed for document ${document.id}`, {
          reminderType,
          emailSent,
          nextReminderAt: tracking.reminderCount < 2 ? nextReminder : null,
        });

        if (emailSent) remindersSent++;
      } catch (error) {
        logger.error(`Failed to process tracking reminder ${tracking.id}`, { error: error.message });
      }
    }

    return remindersSent;
  }

  async sendReminderEmail(signature) {
    try {
      await emailService.sendSignatureReminder(
        signature,
        signature.document,
        signature.reminders.length + 1
      );
      logger.info(`Reminder email sent to ${signature.signerEmail}`);
    } catch (error) {
      logger.error(`Failed to send reminder email to ${signature.signerEmail}`, { error: error.message });
    }
  }
}

module.exports = new ReminderJob();
