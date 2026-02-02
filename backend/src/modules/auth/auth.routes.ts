import { Router, Request, Response, NextFunction } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '@/middlewares/validation';
import { authenticate } from '@/middlewares/auth';
import { authLimiter, passwordResetLimiter } from '@/middlewares/rateLimit';
import { usersController } from '@/modules/users/users.controller';
import {
  registerSchema,
  loginSchema,
  login2FASchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  enable2FASchema,
  disable2FASchema,
  resendVerificationSchema,
} from './auth.schemas';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new cabinet with admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: Email already exists
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: 2FA required
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

/**
 * @swagger
 * /api/auth/login/2fa:
 *   post:
 *     summary: Login with 2FA code
 *     tags: [Auth]
 */
router.post(
  '/login/2fa',
  authLimiter,
  validateBody(login2FASchema),
  authController.login2FA.bind(authController)
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refresh.bind(authController)
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Auth]
 */
router.post(
  '/verify-email',
  validateBody(verifyEmailSchema),
  authController.verifyEmail.bind(authController)
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent (if account exists and is unverified)
 */
router.post(
  '/resend-verification',
  authLimiter,
  validateBody(resendVerificationSchema),
  authController.resendVerification.bind(authController)
);

// 2FA routes - require authentication
router.post('/2fa/setup', authenticate, authController.setup2FA.bind(authController));

router.post(
  '/2fa/enable',
  authenticate,
  validateBody(enable2FASchema),
  authController.enable2FA.bind(authController)
);

router.post(
  '/2fa/disable',
  authenticate,
  validateBody(disable2FASchema),
  authController.disable2FA.bind(authController)
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', authenticate, usersController.getCurrentUser.bind(usersController));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile (alias for /profile)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', authenticate, usersController.getCurrentUser.bind(usersController));

export default router;
