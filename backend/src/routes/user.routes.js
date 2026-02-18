const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, createdResponse } = require('../utils/response');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { omitSensitiveFields } = require('../utils/helpers');

router.use(authenticate);
router.use(enforceTenant);

// Only ADMIN can manage users
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can manage users');
  }
  next();
};

// GET /api/users — List all users for tenant
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.tenant.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    return successResponse(res, users);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id — Get single user
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!user) throw new NotFoundError('User not found');
    return successResponse(res, omitSensitiveFields(user));
  } catch (error) {
    next(error);
  }
});

// POST /api/users — Create / invite new user (ADMIN only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { email, firstName, lastName, phone, role, password } = req.body;

    if (!email || !firstName || !lastName) {
      throw new BadRequestError('email, firstName, and lastName are required');
    }

    // Check tenant user limit
    const userCount = await prisma.user.count({ where: { tenantId: req.tenant.id } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenant.id } });
    if (userCount >= tenant.maxUsers) {
      throw new BadRequestError(`User limit reached (${tenant.maxUsers}). Upgrade your plan.`);
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestError('A user with this email already exists');
    }

    const validRoles = ['ADMIN', 'LAWYER', 'ASSISTANT', 'USER'];
    const userRole = validRoles.includes(role) ? role : 'USER';

    // Generate a temporary password if not provided
    const tempPassword = password || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: phone || null,
        role: userRole,
        password: hashedPassword,
        tenantId: req.tenant.id,
        isActive: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: { email, role: userRole },
      },
    });

    return createdResponse(res, {
      ...omitSensitiveFields(user),
      temporaryPassword: password ? undefined : tempPassword,
    }, 'User created');
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id — Update user (ADMIN only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('User not found');

    const { firstName, lastName, phone, role, email } = req.body;

    const validRoles = ['ADMIN', 'LAWYER', 'ASSISTANT', 'USER'];

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(role && validRoles.includes(role) && { role }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: user.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: { firstName, lastName, phone, role, email },
      },
    });

    return successResponse(res, omitSensitiveFields(user), 'User updated');
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new BadRequestError('This email is already in use'));
    }
    next(error);
  }
});

// POST /api/users/:id/deactivate — Deactivate user (ADMIN only)
router.post('/:id/deactivate', requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('User not found');

    // Prevent deactivating yourself
    if (existing.id === req.user.id) {
      throw new BadRequestError('You cannot deactivate your own account');
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: user.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, omitSensitiveFields(user), 'User deactivated');
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/activate — Reactivate user (ADMIN only)
router.post('/:id/activate', requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('User not found');

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
    });

    return successResponse(res, omitSensitiveFields(user), 'User activated');
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/reset-password — Reset password (ADMIN only)
router.post('/:id/reset-password', requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('User not found');

    const newPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_RESET',
        entityType: 'User',
        entityId: existing.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, { temporaryPassword: newPassword }, 'Password reset');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
