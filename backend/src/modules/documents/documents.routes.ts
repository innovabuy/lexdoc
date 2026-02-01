import { Router } from 'express';
import { documentsController } from './documents.controller';
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

export default router;
