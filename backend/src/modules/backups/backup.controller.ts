import { Request, Response, NextFunction } from 'express';
import { backupService } from './backup.service';
import { ApiResponse } from '@/types';
import { AppError } from '@/utils/errors';

class BackupController {
  /**
   * GET /api/backups
   * List all backups
   */
  async listBackups(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const backups = await backupService.listBackups(limit);

      const response: ApiResponse = {
        success: true,
        data: backups,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/backups/stats
   * Get backup statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await backupService.getStatistics();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/backups/:backupId
   * Get a specific backup
   */
  async getBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const { backupId } = req.params;
      const backup = await backupService.getBackup(backupId);

      if (!backup) {
        throw new AppError('Backup non trouve', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: backup,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/backups/trigger
   * Trigger a manual backup
   */
  async triggerBackup(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Acces refuse - Administrateur requis', 403);
      }

      if (!backupService.isConfigured()) {
        throw new AppError('Systeme de backup non configure', 400);
      }

      const result = await backupService.performFullBackup();

      const response: ApiResponse = {
        success: result.success,
        data: result,
        message: result.success
          ? `Backup ${result.backupId} termine avec succes`
          : `Echec du backup: ${result.error}`,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/backups/test
   * Test backup configuration
   */
  async testConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Acces refuse - Administrateur requis', 403);
      }

      const result = await backupService.testConfiguration();

      const response: ApiResponse = {
        success: result.success,
        message: result.message,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/backups/:backupId/manifest
   * Get backup manifest
   */
  async getManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const { backupId } = req.params;
      const backup = await backupService.getBackup(backupId);

      if (!backup) {
        throw new AppError('Backup non trouve', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: backup.metadata,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/backups/config
   * Get backup configuration status
   */
  async getConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Acces refuse - Administrateur requis', 403);
      }

      const isConfigured = backupService.isConfigured();

      const response: ApiResponse = {
        success: true,
        data: {
          isConfigured,
          provider: 'GOOGLE_DRIVE',
          schedule: process.env.BACKUP_SCHEDULE_CRON || '0 3 * * *',
          retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const backupController = new BackupController();
