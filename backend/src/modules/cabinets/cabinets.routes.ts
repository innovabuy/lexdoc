import { Router } from 'express';
import { cabinetsController } from './cabinets.controller';
import { authenticate, requireAdmin } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { updateCabinetSchema } from './cabinets.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/cabinets/me:
 *   get:
 *     summary: Get current cabinet info
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cabinet info
 */
router.get('/me', cabinetsController.getCabinet.bind(cabinetsController));

/**
 * @swagger
 * /api/cabinets/current:
 *   get:
 *     summary: Get current cabinet info (alias for /me)
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 */
router.get('/current', cabinetsController.getCabinet.bind(cabinetsController));

/**
 * @swagger
 * /api/cabinets/me:
 *   patch:
 *     summary: Update cabinet info (Admin only)
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/me',
  requireAdmin,
  validateBody(updateCabinetSchema),
  cabinetsController.updateCabinet.bind(cabinetsController)
);

/**
 * @swagger
 * /api/cabinets/current:
 *   patch:
 *     summary: Update cabinet info (Admin only, alias for /me)
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/current',
  requireAdmin,
  validateBody(updateCabinetSchema),
  cabinetsController.updateCabinet.bind(cabinetsController)
);

/**
 * @swagger
 * /api/cabinets/me/stats:
 *   get:
 *     summary: Get cabinet statistics
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me/stats', requireAdmin, cabinetsController.getCabinetStats.bind(cabinetsController));

/**
 * @swagger
 * /api/cabinets/current/stats:
 *   get:
 *     summary: Get cabinet statistics (alias for /me/stats)
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 */
router.get('/current/stats', cabinetsController.getCabinetStats.bind(cabinetsController));

export default router;
