import cron from 'node-cron';
import { rgpdService } from '@/modules/rgpd';
import { logger } from '@/utils/logger';

/**
 * RGPD Data Retention CRON Job
 *
 * Runs daily at 3:00 AM to:
 * 1. Check for entities due for anonymization based on retention policies
 * 2. Automatically anonymize expired data
 * 3. Send warnings for data approaching retention deadline
 */

// Run every day at 3:00 AM
const SCHEDULE = '0 3 * * *';

export function initRgpdRetentionCron() {
  logger.info('[RGPD CRON] Initializing RGPD data retention cron job');

  cron.schedule(SCHEDULE, async () => {
    logger.info('[RGPD CRON] Starting automatic data retention check...');

    try {
      const results = await rgpdService.processAutomaticAnonymization();

      const anonymized = results.filter(r => r.status === 'anonymized').length;
      const errors = results.filter(r => r.status === 'error').length;

      logger.info(`[RGPD CRON] Completed: ${anonymized} entities anonymized, ${errors} errors`);

      if (errors > 0) {
        logger.warn('[RGPD CRON] Some entities failed to anonymize', {
          errors: results.filter(r => r.status === 'error'),
        });
      }
    } catch (error) {
      logger.error('[RGPD CRON] Failed to process automatic anonymization', { error });
    }
  });

  logger.info(`[RGPD CRON] Scheduled to run at: ${SCHEDULE}`);
}

/**
 * Manual trigger for testing or immediate processing
 */
export async function runRgpdRetentionNow() {
  logger.info('[RGPD CRON] Manual trigger: Starting data retention check...');

  try {
    const results = await rgpdService.processAutomaticAnonymization();
    logger.info('[RGPD CRON] Manual trigger completed', { results });
    return results;
  } catch (error) {
    logger.error('[RGPD CRON] Manual trigger failed', { error });
    throw error;
  }
}
