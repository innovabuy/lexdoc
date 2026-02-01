import { Router } from 'express';
import { generatedDocumentsController } from './generated-documents.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  createGeneratedDocumentSchema,
  updateGeneratedDocumentSchema,
  generatedDocumentQuerySchema,
  documentIdParamSchema,
  finalizeDocumentSchema,
  sendSignatureRequestSchema,
  sendLrarRequestSchema,
} from './generated-documents.schemas';

const router = Router();

// All generated-documents routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/generated-documents:
 *   get:
 *     summary: List all generated documents
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: affaireId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, FINALIZED, SENT, SIGNED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of generated documents
 */
router.get(
  '/',
  validateQuery(generatedDocumentQuerySchema),
  generatedDocumentsController.list.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/stats:
 *   get:
 *     summary: Get statistics for generated documents
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document statistics
 */
router.get(
  '/stats',
  generatedDocumentsController.getStats.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}:
 *   get:
 *     summary: Get a generated document by ID
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Generated document details
 *       404:
 *         description: Document not found
 */
router.get(
  '/:id',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.getById.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/preview:
 *   get:
 *     summary: Get preview/rendered content
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document preview
 *       404:
 *         description: Document not found
 */
router.get(
  '/:id/preview',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.getPreview.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents:
 *   post:
 *     summary: Create a new generated document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - folderId
 *               - title
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               folderId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               affaireId:
 *                 type: string
 *                 format: uuid
 *               filledVariables:
 *                 type: object
 *     responses:
 *       201:
 *         description: Document created
 */
router.post(
  '/',
  validateBody(createGeneratedDocumentSchema),
  generatedDocumentsController.create.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}:
 *   put:
 *     summary: Update a generated document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Document updated
 *       403:
 *         description: Cannot modify finalized document
 *       404:
 *         description: Document not found
 */
router.put(
  '/:id',
  validateParams(documentIdParamSchema),
  validateBody(updateGeneratedDocumentSchema),
  generatedDocumentsController.update.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/finalize:
 *   post:
 *     summary: Finalize a document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               outputFormat:
 *                 type: string
 *                 enum: [DOCX, PDF]
 *     responses:
 *       200:
 *         description: Document finalized
 *       400:
 *         description: Missing required variables
 *       404:
 *         description: Document not found
 */
router.post(
  '/:id/finalize',
  validateParams(documentIdParamSchema),
  validateBody(finalizeDocumentSchema),
  generatedDocumentsController.finalize.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/regenerate:
 *   post:
 *     summary: Regenerate content from template
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document regenerated
 *       400:
 *         description: No template associated
 *       403:
 *         description: Cannot regenerate finalized document
 *       404:
 *         description: Document not found
 */
router.post(
  '/:id/regenerate',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.regenerate.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}:
 *   delete:
 *     summary: Soft delete a generated document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 */
router.delete(
  '/:id',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.delete.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/duplicate:
 *   post:
 *     summary: Duplicate a generated document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Document duplicated
 *       404:
 *         description: Document not found
 */
router.post(
  '/:id/duplicate',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.duplicate.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/send-signature:
 *   post:
 *     summary: Send document for electronic signature via Universign
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 items:
 *                   type: object
 *                   required:
 *                     - firstName
 *                     - lastName
 *                     - email
 *                     - role
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [client, avocat, partie_adverse, temoin, autre]
 *               signingOrder:
 *                 type: string
 *                 enum: [sequential, parallel]
 *                 default: sequential
 *               customMessage:
 *                 type: string
 *               profile:
 *                 type: string
 *                 enum: [default, certified, advanced]
 *                 default: default
 *     responses:
 *       201:
 *         description: Signature request created
 *       400:
 *         description: Document not finalized or other validation error
 *       404:
 *         description: Document not found
 */
router.post(
  '/:id/send-signature',
  validateParams(documentIdParamSchema),
  validateBody(sendSignatureRequestSchema),
  generatedDocumentsController.sendSignature.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/signature-status:
 *   get:
 *     summary: Get signature status for a document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Signature status
 *       404:
 *         description: Document not found
 */
router.get(
  '/:id/signature-status',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.getSignatureStatus.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/download-signed:
 *   get:
 *     summary: Download the signed document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Signed PDF document
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Signed document not available
 */
router.get(
  '/:id/download-signed',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.downloadSignedDocument.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/send-lrar:
 *   post:
 *     summary: Send document via LRAR (registered mail)
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 required:
 *                   - name
 *                   - address
 *                   - postalCode
 *                   - city
 *                 properties:
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                     default: FR
 *               options:
 *                 type: object
 *                 properties:
 *                   color:
 *                     type: boolean
 *                     default: false
 *                   duplex:
 *                     type: boolean
 *                     default: false
 *                   registered:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       201:
 *         description: LRAR request created
 *       400:
 *         description: Document not finalized or validation error
 *       404:
 *         description: Document not found
 */
router.post(
  '/:id/send-lrar',
  validateParams(documentIdParamSchema),
  validateBody(sendLrarRequestSchema),
  generatedDocumentsController.sendLrar.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/lrar-tracking:
 *   get:
 *     summary: Get LRAR tracking status for a document
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: LRAR tracking status
 *       404:
 *         description: Document not found
 */
router.get(
  '/:id/lrar-tracking',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.getLrarTracking.bind(generatedDocumentsController)
);

/**
 * @swagger
 * /api/generated-documents/{id}/download-ar:
 *   get:
 *     summary: Download the delivery proof (AR)
 *     tags: [Generated Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: AR PDF document
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: No LRAR or proof not available
 *       404:
 *         description: Document not found
 */
router.get(
  '/:id/download-ar',
  validateParams(documentIdParamSchema),
  generatedDocumentsController.downloadAR.bind(generatedDocumentsController)
);

export default router;
