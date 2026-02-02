import { initRgpdRetentionCron } from './rgpd-retention.cron';
import { initializeBackupScheduler } from './backup.cron';
import { logger } from '@/utils/logger';

/**
 * Initialize all CRON jobs
 */
export function initCronJobs() {
  logger.info('[CRON] Initializing cron jobs...');

  // RGPD data retention job
  initRgpdRetentionCron();

  // Automatic backup job
  initializeBackupScheduler();

  logger.info('[CRON] All cron jobs initialized');
}

export { runRgpdRetentionNow } from './rgpd-retention.cron';
export { initializeBackupScheduler } from './backup.cron';
