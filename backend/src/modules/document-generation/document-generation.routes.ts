import { Router } from 'express';
import { documentGenerationController } from './document-generation.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateParams } from '@/middlewares/validation';
import {
  previewGenerationSchema,
  generateDocumentSchema,
  documentIdParamSchema,
  sendToSignatureSchema,
  sendToLrarSchema,
} from './document-generation.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/document-generation/preview:
 *   post:
 *     summary: Generate HTML preview of document
 *     tags: [Document Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               filledVariables:
 *                 type: object
 *     responses:
 *       200:
 *         description: HTML preview generated
 */
router.post(
  '/preview',
  validateBody(previewGenerationSchema),
  documentGenerationController.preview.bind(documentGenerationController)
);

/**
 * @swagger
 * /api/document-generation/generate:
 *   post:
 *     summary: Generate and save DOCX document
 *     tags: [Document Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - folderId
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               folderId:
 *                 type: string
 *                 format: uuid
 *               affaireId:
 *                 type: string
 *                 format: uuid
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               filledVariables:
 *                 type: object
 *               outputFormat:
 *                 type: string
 *                 enum: [DOCX, PDF]
 *               includeSignature:
 *                 type: boolean
 *               includeLegalMentions:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Document generated successfully
 */
router.post(
  '/generate',
  validateBody(generateDocumentSchema),
  documentGenerationController.generate.bind(documentGenerationController)
);

/**
 * @swagger
 * /api/document-generation/{id}/download:
 *   get:
 *     summary: Download generated document
 *     tags: [Document Generation]
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
 *         description: Document file
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 */
router.get(
  '/:id/download',
  validateParams(documentIdParamSchema),
  documentGenerationController.download.bind(documentGenerationController)
);

/**
 * @swagger
 * /api/document-generation/{id}/download-url:
 *   get:
 *     summary: Get presigned download URL for document
 *     tags: [Document Generation]
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
 *         description: Download URL
 */
router.get(
  '/:id/download-url',
  validateParams(documentIdParamSchema),
  documentGenerationController.getDownloadUrl.bind(documentGenerationController)
);

/**
 * @swagger
 * /api/document-generation/{id}/send-signature:
 *   post:
 *     summary: Send document for electronic signature
 *     tags: [Document Generation]
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
 *               - signataires
 *             properties:
 *               signataires:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     prenom:
 *                       type: string
 *                     telephone:
 *                       type: string
 *               message:
 *                 type: string
 *               dateExpiration:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Document sent for signature
 */
router.post(
  '/:id/send-signature',
  validateParams(documentIdParamSchema),
  validateBody(sendToSignatureSchema),
  documentGenerationController.sendToSignature.bind(documentGenerationController)
);

/**
 * @swagger
 * /api/document-generation/{id}/send-lrar:
 *   post:
 *     summary: Send document via LRAR
 *     tags: [Document Generation]
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
 *               - destinataire
 *             properties:
 *               destinataire:
 *                 type: object
 *                 properties:
 *                   nom:
 *                     type: string
 *                   prenom:
 *                     type: string
 *                   adresse:
 *                     type: string
 *                   codePostal:
 *                     type: string
 *                   ville:
 *                     type: string
 *                   pays:
 *                     type: string
 *               options:
 *                 type: object
 *                 properties:
 *                   accuseReception:
 *                     type: boolean
 *                   couleur:
 *                     type: boolean
 *                   rectoVerso:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Document sent via LRAR
 */
router.post(
  '/:id/send-lrar',
  validateParams(documentIdParamSchema),
  validateBody(sendToLrarSchema),
  documentGenerationController.sendToLrar.bind(documentGenerationController)
);

export default router;
