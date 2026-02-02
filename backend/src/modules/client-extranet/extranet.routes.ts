import { Router } from 'express';
import { extranetAuthController } from './extranet-auth.controller';
import { extranetController } from './extranet.controller';
import { authenticateClient } from './extranet.middleware';
import { authLimiter } from '@/middlewares/rateLimit';

const router = Router();

// =============================================
// PUBLIC ROUTES (no auth required)
// =============================================

// Auth routes with rate limiting
router.get('/auth/activate/:token', extranetAuthController.checkActivationToken.bind(extranetAuthController));
router.post('/auth/activate/:token', authLimiter, extranetAuthController.activateAccount.bind(extranetAuthController));
router.post('/auth/login', authLimiter, extranetAuthController.login.bind(extranetAuthController));
router.post('/auth/forgot-password', authLimiter, extranetAuthController.forgotPassword.bind(extranetAuthController));
router.get('/auth/reset-password/:token', extranetAuthController.checkResetToken.bind(extranetAuthController));
router.post('/auth/reset-password/:token', authLimiter, extranetAuthController.resetPassword.bind(extranetAuthController));

// =============================================
// PROTECTED ROUTES (client auth required)
// =============================================

// Apply client authentication to all routes below
router.use(authenticateClient);

// Dashboard
router.get('/dashboard', extranetController.getDashboard.bind(extranetController));

// Documents
router.get('/documents', extranetController.getDocuments.bind(extranetController));
router.get('/documents/:id', extranetController.getDocument.bind(extranetController));
router.get('/documents/:id/download', extranetController.getDocumentDownload.bind(extranetController));
router.post('/documents/:id/sign', extranetController.signDocument.bind(extranetController));

// Folders
router.get('/folders', extranetController.getFolders.bind(extranetController));

export { router as extranetRoutes };
export default router;
