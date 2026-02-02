import { Router } from 'express';
import { freeNotesController } from './free-notes.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import {
  createFreeNoteSchema,
  updateFreeNoteSchema,
  convertToBlockSchema,
  folderIdParamSchema,
  noteIdParamSchema,
  freeNotesQuerySchema,
} from './free-notes.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/free-notes:
 *   get:
 *     summary: Get all free notes for the cabinet
 *     tags: [Free Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of free notes
 */
router.get(
  '/',
  freeNotesController.getAllForCabinet.bind(freeNotesController)
);

/**
 * @swagger
 * /api/free-notes/{noteId}:
 *   get:
 *     summary: Get a free note by ID
 *     tags: [Free Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Free note details
 *       404:
 *         description: Note not found
 */
router.get(
  '/:noteId',
  validateParams(noteIdParamSchema),
  freeNotesController.getById.bind(freeNotesController)
);

/**
 * @swagger
 * /api/free-notes/{noteId}:
 *   put:
 *     summary: Update a free note
 *     tags: [Free Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
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
 *               content:
 *                 type: string
 *               linkedCategory:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated free note
 *       404:
 *         description: Note not found
 */
router.put(
  '/:noteId',
  validateParams(noteIdParamSchema),
  validateBody(updateFreeNoteSchema),
  freeNotesController.update.bind(freeNotesController)
);

/**
 * @swagger
 * /api/free-notes/{noteId}:
 *   delete:
 *     summary: Delete a free note
 *     tags: [Free Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Note deleted
 *       404:
 *         description: Note not found
 */
router.delete(
  '/:noteId',
  validateParams(noteIdParamSchema),
  freeNotesController.delete.bind(freeNotesController)
);

/**
 * @swagger
 * /api/free-notes/{noteId}/convert-to-block:
 *   post:
 *     summary: Convert a free note to a reusable block
 *     tags: [Free Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
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
 *               - title
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [INTRO, FAITS, MOYENS, DISPOSITIF, SIGNATURE, CLAUSE, MENTION_LEGALE, CUSTOM]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: New reusable block created
 *       404:
 *         description: Note not found
 */
router.post(
  '/:noteId/convert-to-block',
  validateParams(noteIdParamSchema),
  validateBody(convertToBlockSchema),
  freeNotesController.convertToBlock.bind(freeNotesController)
);

export default router;

/**
 * Routes for folder-scoped free notes
 * These are mounted at /api/folders/:folderId/free-notes
 */
export const folderFreeNotesRouter = Router({ mergeParams: true });

folderFreeNotesRouter.use(authenticate);

/**
 * @swagger
 * /api/folders/{folderId}/free-notes:
 *   get:
 *     summary: Get all free notes for a folder
 *     tags: [Free Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: linkedCategory
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of free notes for the folder
 */
folderFreeNotesRouter.get(
  '/',
  validateQuery(freeNotesQuerySchema),
  freeNotesController.getByFolder.bind(freeNotesController)
);

/**
 * @swagger
 * /api/folders/{folderId}/free-notes:
 *   post:
 *     summary: Create a new free note for a folder
 *     tags: [Free Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
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
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 default: "Note personnalisée"
 *               content:
 *                 type: string
 *               linkedCategory:
 *                 type: string
 *                 enum: [INTRO, FAITS, MOYENS, DISPOSITIF, SIGNATURE, CLAUSE, MENTION_LEGALE, CUSTOM]
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Free note created
 *       404:
 *         description: Folder not found
 */
folderFreeNotesRouter.post(
  '/',
  validateBody(createFreeNoteSchema),
  freeNotesController.create.bind(freeNotesController)
);
