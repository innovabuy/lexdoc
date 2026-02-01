import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get overall health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services healthy
 *       503:
 *         description: One or more services unhealthy
 */
router.get('/', healthController.health.bind(healthController));

/**
 * @swagger
 * /api/health/db:
 *   get:
 *     summary: Check database health
 *     tags: [Health]
 */
router.get('/db', healthController.databaseHealth.bind(healthController));

/**
 * @swagger
 * /api/health/minio:
 *   get:
 *     summary: Check MinIO health
 *     tags: [Health]
 */
router.get('/minio', healthController.minioHealth.bind(healthController));

export default router;
