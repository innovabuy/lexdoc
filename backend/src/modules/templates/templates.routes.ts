import { Router } from 'express';
import multer from 'multer';
import { templatesController } from './templates.controller';
import { authenticate, requireAdminOrAvocat } from '@/middlewares/auth';
import { validate, validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import {
  createTemplateSchema,
  updateTemplateSchema,
  listTemplatesQuerySchema,
  templateIdParamSchema,
  generateDocumentSchema,
  previewTemplateSchema,
} from './templates.schemas';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accept only DOCX files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.docx'];

    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMime || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only DOCX files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Get categories (must be before :id routes)
router.get('/categories', templatesController.getCategories.bind(templatesController));

// List templates
router.get(
  '/',
  validateQuery(listTemplatesQuerySchema),
  templatesController.listTemplates.bind(templatesController)
);

// Create template (Admin and Avocat only)
router.post(
  '/',
  requireAdminOrAvocat,
  upload.single('file'),
  validateBody(createTemplateSchema),
  templatesController.createTemplate.bind(templatesController)
);

// Get template by ID
router.get(
  '/:id',
  validateParams(templateIdParamSchema),
  templatesController.getTemplate.bind(templatesController)
);

// Update template (Admin and Avocat only)
router.patch(
  '/:id',
  requireAdminOrAvocat,
  validate({ params: templateIdParamSchema, body: updateTemplateSchema }),
  templatesController.updateTemplate.bind(templatesController)
);

// Delete template (Admin and Avocat only)
router.delete(
  '/:id',
  requireAdminOrAvocat,
  validateParams(templateIdParamSchema),
  templatesController.deleteTemplate.bind(templatesController)
);

// Get template variables
router.get(
  '/:id/variables',
  validateParams(templateIdParamSchema),
  templatesController.getTemplateVariables.bind(templatesController)
);

// Generate document from template
router.post(
  '/:id/generate',
  validate({ params: templateIdParamSchema, body: generateDocumentSchema }),
  templatesController.generateDocument.bind(templatesController)
);

// Preview template with sample/provided data
router.post(
  '/:id/preview',
  validate({ params: templateIdParamSchema, body: previewTemplateSchema }),
  templatesController.previewTemplate.bind(templatesController)
);

export default router;
