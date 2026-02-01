import { Request, Response } from 'express';
import { prisma, testConnection } from '@/config/database';
import { testMinioConnection } from '@/config/minio';
import { ApiResponse } from '@/types';

export class HealthController {
  /**
   * GET /api/health
   */
  async health(_req: Request, res: Response) {
    const [dbHealthy, minioHealthy] = await Promise.all([
      testConnection(),
      testMinioConnection(),
    ]);

    const isHealthy = dbHealthy && minioHealthy;

    const response: ApiResponse = {
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: dbHealthy ? 'up' : 'down',
          minio: minioHealthy ? 'up' : 'down',
        },
      },
    };

    res.status(isHealthy ? 200 : 503).json(response);
  }

  /**
   * GET /api/health/db
   */
  async databaseHealth(_req: Request, res: Response) {
    try {
      const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;

      const response: ApiResponse = {
        success: true,
        data: {
          status: 'up',
          timestamp: result[0].now,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
        },
      };

      res.status(503).json(response);
    }
  }

  /**
   * GET /api/health/minio
   */
  async minioHealth(_req: Request, res: Response) {
    const isHealthy = await testMinioConnection();

    if (isHealthy) {
      const response: ApiResponse = {
        success: true,
        data: {
          status: 'up',
        },
      };

      res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MINIO_ERROR',
          message: 'MinIO connection failed',
        },
      };

      res.status(503).json(response);
    }
  }
}

export const healthController = new HealthController();
