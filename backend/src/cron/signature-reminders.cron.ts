import cron from 'node-cron';
import { documentTrackingService } from '@/modules/document-tracking/document-tracking.service';
import { logger } from '@/utils/logger';

/**
 * Signature Reminders CRON Job
 *
 * Runs every hour to:
 * 1. Check for documents pending signatures that need reminders
 * 2. Send automatic reminders based on configured frequency
 * 3. Respect maximum reminder limits
 */

// Run every hour at minute 0
const SCHEDULE = '0 * * * *';

export function initSignatureRemindersCron() {
  logger.info('[SIGNATURE REMINDERS CRON] Initializing signature reminders cron job');

  cron.schedule(SCHEDULE, async () => {
    logger.info('[SIGNATURE REMINDERS CRON] Starting automatic reminder check...');

    try {
      // Get all documents pending reminders
      const pendingDocuments = await documentTrackingService.getDocumentsPendingReminders();

      logger.info(`[SIGNATURE REMINDERS CRON] Found ${pendingDocuments.length} documents pending reminders`);

      let sent = 0;
      let errors = 0;

      for (const tracking of pendingDocuments) {
        try {
          await documentTrackingService.processReminder(tracking.id);
          sent++;
          logger.info(`[SIGNATURE REMINDERS CRON] Sent reminder for document ${tracking.documentId}`);
        } catch (error) {
          errors++;
          logger.error(`[SIGNATURE REMINDERS CRON] Failed to send reminder for document ${tracking.documentId}`, { error });
        }
      }

      logger.info(`[SIGNATURE REMINDERS CRON] Completed: ${sent} reminders sent, ${errors} errors`);
    } catch (error) {
      logger.error('[SIGNATURE REMINDERS CRON] Failed to process reminders', { error });
    }
  });

  logger.info(`[SIGNATURE REMINDERS CRON] Scheduled to run at: ${SCHEDULE}`);
}

/**
 * Manual trigger for testing or immediate processing
 */
export async function runSignatureRemindersNow() {
  logger.info('[SIGNATURE REMINDERS CRON] Manual trigger: Starting reminder check...');

  try {
    const pendingDocuments = await documentTrackingService.getDocumentsPendingReminders();

    let sent = 0;
    let errors = 0;

    for (const tracking of pendingDocuments) {
      try {
        await documentTrackingService.processReminder(tracking.id);
        sent++;
      } catch (error) {
        errors++;
        logger.error(`[SIGNATURE REMINDERS CRON] Manual trigger: Failed for ${tracking.documentId}`, { error });
      }
    }

    logger.info('[SIGNATURE REMINDERS CRON] Manual trigger completed', { sent, errors });
    return { sent, errors, total: pendingDocuments.length };
  } catch (error) {
    logger.error('[SIGNATURE REMINDERS CRON] Manual trigger failed', { error });
    throw error;
  }
}
