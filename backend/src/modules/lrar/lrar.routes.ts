import { Router } from 'express';
import { lrarController } from './lrar.controller';
import { lrarWebhooksController } from './webhooks.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery } from '@/middlewares/validation';
import {
  createLrarSchema,
  listLrarSchema,
} from './lrar.schemas';

const router = Router();

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// List LRAR shipments
router.get(
  '/',
  authenticate,
  validateQuery(listLrarSchema),
  lrarController.list.bind(lrarController)
);

// Create LRAR shipment
router.post(
  '/',
  authenticate,
  validateBody(createLrarSchema),
  lrarController.create.bind(lrarController)
);

// Get LRAR by ID
router.get(
  '/:id',
  authenticate,
  lrarController.getById.bind(lrarController)
);

// Cancel LRAR
router.post(
  '/:id/cancel',
  authenticate,
  lrarController.cancel.bind(lrarController)
);

// Download proof (AR)
router.get(
  '/:id/proof',
  authenticate,
  lrarController.downloadProof.bind(lrarController)
);

export default router;

// ============================================
// WEBHOOK ROUTES (PUBLIC - NO AUTH)
// ============================================
export const webhookRouter = Router();

// SendingBox webhook
webhookRouter.post(
  '/sendingbox',
  lrarWebhooksController.handleSendingboxWebhook.bind(lrarWebhooksController)
);
