import cron from 'node-cron';
import { backupService } from '@/modules/backups';
import { config } from '@/config';
import { logger } from '@/utils/logger';

/**
 * Initialize scheduled backup job
 * Runs daily at configured time (default: 3:00 AM)
 */
export function initializeBackupScheduler(): void {
  const schedule = config.backup?.scheduleCron || '0 3 * * *';

  // Validate cron expression
  if (!cron.validate(schedule)) {
    logger.error(`[BACKUP SCHEDULER] Invalid cron expression: ${schedule}`);
    return;
  }

  // Check if backup is configured
  if (!backupService.isConfigured()) {
    logger.warn('[BACKUP SCHEDULER] Backup not configured - scheduler disabled');
    logger.warn('[BACKUP SCHEDULER] Set GOOGLE_DRIVE_CREDENTIALS_PATH, GOOGLE_DRIVE_BACKUP_FOLDER_ID, and BACKUP_ENCRYPTION_KEY');
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info('[BACKUP SCHEDULER] Starting scheduled backup...');

    try {
      const result = await backupService.performFullBackup();

      if (result.success) {
        logger.info(`[BACKUP SCHEDULER] Backup ${result.backupId} completed successfully in ${result.duration}s`);
      } else {
        logger.error(`[BACKUP SCHEDULER] Backup failed: ${result.error}`);
        // TODO: Send alert email to admin
      }
    } catch (error) {
      logger.error('[BACKUP SCHEDULER] Unexpected error during backup:', error);
      // TODO: Send alert email to admin
    }
  });

  logger.info(`[BACKUP SCHEDULER] Initialized with schedule: ${schedule}`);
  logger.info('[BACKUP SCHEDULER] Next backup will run according to schedule');
}
