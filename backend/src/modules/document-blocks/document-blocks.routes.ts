import { Router } from 'express';
import { documentBlocksController } from './document-blocks.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  createDocumentBlockSchema,
  updateDocumentBlockSchema,
  documentBlockQuerySchema,
  blockIdParamSchema,
} from './document-blocks.schemas';

const router = Router();

// All document-blocks routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/document-blocks:
 *   get:
 *     summary: List all document blocks
 *     tags: [Document Blocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [INTRO, FAITS, MOYENS, DISPOSITIF, SIGNATURE]
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isSystemBlock
 *         schema:
 *           type: boolean
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, category, createdAt, usageCount, displayOrder]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of document blocks
 */
router.get(
  '/',
  validateQuery(documentBlockQuerySchema),
  documentBlocksController.list.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks/categories:
 *   get:
 *     summary: Get all categories with counts
 *     tags: [Document Blocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories with counts
 */
router.get(
  '/categories',
  documentBlocksController.getCategories.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks/tags:
 *   get:
 *     summary: Get all tags with counts
 *     tags: [Document Blocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags with counts
 */
router.get(
  '/tags',
  documentBlocksController.getTags.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks/extract-variables:
 *   post:
 *     summary: Extract variables from template content
 *     tags: [Document Blocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Extracted variables and validation result
 */
router.post(
  '/extract-variables',
  documentBlocksController.extractVariables.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks/{id}:
 *   get:
 *     summary: Get a document block by ID
 *     tags: [Document Blocks]
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
 *         description: Document block details
 *       404:
 *         description: Document block not found
 */
router.get(
  '/:id',
  validateParams(blockIdParamSchema),
  documentBlocksController.getById.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks:
 *   post:
 *     summary: Create a new document block
 *     tags: [Document Blocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [INTRO, FAITS, MOYENS, DISPOSITIF, SIGNATURE]
 *               content:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isMandatory:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Document block created
 */
router.post(
  '/',
  validateBody(createDocumentBlockSchema),
  documentBlocksController.create.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks/{id}:
 *   put:
 *     summary: Update a document block
 *     tags: [Document Blocks]
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
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               content:
 *                 type: string
 *               variables:
 *                 type: array
 *               tags:
 *                 type: array
 *               isMandatory:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Document block updated
 *       403:
 *         description: Cannot modify system blocks
 *       404:
 *         description: Document block not found
 */
router.put(
  '/:id',
  validateParams(blockIdParamSchema),
  validateBody(updateDocumentBlockSchema),
  documentBlocksController.update.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks/{id}:
 *   delete:
 *     summary: Soft delete a document block
 *     tags: [Document Blocks]
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
 *         description: Document block deleted
 *       400:
 *         description: Block is used in templates
 *       403:
 *         description: Cannot delete system blocks
 *       404:
 *         description: Document block not found
 */
router.delete(
  '/:id',
  validateParams(blockIdParamSchema),
  documentBlocksController.delete.bind(documentBlocksController)
);

/**
 * @swagger
 * /api/document-blocks/{id}/duplicate:
 *   post:
 *     summary: Duplicate a document block
 *     tags: [Document Blocks]
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
 *         description: Document block duplicated
 *       404:
 *         description: Document block not found
 */
router.post(
  '/:id/duplicate',
  validateParams(blockIdParamSchema),
  documentBlocksController.duplicate.bind(documentBlocksController)
);

export default router;
