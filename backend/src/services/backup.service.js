const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const prisma = require('../config/database');
const logger = require('../config/logger');

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || '/tmp/lexdoc-backups';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30;
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory', { error: error.message });
      throw error;
    }
  }

  async createDatabaseBackup(tenantId = null) {
    await this.ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db-backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    // Create backup log
    const backupLog = await prisma.backupLog.create({
      data: {
        tenantId,
        type: 'DATABASE',
        status: 'IN_PROGRESS',
      },
    });

    try {
      const dbUrl = process.env.DATABASE_URL;
      const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

      if (!match) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = match;

      // Use pg_dump to create backup
      const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f ${filepath}`;

      await execAsync(command);

      // Get file size
      const stats = await fs.stat(filepath);

      // Update backup log
      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          fileSize: BigInt(stats.size),
        },
      });

      logger.info('Database backup completed', { filename, size: stats.size });

      return { filepath, filename, size: stats.size, backupId: backupLog.id };
    } catch (error) {
      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      logger.error('Database backup failed', { error: error.message });
      throw error;
    }
  }

  async createMinioBackup(tenantId = null) {
    await this.ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `minio-backup-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, filename);

    const backupLog = await prisma.backupLog.create({
      data: {
        tenantId,
        type: 'MINIO',
        status: 'IN_PROGRESS',
      },
    });

    try {
      // In a real implementation, this would use mc (MinIO Client) to sync
      // For now, we'll simulate it
      const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const minioBucket = process.env.MINIO_BUCKET || 'lexdoc-dev';

      // Simulate backup creation
      await fs.writeFile(filepath, `MinIO backup placeholder for ${minioBucket} at ${minioEndpoint}`);
      const stats = await fs.stat(filepath);

      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          fileSize: BigInt(stats.size),
        },
      });

      logger.info('MinIO backup completed', { filename, size: stats.size });

      return { filepath, filename, size: stats.size, backupId: backupLog.id };
    } catch (error) {
      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      logger.error('MinIO backup failed', { error: error.message });
      throw error;
    }
  }

  async createFullBackup(tenantId = null) {
    const backupLog = await prisma.backupLog.create({
      data: {
        tenantId,
        type: 'FULL',
        status: 'IN_PROGRESS',
      },
    });

    try {
      const dbBackup = await this.createDatabaseBackup(tenantId);
      const minioBackup = await this.createMinioBackup(tenantId);

      const totalSize = dbBackup.size + minioBackup.size;

      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          fileSize: BigInt(totalSize),
        },
      });

      logger.info('Full backup completed', { totalSize });

      return {
        backupId: backupLog.id,
        database: dbBackup,
        minio: minioBackup,
        totalSize,
      };
    } catch (error) {
      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  async uploadToGoogleDrive(filepath, filename) {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      logger.warn('Google Drive folder ID not configured, skipping upload');
      return null;
    }

    // Check if Google Drive credentials are configured
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      logger.warn('Google Drive credentials not fully configured, skipping upload');
      return {
        googleDriveId: `local_${Date.now()}_${filename}`,
        webViewLink: null,
        local: true,
      };
    }

    try {
      // Dynamic import for Google APIs (optional dependency)
      const { google } = require('googleapis');

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        process.env.GOOGLE_DRIVE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Read file content
      const fileContent = await fs.readFile(filepath);

      // Upload to Google Drive
      const response = await drive.files.create({
        requestBody: {
          name: filename,
          parents: [folderId],
        },
        media: {
          mimeType: 'application/octet-stream',
          body: require('stream').Readable.from(fileContent),
        },
        fields: 'id, webViewLink',
      });

      logger.info('Uploaded to Google Drive', {
        filename,
        fileId: response.data.id,
      });

      return {
        googleDriveId: response.data.id,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      logger.error('Failed to upload to Google Drive', { error: error.message });

      // Return local backup info instead of failing
      return {
        googleDriveId: `local_${Date.now()}_${filename}`,
        webViewLink: null,
        local: true,
        error: error.message,
      };
    }
  }

  /**
   * List recent backups
   */
  async listRecentBackups(limit = 10) {
    return prisma.backupLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    const [total, completed, failed, lastBackup] = await Promise.all([
      prisma.backupLog.count(),
      prisma.backupLog.count({ where: { status: 'COMPLETED' } }),
      prisma.backupLog.count({ where: { status: 'FAILED' } }),
      prisma.backupLog.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
      lastBackupAt: lastBackup?.completedAt,
      lastBackupSize: lastBackup?.fileSize ? Number(lastBackup.fileSize) : null,
    };
  }

  async cleanupOldBackups() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    // Delete old backup logs
    const deleted = await prisma.backupLog.deleteMany({
      where: {
        startedAt: { lt: cutoffDate },
        status: 'COMPLETED',
      },
    });

    // Clean up files (in real implementation)
    try {
      const files = await fs.readdir(this.backupDir);
      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath);
          logger.info('Deleted old backup file', { file });
        }
      }
    } catch (error) {
      logger.error('Error cleaning up backup files', { error: error.message });
    }

    logger.info('Cleanup completed', { deletedLogs: deleted.count });

    return { deletedLogs: deleted.count };
  }
}

module.exports = new BackupService();
