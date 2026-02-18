const cron = require('node-cron');
const logger = require('../config/logger');
const backupService = require('../services/backup.service');

class BackupJob {
  start() {
    // Daily backup at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
      logger.info('Backup job started');
      try {
        await this.runDailyBackup();
      } catch (error) {
        logger.error('Backup job failed', { error: error.message });
      }
    });

    // Cleanup old backups every Sunday at 4:00 AM
    cron.schedule('0 4 * * 0', async () => {
      logger.info('Backup cleanup job started');
      try {
        await backupService.cleanupOldBackups();
      } catch (error) {
        logger.error('Backup cleanup job failed', { error: error.message });
      }
    });

    logger.info('Backup job scheduled: daily at 3:00 AM, cleanup Sundays at 4:00 AM');
  }

  async runDailyBackup() {
    logger.info('Starting daily backup...');

    try {
      // Create full backup
      const result = await backupService.createFullBackup();

      // Upload to Google Drive if configured
      if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
        const { googleDriveId } = await backupService.uploadToGoogleDrive(
          result.database.filepath,
          result.database.filename
        );

        logger.info('Backup uploaded to Google Drive', { googleDriveId });
      }

      logger.info('Daily backup completed successfully', {
        backupId: result.backupId,
        totalSize: result.totalSize,
      });

      return result;
    } catch (error) {
      logger.error('Daily backup failed', { error: error.message });
      throw error;
    }
  }

  // Manual trigger method
  async triggerBackup(type = 'FULL') {
    logger.info(`Manual backup triggered: ${type}`);

    switch (type) {
      case 'DATABASE':
        return backupService.createDatabaseBackup();
      case 'MINIO':
        return backupService.createMinioBackup();
      case 'FULL':
      default:
        return backupService.createFullBackup();
    }
  }
}

module.exports = new BackupJob();
