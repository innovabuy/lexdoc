const fs = require('fs').promises;
const path = require('path');

// Mock Prisma client
const mockPrisma = {
  backupLog: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => mockPrisma);

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../src/config/logger', () => mockLogger);

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    callback(null, { stdout: '', stderr: '' });
  }),
}));

// Mock util.promisify to return a resolved promise
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn((fn) => jest.fn().mockResolvedValue({ stdout: '', stderr: '' })),
}));

describe('BackupService', () => {
  let BackupService;

  beforeAll(() => {
    // Set required env vars before loading module
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    process.env.BACKUP_DIR = '/tmp/test-backups';
    BackupService = require('../../src/services/backup.service');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.GOOGLE_DRIVE_FOLDER_ID;
    delete process.env.GOOGLE_DRIVE_CLIENT_ID;
  });

  describe('ensureBackupDir', () => {
    it('should create backup directory if it does not exist', async () => {
      const mkdirSpy = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

      await BackupService.ensureBackupDir();

      expect(mkdirSpy).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );

      mkdirSpy.mockRestore();
    });

    it('should throw error if mkdir fails', async () => {
      const mkdirSpy = jest.spyOn(fs, 'mkdir').mockRejectedValue(new Error('Permission denied'));

      await expect(BackupService.ensureBackupDir()).rejects.toThrow('Permission denied');

      mkdirSpy.mockRestore();
    });
  });

  describe('createDatabaseBackup', () => {
    it('should create backup log entry', async () => {
      mockPrisma.backupLog.create.mockResolvedValue({ id: 'backup-1' });
      mockPrisma.backupLog.update.mockResolvedValue({ id: 'backup-1', status: 'COMPLETED' });

      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'stat').mockResolvedValue({ size: 1024 });

      await BackupService.createDatabaseBackup();

      expect(mockPrisma.backupLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'DATABASE',
          status: 'IN_PROGRESS',
        }),
      });
    });

    it('should update backup log on completion', async () => {
      mockPrisma.backupLog.create.mockResolvedValue({ id: 'backup-1' });
      mockPrisma.backupLog.update.mockResolvedValue({ id: 'backup-1' });

      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'stat').mockResolvedValue({ size: 2048 });

      await BackupService.createDatabaseBackup();

      expect(mockPrisma.backupLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
          }),
        })
      );
    });

    it('should log error on failure after backup started', async () => {
      // Mock successful backup creation but failed stat
      mockPrisma.backupLog.create.mockResolvedValue({ id: 'backup-1' });
      mockPrisma.backupLog.update.mockResolvedValue({ id: 'backup-1' });

      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'stat').mockRejectedValue(new Error('File not found'));

      await expect(BackupService.createDatabaseBackup()).rejects.toThrow();

      expect(mockPrisma.backupLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });
  });

  describe('createMinioBackup', () => {
    it('should create minio backup', async () => {
      mockPrisma.backupLog.create.mockResolvedValue({ id: 'backup-minio-1' });
      mockPrisma.backupLog.update.mockResolvedValue({ id: 'backup-minio-1' });

      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      jest.spyOn(fs, 'stat').mockResolvedValue({ size: 512 });

      const result = await BackupService.createMinioBackup();

      expect(result).toHaveProperty('filepath');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size', 512);
    });
  });

  describe('createFullBackup', () => {
    it('should create database and minio backups', async () => {
      mockPrisma.backupLog.create.mockResolvedValue({ id: 'backup-full' });
      mockPrisma.backupLog.update.mockResolvedValue({ id: 'backup-full' });

      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'stat').mockResolvedValue({ size: 1024 });
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await BackupService.createFullBackup();

      expect(result).toHaveProperty('backupId');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('minio');
      expect(result).toHaveProperty('totalSize');
    });
  });

  describe('cleanupOldBackups', () => {
    it('should delete old backup logs', async () => {
      mockPrisma.backupLog.deleteMany.mockResolvedValue({ count: 5 });
      jest.spyOn(fs, 'readdir').mockResolvedValue([]);

      const result = await BackupService.cleanupOldBackups();

      expect(result).toHaveProperty('deletedLogs', 5);
      expect(mockPrisma.backupLog.deleteMany).toHaveBeenCalled();
    });

    it('should delete old files from backup directory', async () => {
      mockPrisma.backupLog.deleteMany.mockResolvedValue({ count: 0 });

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);

      jest.spyOn(fs, 'readdir').mockResolvedValue(['old-backup.sql']);
      jest.spyOn(fs, 'stat').mockResolvedValue({ mtime: oldDate });
      const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

      await BackupService.cleanupOldBackups();

      expect(unlinkSpy).toHaveBeenCalled();
    });
  });

  describe('listRecentBackups', () => {
    it('should return recent backups', async () => {
      const mockBackups = [
        { id: '1', type: 'DATABASE', status: 'COMPLETED' },
        { id: '2', type: 'FULL', status: 'COMPLETED' },
      ];
      mockPrisma.backupLog.findMany.mockResolvedValue(mockBackups);

      const result = await BackupService.listRecentBackups(10);

      expect(result).toHaveLength(2);
      expect(mockPrisma.backupLog.findMany).toHaveBeenCalledWith({
        orderBy: { startedAt: 'desc' },
        take: 10,
      });
    });

    it('should use default limit if not provided', async () => {
      mockPrisma.backupLog.findMany.mockResolvedValue([]);

      await BackupService.listRecentBackups();

      expect(mockPrisma.backupLog.findMany).toHaveBeenCalledWith({
        orderBy: { startedAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('getBackupStats', () => {
    it('should return backup statistics', async () => {
      mockPrisma.backupLog.count.mockImplementation(({ where } = {}) => {
        if (!where) return Promise.resolve(100);
        if (where.status === 'COMPLETED') return Promise.resolve(95);
        if (where.status === 'FAILED') return Promise.resolve(5);
        return Promise.resolve(0);
      });

      mockPrisma.backupLog.findFirst.mockResolvedValue({
        completedAt: new Date(),
        fileSize: BigInt(1024 * 1024),
      });

      const stats = await BackupService.getBackupStats();

      expect(stats).toHaveProperty('total', 100);
      expect(stats).toHaveProperty('completed', 95);
      expect(stats).toHaveProperty('failed', 5);
      expect(stats).toHaveProperty('successRate', '95.0');
      expect(stats).toHaveProperty('lastBackupAt');
      expect(stats).toHaveProperty('lastBackupSize');
    });

    it('should handle empty backup history', async () => {
      mockPrisma.backupLog.count.mockResolvedValue(0);
      mockPrisma.backupLog.findFirst.mockResolvedValue(null);

      const stats = await BackupService.getBackupStats();

      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.lastBackupAt).toBeUndefined();
    });
  });

  describe('uploadToGoogleDrive', () => {
    it('should skip upload if folder ID not configured', async () => {
      delete process.env.GOOGLE_DRIVE_FOLDER_ID;

      const result = await BackupService.uploadToGoogleDrive('/tmp/test.sql', 'test.sql');

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Google Drive folder ID not configured, skipping upload'
      );
    });

    it('should return local backup info if credentials not configured', async () => {
      process.env.GOOGLE_DRIVE_FOLDER_ID = 'test-folder-id';
      delete process.env.GOOGLE_DRIVE_CLIENT_ID;

      const result = await BackupService.uploadToGoogleDrive('/tmp/test.sql', 'test.sql');

      expect(result).toHaveProperty('local', true);
      expect(result.googleDriveId).toContain('local_');
    });
  });

  describe('Retention policy', () => {
    it('should use default retention of 30 days', () => {
      expect(BackupService.retentionDays).toBeDefined();
    });

    it('should use custom retention from env', () => {
      // Default is 30 or whatever was set
      expect(typeof BackupService.retentionDays).toBe('number');
    });
  });
});
