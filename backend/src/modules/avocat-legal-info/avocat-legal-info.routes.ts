import { Router } from 'express';
import multer from 'multer';
import { avocatLegalInfoController } from './avocat-legal-info.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateParams } from '@/middlewares/validation';
import {
  createAvocatLegalInfoSchema,
  updateAvocatLegalInfoSchema,
  legalInfoIdParamSchema,
} from './avocat-legal-info.schemas';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez PNG, JPG ou PDF.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/avocat-legal-info/me:
 *   get:
 *     summary: Get legal info for the current user
 *     tags: [Avocat Legal Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Legal info or empty template if none exists
 */
router.get(
  '/me',
  avocatLegalInfoController.getMyLegalInfo.bind(avocatLegalInfoController)
);

/**
 * @swagger
 * /api/avocat-legal-info:
 *   post:
 *     summary: Create legal info profile
 *     tags: [Avocat Legal Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - barreau
 *               - adresseCabinet
 *               - codePostal
 *               - ville
 *               - telephone
 *               - email
 *             properties:
 *               civilite:
 *                 type: string
 *                 enum: [MAITRE, MONSIEUR, MADAME]
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               barreau:
 *                 type: string
 *               numeroToque:
 *                 type: string
 *               adresseCabinet:
 *                 type: string
 *               codePostal:
 *                 type: string
 *               ville:
 *                 type: string
 *               telephone:
 *                 type: string
 *               fax:
 *                 type: string
 *               email:
 *                 type: string
 *               siteWeb:
 *                 type: string
 *     responses:
 *       201:
 *         description: Legal info created successfully
 *       409:
 *         description: Legal info already exists for this user
 */
router.post(
  '/',
  validateBody(createAvocatLegalInfoSchema),
  avocatLegalInfoController.create.bind(avocatLegalInfoController)
);

/**
 * @swagger
 * /api/avocat-legal-info/{id}:
 *   get:
 *     summary: Get legal info by ID
 *     tags: [Avocat Legal Info]
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
 *         description: Legal info details
 *       403:
 *         description: Access denied (not your legal info)
 *       404:
 *         description: Legal info not found
 */
router.get(
  '/:id',
  validateParams(legalInfoIdParamSchema),
  avocatLegalInfoController.getById.bind(avocatLegalInfoController)
);

/**
 * @swagger
 * /api/avocat-legal-info/{id}:
 *   put:
 *     summary: Update legal info profile
 *     tags: [Avocat Legal Info]
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
 *             properties:
 *               civilite:
 *                 type: string
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               barreau:
 *                 type: string
 *               numeroToque:
 *                 type: string
 *               adresseCabinet:
 *                 type: string
 *               codePostal:
 *                 type: string
 *               ville:
 *                 type: string
 *               telephone:
 *                 type: string
 *               fax:
 *                 type: string
 *               email:
 *                 type: string
 *               siteWeb:
 *                 type: string
 *     responses:
 *       200:
 *         description: Legal info updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Legal info not found
 */
router.put(
  '/:id',
  validateParams(legalInfoIdParamSchema),
  validateBody(updateAvocatLegalInfoSchema),
  avocatLegalInfoController.update.bind(avocatLegalInfoController)
);

/**
 * @swagger
 * /api/avocat-legal-info/{id}/signature:
 *   put:
 *     summary: Upload signature image
 *     tags: [Avocat Legal Info]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Signature uploaded successfully
 *       400:
 *         description: Invalid file type
 *       403:
 *         description: Access denied
 *       404:
 *         description: Legal info not found
 */
router.put(
  '/:id/signature',
  validateParams(legalInfoIdParamSchema),
  upload.single('file'),
  avocatLegalInfoController.uploadSignature.bind(avocatLegalInfoController)
);

/**
 * @swagger
 * /api/avocat-legal-info/{id}/cachet:
 *   put:
 *     summary: Upload cachet/logo image
 *     tags: [Avocat Legal Info]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cachet uploaded successfully
 *       400:
 *         description: Invalid file type
 *       403:
 *         description: Access denied
 *       404:
 *         description: Legal info not found
 */
router.put(
  '/:id/cachet',
  validateParams(legalInfoIdParamSchema),
  upload.single('file'),
  avocatLegalInfoController.uploadCachet.bind(avocatLegalInfoController)
);

/**
 * @swagger
 * /api/avocat-legal-info/{id}/preview-mentions:
 *   get:
 *     summary: Generate preview of legal mentions as HTML
 *     tags: [Avocat Legal Info]
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
 *         description: HTML preview of legal mentions
 *       403:
 *         description: Access denied
 *       404:
 *         description: Legal info not found
 */
router.get(
  '/:id/preview-mentions',
  validateParams(legalInfoIdParamSchema),
  avocatLegalInfoController.previewMentions.bind(avocatLegalInfoController)
);

export default router;
