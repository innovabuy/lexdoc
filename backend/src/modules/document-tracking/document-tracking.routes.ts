import { Router } from 'express';
import { documentTrackingController } from './document-tracking.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// Webhook router (public, no authentication)
export const webhookRouter = Router();

/**
 * @swagger
 * /api/webhooks/signature-status:
 *   post:
 *     summary: Handle signature status webhook from Universign
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
webhookRouter.post('/signature-status', documentTrackingController.handleSignatureWebhook.bind(documentTrackingController));

/**
 * @swagger
 * /api/webhooks/lrar-status:
 *   post:
 *     summary: Handle LRAR status webhook from SendingBox
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
webhookRouter.post('/lrar-status', documentTrackingController.handleLrarWebhook.bind(documentTrackingController));

// All document tracking routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/document-tracking:
 *   get:
 *     summary: List all document trackings
 *     tags: [Document Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: deliveryMethod
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of document trackings
 */
router.get('/', documentTrackingController.listTrackings.bind(documentTrackingController));

/**
 * @swagger
 * /api/document-tracking/stats:
 *   get:
 *     summary: Get tracking statistics
 *     tags: [Document Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tracking statistics
 */
router.get('/stats', documentTrackingController.getStats.bind(documentTrackingController));

export default router;
