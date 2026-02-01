import { Router } from 'express';
import { signaturesController } from './signatures.controller';
import { signatureWebhooksController } from './webhooks.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery } from '@/middlewares/validation';
import {
  createSignatureSchema,
  listSignaturesSchema,
  remindSignerSchema,
} from './signatures.schemas';

const router = Router();

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// List signatures
router.get(
  '/',
  authenticate,
  validateQuery(listSignaturesSchema),
  signaturesController.list.bind(signaturesController)
);

// Create signature
router.post(
  '/',
  authenticate,
  validateBody(createSignatureSchema),
  signaturesController.create.bind(signaturesController)
);

// Get signature by ID
router.get(
  '/:id',
  authenticate,
  signaturesController.getById.bind(signaturesController)
);

// Cancel signature
router.post(
  '/:id/cancel',
  authenticate,
  signaturesController.cancel.bind(signaturesController)
);

// Remind signer
router.post(
  '/:id/remind',
  authenticate,
  validateBody(remindSignerSchema),
  signaturesController.remind.bind(signaturesController)
);

// Download signed document
router.get(
  '/:id/download',
  authenticate,
  signaturesController.download.bind(signaturesController)
);

// Download certificates
router.get(
  '/:id/certificates',
  authenticate,
  signaturesController.downloadCertificates.bind(signaturesController)
);

export default router;

// ============================================
// WEBHOOK ROUTES (PUBLIC - NO AUTH)
// ============================================
export const webhookRouter = Router();

// Universign webhook
webhookRouter.post(
  '/universign',
  signatureWebhooksController.handleUniversignWebhook.bind(signatureWebhooksController)
);
