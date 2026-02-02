import { initRgpdRetentionCron } from './rgpd-retention.cron';
import { logger } from '@/utils/logger';

/**
 * Initialize all CRON jobs
 */
export function initCronJobs() {
  logger.info('[CRON] Initializing cron jobs...');

  // RGPD data retention job
  initRgpdRetentionCron();

  logger.info('[CRON] All cron jobs initialized');
}

export { runRgpdRetentionNow } from './rgpd-retention.cron';
