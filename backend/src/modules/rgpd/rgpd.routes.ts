import { Router } from 'express';
import { rgpdController } from './rgpd.controller';
import { authenticate } from '@/middlewares/auth';
import { validateBody, validateQuery } from '@/middlewares/validation';
import {
  submitConsentSchema,
  submitRgpdRequestSchema,
  processRgpdRequestSchema,
  createRetentionPolicySchema,
  updateRetentionPolicySchema,
  listRgpdRequestsSchema,
  listConsentsSchema,
} from './rgpd.schemas';

const router = Router();

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

// Submit RGPD consent (for public forms)
router.post(
  '/consent',
  validateBody(submitConsentSchema),
  rgpdController.recordConsent.bind(rgpdController)
);

// Submit data request (public portal)
router.post(
  '/requests',
  validateBody(submitRgpdRequestSchema),
  rgpdController.submitDataRequest.bind(rgpdController)
);

// Verify data request via token
router.get(
  '/requests/verify/:token',
  rgpdController.verifyDataRequest.bind(rgpdController)
);

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Apply authentication to all routes below
router.use(authenticate);

// ============================================
// CONSENT MANAGEMENT (Admin)
// ============================================

// List all consents
router.get(
  '/consents',
  validateQuery(listConsentsSchema),
  rgpdController.listConsents.bind(rgpdController)
);

// Get consents for a specific client
router.get(
  '/clients/:clientId/consents',
  rgpdController.getClientConsents.bind(rgpdController)
);

// Revoke a consent
router.post(
  '/consent/:id/revoke',
  rgpdController.revokeConsent.bind(rgpdController)
);

// ============================================
// DATA REQUEST MANAGEMENT (Admin)
// ============================================

// List all data requests
router.get(
  '/requests',
  validateQuery(listRgpdRequestsSchema),
  rgpdController.listDataRequests.bind(rgpdController)
);

// Get a single data request
router.get(
  '/requests/:id',
  rgpdController.getDataRequest.bind(rgpdController)
);

// Process a data request
router.post(
  '/requests/:id/process',
  validateBody(processRgpdRequestSchema.omit({ requestId: true })),
  rgpdController.processDataRequest.bind(rgpdController)
);

// ============================================
// CLIENT DATA OPERATIONS
// ============================================

// Export client data (portability)
router.get(
  '/clients/:clientId/export',
  rgpdController.exportClientData.bind(rgpdController)
);

// Anonymize client data (erasure)
router.post(
  '/clients/:clientId/anonymize',
  rgpdController.anonymizeClientData.bind(rgpdController)
);

// ============================================
// RETENTION MANAGEMENT
// ============================================

// Create retention policy
router.post(
  '/retention',
  validateBody(createRetentionPolicySchema),
  rgpdController.createRetentionPolicy.bind(rgpdController)
);

// Get retention policy
router.get(
  '/retention/:entityType/:entityId',
  rgpdController.getRetentionPolicy.bind(rgpdController)
);

// Update retention policy
router.patch(
  '/retention/:entityType/:entityId',
  validateBody(updateRetentionPolicySchema),
  rgpdController.updateRetentionPolicy.bind(rgpdController)
);

// ============================================
// AUDIT & DASHBOARD
// ============================================

// Get audit logs
router.get(
  '/audit',
  rgpdController.getAuditLogs.bind(rgpdController)
);

// Get dashboard statistics
router.get(
  '/dashboard',
  rgpdController.getDashboardStats.bind(rgpdController)
);

export default router;
