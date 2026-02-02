import { Router } from 'express';
import { clientAccessController } from './client-access.controller';
import { authenticate, requireAdminOrAvocat } from '@/middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Invite a new client (admin/avocat only)
router.post('/invite', requireAdminOrAvocat, clientAccessController.inviteClient.bind(clientAccessController));

// List all client accesses
router.get('/', clientAccessController.listClientAccesses.bind(clientAccessController));

// Get a single client access
router.get('/:id', clientAccessController.getClientAccess.bind(clientAccessController));

// Update permissions (admin/avocat only)
router.put('/:id/permissions', requireAdminOrAvocat, clientAccessController.updatePermissions.bind(clientAccessController));

// Resend invitation (admin/avocat only)
router.post('/:id/resend-invitation', requireAdminOrAvocat, clientAccessController.resendInvitation.bind(clientAccessController));

// Delete client access (admin/avocat only)
router.delete('/:id', requireAdminOrAvocat, clientAccessController.deleteClientAccess.bind(clientAccessController));

// Get access logs
router.get('/:id/logs', clientAccessController.getAccessLogs.bind(clientAccessController));

export { router as clientAccessRoutes };
export default router;
