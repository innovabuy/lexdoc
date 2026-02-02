import { google } from 'googleapis';
import { drive_v3 } from 'googleapis';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import archiver from 'archiver';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { BackupStatus } from '@prisma/client';

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  backupId: string;
  duration?: string;
  error?: string;
}

interface BackupMetadata {
  backupId: string;
  timestamp: string;
  lexdocVersion: string;
  database: {
    engine: string;
    size: number;
    encrypted: boolean;
  };
  files: {
    minio: { size: number; encrypted: boolean };
    uploads: { size: number; encrypted: boolean };
  };
  encryption: {
    algorithm: string;
    keyDerivation: string;
  };
  retention: {
    days: number;
    deleteAfter: string;
  };
  totalSize: number;
}

class BackupService {
  private drive: drive_v3.Drive | null = null;
  private backupFolderId: string;
  private encryptionKey: string;
  private isInitialized = false;

  constructor() {
    this.backupFolderId = config.backup?.googleDriveFolderId || '';
    this.encryptionKey = config.backup?.encryptionKey || '';
  }

  /**
   * Initialize Google Drive client
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    const credentialsPath = config.backup?.googleDriveCredentialsPath;

    if (!credentialsPath || !fs.existsSync(credentialsPath)) {
      logger.warn('[BACKUP] Google Drive credentials not configured');
      return false;
    }

    if (!this.backupFolderId) {
      logger.warn('[BACKUP] Google Drive folder ID not configured');
      return false;
    }

    if (!this.encryptionKey || this.encryptionKey.length < 16) {
      logger.warn('[BACKUP] Encryption key not configured or too short');
      return false;
    }

    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const authClient = await auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient as any });
      this.isInitialized = true;
      logger.info('[BACKUP] Google Drive client initialized');
      return true;
    } catch (error) {
      logger.error('[BACKUP] Failed to initialize Google Drive:', error);
      return false;
    }
  }

  /**
   * Check if backup system is configured
   */
  isConfigured(): boolean {
    return !!(
      config.backup?.googleDriveCredentialsPath &&
      config.backup?.googleDriveFolderId &&
      config.backup?.encryptionKey
    );
  }

  /**
   * Perform full backup
   */
  async performFullBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, 'h');
    const backupId = `${timestamp}_${timeStr}`;

    // Create backup log entry
    const backupLog = await prisma.backupLog.create({
      data: {
        backupId,
        status: 'IN_PROGRESS',
        provider: 'GOOGLE_DRIVE',
        startedAt: new Date(),
      },
    });

    try {
      // Initialize if not already done
      if (!await this.initialize()) {
        throw new Error('Backup system not properly configured');
      }

      logger.info(`[BACKUP] Starting backup ${backupId}`);

      // 1. Backup database
      const dbBackupPath = await this.backupDatabase(backupId);
      const dbSize = fs.statSync(dbBackupPath).size;
      logger.info('[BACKUP] Database backup: OK');

      // 2. Backup MinIO files (if exists)
      let minioBackupPath: string | null = null;
      let minioSize = 0;
      const minioDataPath = config.backup?.minioDataPath || '/opt/lexdoc/data/minio';
      if (fs.existsSync(minioDataPath)) {
        minioBackupPath = await this.backupDirectory(backupId, 'minio', minioDataPath);
        minioSize = fs.statSync(minioBackupPath).size;
        logger.info('[BACKUP] MinIO backup: OK');
      }

      // 3. Backup uploads (if exists)
      let uploadsBackupPath: string | null = null;
      let uploadsSize = 0;
      const uploadsPath = config.backup?.uploadsPath || '/mnt/user-data/uploads';
      if (fs.existsSync(uploadsPath)) {
        uploadsBackupPath = await this.backupDirectory(backupId, 'uploads', uploadsPath);
        uploadsSize = fs.statSync(uploadsBackupPath).size;
        logger.info('[BACKUP] Uploads backup: OK');
      }

      // 4. Encrypt files
      const encryptedDbPath = await this.encryptFile(dbBackupPath);
      logger.info('[BACKUP] Database encryption: OK');

      let encryptedMinioPath: string | null = null;
      if (minioBackupPath) {
        encryptedMinioPath = await this.encryptFile(minioBackupPath);
        logger.info('[BACKUP] MinIO encryption: OK');
      }

      let encryptedUploadsPath: string | null = null;
      if (uploadsBackupPath) {
        encryptedUploadsPath = await this.encryptFile(uploadsBackupPath);
        logger.info('[BACKUP] Uploads encryption: OK');
      }

      // 5. Upload to Google Drive
      await this.uploadToGoogleDrive(encryptedDbPath, `database/${timestamp}_postgres.sql.gz.enc`);
      logger.info('[BACKUP] Database upload: OK');

      if (encryptedMinioPath) {
        await this.uploadToGoogleDrive(encryptedMinioPath, `documents/generated/${timestamp}_minio.tar.gz.enc`);
        logger.info('[BACKUP] MinIO upload: OK');
      }

      if (encryptedUploadsPath) {
        await this.uploadToGoogleDrive(encryptedUploadsPath, `documents/uploads/${timestamp}_uploads.tar.gz.enc`);
        logger.info('[BACKUP] Uploads upload: OK');
      }

      // 6. Create and upload manifest
      const metadata: BackupMetadata = {
        backupId,
        timestamp: new Date().toISOString(),
        lexdocVersion: config.app?.version || '1.0.0',
        database: {
          engine: 'PostgreSQL',
          size: dbSize,
          encrypted: true,
        },
        files: {
          minio: { size: minioSize, encrypted: true },
          uploads: { size: uploadsSize, encrypted: true },
        },
        encryption: {
          algorithm: 'AES-256-CBC',
          keyDerivation: 'scrypt',
        },
        retention: {
          days: config.backup?.retentionDays || 30,
          deleteAfter: new Date(
            Date.now() + (config.backup?.retentionDays || 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        totalSize: dbSize + minioSize + uploadsSize,
      };

      const manifestPath = `/tmp/${backupId}_manifest.json`;
      fs.writeFileSync(manifestPath, JSON.stringify(metadata, null, 2));
      await this.uploadToGoogleDrive(manifestPath, `metadata/${timestamp}_manifest.json`);
      logger.info('[BACKUP] Manifest upload: OK');

      // 7. Cleanup temp files
      this.cleanupTempFiles([
        dbBackupPath,
        minioBackupPath,
        uploadsBackupPath,
        encryptedDbPath,
        encryptedMinioPath,
        encryptedUploadsPath,
        manifestPath,
      ]);

      // 8. Clean old backups
      await this.cleanOldBackups();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Update backup log
      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'SUCCESS',
          duration: parseFloat(duration),
          completedAt: new Date(),
          metadata: metadata as any,
        },
      });

      logger.info(`[BACKUP] Backup ${backupId} completed in ${duration}s`);

      return { success: true, backupId, duration };
    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      logger.error('[BACKUP] Backup failed:', error);

      // Update backup log
      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'FAILED',
          duration: parseFloat(duration),
          completedAt: new Date(),
          error: error.message,
        },
      });

      return { success: false, backupId, error: error.message };
    }
  }

  /**
   * Backup PostgreSQL database
   */
  private async backupDatabase(backupId: string): Promise<string> {
    const outputPath = `/tmp/${backupId}_postgres.sql.gz`;

    const dbUrl = config.database.url;

    // Parse DATABASE_URL or use individual config
    const pgDumpCmd = `pg_dump "${dbUrl}" | gzip > ${outputPath}`;

    await execAsync(pgDumpCmd);
    return outputPath;
  }

  /**
   * Backup a directory to tar.gz
   */
  private async backupDirectory(
    backupId: string,
    name: string,
    sourcePath: string
  ): Promise<string> {
    const outputPath = `/tmp/${backupId}_${name}.tar.gz`;

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('tar', { gzip: true, gzipOptions: { level: 9 } });

      output.on('close', () => resolve(outputPath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourcePath, false);
      archive.finalize();
    });
  }

  /**
   * Encrypt file with AES-256-CBC
   */
  private async encryptFile(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.enc`;

    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'lexdoc-backup-salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    // Write IV at the beginning of the file
    output.write(iv);

    return new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output);
      output.on('finish', () => resolve(outputPath));
      output.on('error', reject);
    });
  }

  /**
   * Decrypt file (for restoration)
   */
  async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'lexdoc-backup-salt', 32);

    // Read IV from the beginning of the file
    const fd = fs.openSync(inputPath, 'r');
    const iv = Buffer.alloc(16);
    fs.readSync(fd, iv, 0, 16, 0);
    fs.closeSync(fd);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    // Create read stream starting after the IV
    const input = fs.createReadStream(inputPath, { start: 16 });
    const output = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      input.pipe(decipher).pipe(output);
      output.on('finish', () => resolve());
      output.on('error', reject);
    });
  }

  /**
   * Upload file to Google Drive
   */
  private async uploadToGoogleDrive(
    filePath: string,
    remotePath: string
  ): Promise<string> {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    // Create folder structure if needed
    const pathParts = remotePath.split('/');
    const filename = pathParts.pop()!;

    let parentFolderId = this.backupFolderId;

    // Create intermediate folders
    for (const folderName of pathParts) {
      parentFolderId = await this.getOrCreateFolder(folderName, parentFolderId);
    }

    // Check if file already exists
    const existingFile = await this.findFile(filename, parentFolderId);
    if (existingFile) {
      // Update existing file
      const response = await this.drive.files.update({
        fileId: existingFile.id!,
        media: {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(filePath),
        },
        fields: 'id, name, size, createdTime',
      });
      return response.data.id!;
    }

    // Upload new file
    const fileMetadata = {
      name: filename,
      parents: [parentFolderId],
    };

    const media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(filePath),
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, size, createdTime',
    });

    logger.info(`[BACKUP] Uploaded: ${remotePath}`);
    return response.data.id!;
  }

  /**
   * Find file in Google Drive folder
   */
  private async findFile(
    filename: string,
    parentId: string
  ): Promise<drive_v3.Schema$File | null> {
    if (!this.drive) return null;

    const query = `name='${filename}' and '${parentId}' in parents and trashed=false`;
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    return response.data.files?.[0] || null;
  }

  /**
   * Get or create folder in Google Drive
   */
  private async getOrCreateFolder(
    folderName: string,
    parentId: string
  ): Promise<string> {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    // Check if folder exists
    const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create folder
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const folder = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id!;
  }

  /**
   * Clean old backups based on retention policy
   */
  private async cleanOldBackups(): Promise<void> {
    if (!this.drive) return;

    const retentionDays = config.backup?.retentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    // Clean database backups
    deletedCount += await this.cleanFolderOldFiles('database', cutoffDate);

    // Clean document backups
    deletedCount += await this.cleanFolderOldFiles('documents/generated', cutoffDate);
    deletedCount += await this.cleanFolderOldFiles('documents/uploads', cutoffDate);

    // Clean metadata
    deletedCount += await this.cleanFolderOldFiles('metadata', cutoffDate);

    if (deletedCount > 0) {
      logger.info(`[BACKUP] Cleaned ${deletedCount} old backups (> ${retentionDays} days)`);
    }
  }

  /**
   * Clean old files in a specific folder
   */
  private async cleanFolderOldFiles(
    folderPath: string,
    cutoffDate: Date
  ): Promise<number> {
    if (!this.drive) return 0;

    let parentFolderId = this.backupFolderId;
    const pathParts = folderPath.split('/');

    // Navigate to folder
    for (const folderName of pathParts) {
      const folder = await this.findFile(folderName, parentFolderId);
      if (!folder) return 0;
      parentFolderId = folder.id!;
    }

    // List files in folder
    const response = await this.drive.files.list({
      q: `'${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc',
    });

    let deletedCount = 0;

    for (const file of response.data.files || []) {
      const fileDate = new Date(file.createdTime!);
      if (fileDate < cutoffDate) {
        await this.drive.files.delete({ fileId: file.id! });
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Cleanup temp files
   */
  private cleanupTempFiles(paths: (string | null)[]): void {
    for (const filePath of paths) {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          logger.warn(`[BACKUP] Failed to cleanup ${filePath}`);
        }
      }
    }
  }

  /**
   * List all backups
   */
  async listBackups(limit = 50): Promise<any[]> {
    return prisma.backupLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get backup by ID
   */
  async getBackup(backupId: string) {
    return prisma.backupLog.findUnique({
      where: { backupId },
    });
  }

  /**
   * Download file from Google Drive
   */
  async downloadFromGoogleDrive(
    remotePath: string,
    localPath: string
  ): Promise<void> {
    if (!await this.initialize()) {
      throw new Error('Backup system not configured');
    }

    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    const pathParts = remotePath.split('/');
    const filename = pathParts.pop()!;

    let parentFolderId = this.backupFolderId;

    // Navigate to folder
    for (const folderName of pathParts) {
      const folder = await this.findFile(folderName, parentFolderId);
      if (!folder) {
        throw new Error(`Folder not found: ${folderName}`);
      }
      parentFolderId = folder.id!;
    }

    // Find file
    const file = await this.findFile(filename, parentFolderId);
    if (!file) {
      throw new Error(`File not found: ${filename}`);
    }

    // Download file
    const response = await this.drive.files.get(
      { fileId: file.id!, alt: 'media' },
      { responseType: 'stream' }
    );

    const dest = fs.createWriteStream(localPath);

    return new Promise((resolve, reject) => {
      (response.data as any)
        .on('end', () => resolve())
        .on('error', reject)
        .pipe(dest);
    });
  }

  /**
   * Test backup configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      if (!await this.initialize()) {
        return { success: false, message: 'Configuration incomplete' };
      }

      // Test upload
      const testContent = `LexDoc Backup Test - ${new Date().toISOString()}`;
      const testPath = `/tmp/lexdoc-backup-test-${Date.now()}.txt`;
      fs.writeFileSync(testPath, testContent);

      await this.uploadToGoogleDrive(testPath, `test/connection-test.txt`);
      fs.unlinkSync(testPath);

      return { success: true, message: 'Configuration OK - Test file uploaded' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get backup statistics
   */
  async getStatistics() {
    const [total, success, failed, lastBackup] = await Promise.all([
      prisma.backupLog.count(),
      prisma.backupLog.count({ where: { status: 'SUCCESS' } }),
      prisma.backupLog.count({ where: { status: 'FAILED' } }),
      prisma.backupLog.findFirst({
        where: { status: 'SUCCESS' },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return {
      total,
      success,
      failed,
      successRate: total > 0 ? ((success / total) * 100).toFixed(1) : 0,
      lastSuccessfulBackup: lastBackup?.startedAt || null,
      isConfigured: this.isConfigured(),
    };
  }
}

export const backupService = new BackupService();
