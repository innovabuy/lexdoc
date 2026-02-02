import { Router } from 'express';
import { builderTemplatesController } from './builder-templates.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  createBuilderTemplateSchema,
  updateBuilderTemplateSchema,
  builderTemplateQuerySchema,
  templateIdParamSchema,
  documentTypeParamSchema,
  previewGenerationSchema,
  treeQuerySchema,
} from './builder-templates.schemas';

const router = Router();

// All builder-templates routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/builder-templates:
 *   get:
 *     summary: List all builder templates
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: juridiction
 *         schema:
 *           type: string
 *       - in: query
 *         name: isSystemTemplate
 *         schema:
 *           type: boolean
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
 *         description: List of builder templates
 */
router.get(
  '/',
  validateQuery(builderTemplateQuerySchema),
  builderTemplatesController.list.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/document-types:
 *   get:
 *     summary: Get all document types with counts
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of document types with counts
 */
router.get(
  '/document-types',
  builderTemplatesController.getDocumentTypes.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/juridictions:
 *   get:
 *     summary: Get all juridictions with counts
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of juridictions with counts
 */
router.get(
  '/juridictions',
  builderTemplatesController.getJuridictions.bind(builderTemplatesController)
);

// ============================================
// TREE STRUCTURE ROUTES
// ============================================

/**
 * @swagger
 * /api/builder-templates/tree:
 *   get:
 *     summary: Get templates organized in tree structure by category
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeEmpty
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include categories with no templates
 *     responses:
 *       200:
 *         description: Tree structure of templates by category
 */
router.get(
  '/tree',
  validateQuery(treeQuerySchema),
  builderTemplatesController.getTreeStructure.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/favorites:
 *   get:
 *     summary: Get favorite templates
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of favorite templates
 */
router.get(
  '/favorites',
  builderTemplatesController.getFavorites.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/recent:
 *   get:
 *     summary: Get recently used templates
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of recently used templates
 */
router.get(
  '/recent',
  builderTemplatesController.getRecent.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/categories:
 *   get:
 *     summary: Get all categories with template counts
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories with counts
 */
router.get(
  '/categories',
  builderTemplatesController.getCategories.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/tags:
 *   get:
 *     summary: Get all unique tags used in templates
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags with usage counts
 */
router.get(
  '/tags',
  builderTemplatesController.getTags.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/by-type/{documentType}:
 *   get:
 *     summary: Get all templates for a specific document type
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *         description: The document type (e.g., ASSIGNATION_FOND, CONCLUSIONS_DEFENSE)
 *     responses:
 *       200:
 *         description: List of templates for the document type with previews
 */
router.get(
  '/by-type/:documentType',
  validateParams(documentTypeParamSchema),
  builderTemplatesController.getByDocumentType.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}:
 *   get:
 *     summary: Get a builder template by ID
 *     tags: [Builder Templates]
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
 *         description: Builder template details with expanded blocks
 *       404:
 *         description: Builder template not found
 */
router.get(
  '/:id',
  validateParams(templateIdParamSchema),
  builderTemplatesController.getById.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}/variables:
 *   get:
 *     summary: Get all required variables for a template
 *     tags: [Builder Templates]
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
 *         description: List of variables needed for the template
 *       404:
 *         description: Builder template not found
 */
router.get(
  '/:id/variables',
  validateParams(templateIdParamSchema),
  builderTemplatesController.getVariables.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates:
 *   post:
 *     summary: Create a new builder template
 *     tags: [Builder Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - documentType
 *             properties:
 *               name:
 *                 type: string
 *               documentType:
 *                 type: string
 *               juridiction:
 *                 type: string
 *               blocksStructure:
 *                 type: array
 *               outputFormat:
 *                 type: string
 *                 enum: [DOCX, PDF]
 *     responses:
 *       201:
 *         description: Builder template created
 */
router.post(
  '/',
  validateBody(createBuilderTemplateSchema),
  builderTemplatesController.create.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}:
 *   put:
 *     summary: Update a builder template
 *     tags: [Builder Templates]
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
 *         description: Builder template updated
 *       403:
 *         description: Cannot modify system templates
 *       404:
 *         description: Builder template not found
 */
router.put(
  '/:id',
  validateParams(templateIdParamSchema),
  validateBody(updateBuilderTemplateSchema),
  builderTemplatesController.update.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}:
 *   delete:
 *     summary: Soft delete a builder template
 *     tags: [Builder Templates]
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
 *         description: Builder template deleted
 *       400:
 *         description: Template has generated documents
 *       403:
 *         description: Cannot delete system templates
 *       404:
 *         description: Builder template not found
 */
router.delete(
  '/:id',
  validateParams(templateIdParamSchema),
  builderTemplatesController.delete.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}/duplicate:
 *   post:
 *     summary: Duplicate a builder template
 *     tags: [Builder Templates]
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
 *         description: Builder template duplicated
 *       404:
 *         description: Builder template not found
 */
router.post(
  '/:id/duplicate',
  validateParams(templateIdParamSchema),
  builderTemplatesController.duplicate.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}/preview:
 *   post:
 *     summary: Generate a preview of the document
 *     tags: [Builder Templates]
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
 *               variables:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preview generated
 *       404:
 *         description: Builder template not found
 */
router.post(
  '/:id/preview',
  validateParams(templateIdParamSchema),
  validateBody(previewGenerationSchema),
  builderTemplatesController.generatePreview.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}/favorite:
 *   post:
 *     summary: Toggle favorite status for a template
 *     tags: [Builder Templates]
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
 *         description: Favorite status toggled
 *       404:
 *         description: Builder template not found
 */
router.post(
  '/:id/favorite',
  validateParams(templateIdParamSchema),
  builderTemplatesController.toggleFavorite.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}/record-usage:
 *   post:
 *     summary: Record template usage
 *     tags: [Builder Templates]
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
 *         description: Usage recorded
 *       404:
 *         description: Builder template not found
 */
router.post(
  '/:id/record-usage',
  validateParams(templateIdParamSchema),
  builderTemplatesController.recordUsage.bind(builderTemplatesController)
);

/**
 * @swagger
 * /api/builder-templates/{id}/derived:
 *   get:
 *     summary: Get templates derived from this template
 *     tags: [Builder Templates]
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
 *         description: List of derived templates
 *       404:
 *         description: Builder template not found
 */
router.get(
  '/:id/derived',
  validateParams(templateIdParamSchema),
  builderTemplatesController.getDerivedTemplates.bind(builderTemplatesController)
);

export default router;
