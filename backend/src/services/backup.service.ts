import { google } from 'googleapis';
import { PrismaClient, BackupStatus } from '@prisma/client';
import { minioService } from './minio.service';
import { logger } from '../utils/logger';
import archiver from 'archiver';
import { Readable, PassThrough } from 'stream';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface BackupResult {
  backupId: string;
  status: BackupStatus;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface BackupOptions {
  includeDatabaseDump?: boolean;
  includeDocuments?: boolean;
  includeTemplates?: boolean;
  cabinetId?: string;
}

class BackupService {
  private drive: any = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const {
      GOOGLE_DRIVE_CLIENT_ID,
      GOOGLE_DRIVE_CLIENT_SECRET,
      GOOGLE_DRIVE_REFRESH_TOKEN,
      GOOGLE_DRIVE_FOLDER_ID,
    } = process.env;

    if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET || !GOOGLE_DRIVE_REFRESH_TOKEN) {
      logger.warn('Google Drive configuration incomplete. Backup service will be disabled.');
      return;
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_DRIVE_CLIENT_ID,
        GOOGLE_DRIVE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
      });

      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      this.isConfigured = true;
      logger.info('Google Drive backup service initialized');
    } catch (error) {
      logger.error('Failed to initialize Google Drive:', error);
    }
  }

  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const backupId = uuidv4();
    const startTime = Date.now();

    // Create backup log entry
    await prisma.backupLog.create({
      data: {
        backupId,
        status: 'IN_PROGRESS',
        provider: 'GOOGLE_DRIVE',
      },
    });

    try {
      const metadata: Record<string, any> = {
        timestamp: new Date().toISOString(),
        options,
      };

      // Create archive stream
      const archive = archiver('zip', { zlib: { level: 9 } });
      const passThrough = new PassThrough();
      archive.pipe(passThrough);

      // Add documents from MinIO
      if (options.includeDocuments !== false) {
        const documents = await minioService.listFiles(undefined, 'documents');
        metadata.documentCount = documents.length;

        for (const doc of documents) {
          if (doc.name) {
            try {
              const buffer = await minioService.downloadFileAsBuffer(doc.name, 'documents');
              archive.append(buffer, { name: `documents/${doc.name}` });
            } catch (error) {
              logger.warn(`Failed to include document in backup: ${doc.name}`);
            }
          }
        }
      }

      // Add templates from MinIO
      if (options.includeTemplates !== false) {
        const templates = await minioService.listFiles(undefined, 'templates');
        metadata.templateCount = templates.length;

        for (const template of templates) {
          if (template.name) {
            try {
              const buffer = await minioService.downloadFileAsBuffer(template.name, 'templates');
              archive.append(buffer, { name: `templates/${template.name}` });
            } catch (error) {
              logger.warn(`Failed to include template in backup: ${template.name}`);
            }
          }
        }
      }

      // Add metadata file
      archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

      archive.finalize();

      // Upload to Google Drive
      if (this.isConfigured && this.drive) {
        const fileName = `lexdoc-backup-${backupId}-${new Date().toISOString().split('T')[0]}.zip`;

        await this.drive.files.create({
          requestBody: {
            name: fileName,
            parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : [],
          },
          media: {
            mimeType: 'application/zip',
            body: passThrough,
          },
        });

        logger.info(`Backup uploaded to Google Drive: ${fileName}`);
      } else {
        // Store locally in MinIO backups bucket
        const chunks: Buffer[] = [];
        for await (const chunk of passThrough) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        await minioService.uploadFile(
          `backup-${backupId}.zip`,
          buffer,
          { bucket: 'backups', contentType: 'application/zip' }
        );
        logger.info(`Backup stored locally: backup-${backupId}.zip`);
      }

      const duration = (Date.now() - startTime) / 1000;

      // Update backup log
      await prisma.backupLog.update({
        where: { backupId },
        data: {
          status: 'SUCCESS',
          duration,
          completedAt: new Date(),
          metadata,
        },
      });

      return {
        backupId,
        status: 'SUCCESS',
        duration,
        metadata,
      };
    } catch (error: any) {
      const duration = (Date.now() - startTime) / 1000;

      // Update backup log with error
      await prisma.backupLog.update({
        where: { backupId },
        data: {
          status: 'FAILED',
          duration,
          completedAt: new Date(),
          error: error.message,
        },
      });

      logger.error('Backup failed:', error);

      return {
        backupId,
        status: 'FAILED',
        duration,
        error: error.message,
      };
    }
  }

  async getBackupHistory(limit = 20): Promise<any[]> {
    return prisma.backupLog.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
    });
  }

  async getBackupById(backupId: string): Promise<any | null> {
    return prisma.backupLog.findUnique({
      where: { backupId },
    });
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }
}

export const backupService = new BackupService();
export default backupService;
