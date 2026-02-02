import cron from 'node-cron';
import { PrismaClient, ReminderFrequency } from '@prisma/client';
import { emailService } from '../services/email.service';
import { pushNotificationService } from '../services/push-notification.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Map frequency to hours
const frequencyToHours: Record<ReminderFrequency, number> = {
  DAILY: 24,
  EVERY_2_DAYS: 48,
  EVERY_3_DAYS: 72,
  WEEKLY: 168,
};

export async function processSignatureReminders(): Promise<void> {
  logger.info('[SignatureReminders] Starting reminder job...');

  try {
    // Find documents that need reminders
    const now = new Date();
    const trackings = await prisma.documentTracking.findMany({
      where: {
        autoRemindersEnabled: true,
        status: {
          in: ['PENDING_SIGNATURE', 'PARTIALLY_SIGNED'],
        },
        nextReminderAt: {
          lte: now,
        },
        reminderCount: {
          lt: prisma.documentTracking.fields.maxReminders,
        },
      },
      include: {
        document: {
          include: {
            cabinet: true,
            folder: {
              include: {
                clientAccesses: {
                  where: { isActivated: true },
                },
              },
            },
          },
        },
      },
    });

    logger.info(`[SignatureReminders] Found ${trackings.length} documents needing reminders`);

    for (const tracking of trackings) {
      try {
        const recipients = tracking.recipients as Array<{
          name: string;
          email: string;
          status: string;
          signedAt?: string;
        }>;

        // Filter recipients who haven't signed yet
        const pendingRecipients = recipients.filter((r) => r.status !== 'signed');

        for (const recipient of pendingRecipients) {
          const reminderNumber = tracking.reminderCount + 1;

          // Send email reminder
          await emailService.sendSignatureReminder(recipient.email, {
            recipientName: recipient.name,
            documentTitle: tracking.document.title,
            cabinetName: tracking.document.cabinet.name,
            signUrl: `${process.env.CLIENT_EXTRANET_URL}/extranet/documents/${tracking.document.id}`,
            reminderNumber,
            expiresAt: tracking.expiresAt?.toLocaleDateString('fr-FR') || 'Non defini',
          });

          // Send push notification to client if they have access
          const clientAccess = tracking.document.folder?.clientAccesses?.[0];
          if (clientAccess) {
            await pushNotificationService.notifySignatureReminder(
              clientAccess.id,
              tracking.document.title,
              tracking.document.id,
              reminderNumber
            );
          }

          // Log the reminder
          await prisma.reminderLog.create({
            data: {
              trackingId: tracking.id,
              reminderNumber,
              sentTo: recipient.email,
              emailSubject: `Rappel #${reminderNumber}: Document en attente de signature - ${tracking.document.title}`,
              emailBody: `Rappel automatique envoye pour le document "${tracking.document.title}"`,
            },
          });

          logger.info(
            `[SignatureReminders] Sent reminder #${reminderNumber} to ${recipient.email} for document ${tracking.document.id}`
          );
        }

        // Calculate next reminder date
        const frequencyHours = frequencyToHours[tracking.reminderFrequency];
        const nextReminderAt = new Date(now.getTime() + frequencyHours * 60 * 60 * 1000);

        // Update tracking
        await prisma.documentTracking.update({
          where: { id: tracking.id },
          data: {
            reminderCount: { increment: 1 },
            lastReminderAt: now,
            nextReminderAt:
              tracking.reminderCount + 1 >= tracking.maxReminders ? null : nextReminderAt,
          },
        });
      } catch (error) {
        logger.error(
          `[SignatureReminders] Failed to process tracking ${tracking.id}:`,
          error
        );
      }
    }

    logger.info('[SignatureReminders] Job completed');
  } catch (error) {
    logger.error('[SignatureReminders] Job failed:', error);
  }
}

export function startSignatureRemindersJob(): void {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    await processSignatureReminders();
  });

  logger.info('[SignatureReminders] Cron job scheduled (hourly)');
}

export default { processSignatureReminders, startSignatureRemindersJob };
