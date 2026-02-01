import { Router } from 'express';
import { foldersController } from './folders.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery } from '@/middlewares/validation';
import {
  createFolderSchema,
  updateFolderSchema,
  moveFolderSchema,
  listFoldersSchema,
  getFolderTreeSchema,
} from './folders.schemas';

const router = Router();

// All folder routes require authentication
router.use(authenticate);

// List folders
router.get(
  '/',
  validateQuery(listFoldersSchema),
  foldersController.list.bind(foldersController)
);

// Get folder tree
router.get(
  '/tree',
  validateQuery(getFolderTreeSchema),
  foldersController.getTree.bind(foldersController)
);

// Create folder
router.post(
  '/',
  validateBody(createFolderSchema),
  foldersController.create.bind(foldersController)
);

// Get folder by ID
router.get(
  '/:id',
  foldersController.getById.bind(foldersController)
);

// Get folder breadcrumb
router.get(
  '/:id/breadcrumb',
  foldersController.getBreadcrumb.bind(foldersController)
);

// Update folder
router.patch(
  '/:id',
  validateBody(updateFolderSchema),
  foldersController.update.bind(foldersController)
);

// Move folder
router.patch(
  '/:id/move',
  validateBody(moveFolderSchema),
  foldersController.move.bind(foldersController)
);

// Delete folder
router.delete(
  '/:id',
  foldersController.delete.bind(foldersController)
);

export default router;
