import { Router } from 'express';
import { documentsController } from './documents.controller';
import { documentTrackingController } from '../document-tracking/document-tracking.controller';
import { uploadSingle, uploadMultiple } from './upload.middleware';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery } from '@/middlewares/validation';
import {
  updateDocumentSchema,
  moveDocumentSchema,
  bulkMoveSchema,
  bulkDeleteSchema,
  searchDocumentsSchema,
  listDocumentsSchema,
} from './documents.schemas';

const router = Router();

// All document routes require authentication
router.use(authenticate);

// List documents
router.get(
  '/',
  validateQuery(listDocumentsSchema),
  documentsController.list.bind(documentsController)
);

// Search documents
router.get(
  '/search',
  validateQuery(searchDocumentsSchema),
  documentsController.search.bind(documentsController)
);

// Upload single file
router.post(
  '/upload',
  uploadSingle,
  documentsController.upload.bind(documentsController)
);

// Upload multiple files
router.post(
  '/upload-multiple',
  uploadMultiple,
  documentsController.upload.bind(documentsController)
);

// Bulk move documents
router.post(
  '/bulk-move',
  validateBody(bulkMoveSchema),
  documentsController.bulkMove.bind(documentsController)
);

// Bulk delete documents
router.post(
  '/bulk-delete',
  validateBody(bulkDeleteSchema),
  documentsController.bulkDelete.bind(documentsController)
);

// Get document by ID
router.get(
  '/:id',
  documentsController.getById.bind(documentsController)
);

// Update document
router.patch(
  '/:id',
  validateBody(updateDocumentSchema),
  documentsController.update.bind(documentsController)
);

// Delete document
router.delete(
  '/:id',
  documentsController.delete.bind(documentsController)
);

// Download document
router.get(
  '/:id/download',
  documentsController.download.bind(documentsController)
);

// Preview document (inline)
router.get(
  '/:id/preview',
  documentsController.preview.bind(documentsController)
);

// Move document
router.patch(
  '/:id/move',
  validateBody(moveDocumentSchema),
  documentsController.move.bind(documentsController)
);

// Duplicate document
router.post(
  '/:id/duplicate',
  documentsController.duplicate.bind(documentsController)
);

// Get document versions
router.get(
  '/:id/versions',
  documentsController.getVersions.bind(documentsController)
);

// Create new version
router.post(
  '/:id/versions',
  uploadSingle,
  documentsController.createVersion.bind(documentsController)
);

// Restore version
router.post(
  '/:id/versions/:versionId/restore',
  documentsController.restoreVersion.bind(documentsController)
);

// ============================================
// DOCUMENT TRACKING ROUTES
// ============================================

/**
 * @swagger
 * /api/documents/{id}/tracking:
 *   get:
 *     summary: Get tracking info for a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document tracking info
 */
router.get(
  '/:id/tracking',
  documentTrackingController.getTracking.bind(documentTrackingController)
);

/**
 * @swagger
 * /api/documents/{id}/send-for-signature:
 *   post:
 *     summary: Send document for electronic signature
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signatories
 *             properties:
 *               signatories:
 *                 type: array
 *               message:
 *                 type: string
 *               deadline:
 *                 type: string
 *               autoReminders:
 *                 type: boolean
 *               reminderFrequency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document sent for signature
 */
router.post(
  '/:id/send-for-signature',
  documentTrackingController.sendForSignature.bind(documentTrackingController)
);

/**
 * @swagger
 * /api/documents/{id}/send-lrar:
 *   post:
 *     summary: Send document via LRAR
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *             properties:
 *               recipient:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       201:
 *         description: Document sent via LRAR
 */
router.post(
  '/:id/send-lrar',
  documentTrackingController.sendLrar.bind(documentTrackingController)
);

/**
 * @swagger
 * /api/documents/{id}/send-reminder:
 *   post:
 *     summary: Send manual reminder
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder sent
 */
router.post(
  '/:id/send-reminder',
  documentTrackingController.sendReminder.bind(documentTrackingController)
);

/**
 * @swagger
 * /api/documents/{id}/cancel-signature:
 *   post:
 *     summary: Cancel signature request
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signature cancelled
 */
router.post(
  '/:id/cancel-signature',
  documentTrackingController.cancelSignature.bind(documentTrackingController)
);

export default router;
