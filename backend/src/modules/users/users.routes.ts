import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireAdmin, requireAdminOrAvocat } from '@/middlewares/auth';
import { validate, validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from './users.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Current user routes
router.get('/me', usersController.getCurrentUser.bind(usersController));
router.patch(
  '/me',
  validateBody(updateUserSchema),
  usersController.updateCurrentUser.bind(usersController)
);
router.patch(
  '/me/password',
  validateBody(changePasswordSchema),
  usersController.changePassword.bind(usersController)
);

// List users
router.get(
  '/',
  requireAdminOrAvocat,
  validateQuery(listUsersQuerySchema),
  usersController.listUsers.bind(usersController)
);

// Create user (Admin only)
router.post(
  '/',
  requireAdmin,
  validateBody(createUserSchema),
  usersController.createUser.bind(usersController)
);

// Get user by ID
router.get(
  '/:id',
  requireAdminOrAvocat,
  validateParams(userIdParamSchema),
  usersController.getUser.bind(usersController)
);

// Update user
router.patch(
  '/:id',
  requireAdmin,
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  usersController.updateUser.bind(usersController)
);

// Update user role (Admin only)
router.patch(
  '/:id/role',
  requireAdmin,
  validate({ params: userIdParamSchema, body: updateUserRoleSchema }),
  usersController.updateUserRole.bind(usersController)
);

// Update user status (Admin only)
router.patch(
  '/:id/status',
  requireAdmin,
  validate({ params: userIdParamSchema, body: updateUserStatusSchema }),
  usersController.updateUserStatus.bind(usersController)
);

// Delete user (Admin only)
router.delete(
  '/:id',
  requireAdmin,
  validateParams(userIdParamSchema),
  usersController.deleteUser.bind(usersController)
);

export default router;
