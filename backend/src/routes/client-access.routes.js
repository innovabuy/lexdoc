const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const emailService = require('../services/email.service');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// CLIENT ACCESS MANAGEMENT (Avocat side)
// ============================================================================

// List all client accesses for tenant
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { folderId, isActivated, search } = req.query;

    const where = {
      folder: { tenantId: req.tenant.id },
    };

    if (folderId) where.folderId = folderId;
    if (isActivated !== undefined) where.isActivated = isActivated === 'true';
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    const [accesses, total] = await Promise.all([
      prisma.clientAccess.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: {
            select: {
              id: true,
              reference: true,
              title: true,
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                  email: true,
                },
              },
            },
          },
          _count: { select: { accessLogs: true } },
        },
      }),
      prisma.clientAccess.count({ where }),
    ]);

    // Remove sensitive fields
    const sanitized = accesses.map((a) => ({
      ...omitSensitiveFields(a),
      passwordHash: undefined,
      activationToken: undefined,
    }));

    return paginatedResponse(res, sanitized, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get client access by ID
router.get('/:id', async (req, res, next) => {
  try {
    const access = await prisma.clientAccess.findFirst({
      where: {
        id: req.params.id,
        folder: { tenantId: req.tenant.id },
      },
      include: {
        folder: {
          select: {
            id: true,
            reference: true,
            title: true,
            client: true,
          },
        },
        accessLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!access) throw new NotFoundError('Client access not found');

    return successResponse(res, {
      ...omitSensitiveFields(access),
      passwordHash: undefined,
      activationToken: undefined,
    });
  } catch (error) {
    next(error);
  }
});

// Invite client to folder (create access)
router.post('/invite', async (req, res, next) => {
  try {
    const { folderId, email } = req.body;

    if (!folderId || !email) {
      throw new BadRequestError('Folder ID and email are required');
    }

    // Verify folder belongs to tenant
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId: req.tenant.id },
      include: { client: true, tenant: true },
    });

    if (!folder) throw new NotFoundError('Folder not found');

    // Check if access already exists
    const existingAccess = await prisma.clientAccess.findUnique({
      where: { folderId_email: { folderId, email: email.trim().toLowerCase() } },
    });

    if (existingAccess) {
      if (existingAccess.isActivated) {
        throw new BadRequestError('This email already has access to this folder');
      }
      // Resend invitation for non-activated access
      const activationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days

      await prisma.clientAccess.update({
        where: { id: existingAccess.id },
        data: { activationToken, tokenExpiresAt },
      });

      // Send invitation email
      try {
        await emailService.sendClientInvitation({
          to: email,
          clientName: folder.client?.companyName ||
            `${folder.client?.firstName || ''} ${folder.client?.lastName || ''}`.trim() ||
            'Client',
          folderTitle: folder.title,
          tenantName: folder.tenant.name,
          activationLink: `${process.env.CLIENT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4002'}/activate/${activationToken}`,
          expiresIn: '7 days',
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }

      return successResponse(res, { id: existingAccess.id }, 'Invitation resent');
    }

    // Create new access
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    const access = await prisma.clientAccess.create({
      data: {
        folderId,
        email: email.trim().toLowerCase(),
        activationToken,
        tokenExpiresAt,
      },
    });

    // Send invitation email
    try {
      await emailService.sendClientInvitation({
        to: email,
        clientName: folder.client?.companyName ||
          `${folder.client?.firstName || ''} ${folder.client?.lastName || ''}`.trim() ||
          'Client',
        folderTitle: folder.title,
        tenantName: folder.tenant.name,
        activationLink: `${process.env.CLIENT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4002'}/activate/${activationToken}`,
        expiresIn: '7 days',
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }

    return successResponse(res, { id: access.id, email: access.email }, 'Invitation sent', 201);
  } catch (error) {
    next(error);
  }
});

// Revoke client access
router.delete('/:id', async (req, res, next) => {
  try {
    const access = await prisma.clientAccess.findFirst({
      where: {
        id: req.params.id,
        folder: { tenantId: req.tenant.id },
      },
    });

    if (!access) throw new NotFoundError('Client access not found');

    await prisma.clientAccess.delete({
      where: { id: req.params.id },
    });

    return successResponse(res, null, 'Client access revoked');
  } catch (error) {
    next(error);
  }
});

// Resend invitation
router.post('/:id/resend', async (req, res, next) => {
  try {
    const access = await prisma.clientAccess.findFirst({
      where: {
        id: req.params.id,
        folder: { tenantId: req.tenant.id },
        isActivated: false,
      },
      include: {
        folder: { include: { client: true, tenant: true } },
      },
    });

    if (!access) throw new NotFoundError('Client access not found or already activated');

    // Generate new token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    await prisma.clientAccess.update({
      where: { id: req.params.id },
      data: { activationToken, tokenExpiresAt },
    });

    // Send invitation email
    try {
      await emailService.sendClientInvitation({
        to: access.email,
        clientName: access.folder.client?.companyName ||
          `${access.folder.client?.firstName || ''} ${access.folder.client?.lastName || ''}`.trim() ||
          'Client',
        folderTitle: access.folder.title,
        tenantName: access.folder.tenant.name,
        activationLink: `${process.env.CLIENT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4002'}/activate/${activationToken}`,
        expiresIn: '7 days',
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }

    return successResponse(res, null, 'Invitation resent');
  } catch (error) {
    next(error);
  }
});

// Get access logs
router.get('/:id/logs', async (req, res, next) => {
  try {
    const access = await prisma.clientAccess.findFirst({
      where: {
        id: req.params.id,
        folder: { tenantId: req.tenant.id },
      },
    });

    if (!access) throw new NotFoundError('Client access not found');

    const { page, pageSize, skip, take } = parsePaginationParams(req.query);

    const [logs, total] = await Promise.all([
      prisma.clientAccessLog.findMany({
        where: { accessId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.clientAccessLog.count({
        where: { accessId: req.params.id },
      }),
    ]);

    return paginatedResponse(res, logs.map((l) => omitSensitiveFields(l)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get stats
router.get('/stats/summary', async (req, res, next) => {
  try {
    const [total, activated, pending, recentLogins] = await Promise.all([
      prisma.clientAccess.count({
        where: { folder: { tenantId: req.tenant.id } },
      }),
      prisma.clientAccess.count({
        where: { folder: { tenantId: req.tenant.id }, isActivated: true },
      }),
      prisma.clientAccess.count({
        where: { folder: { tenantId: req.tenant.id }, isActivated: false },
      }),
      prisma.clientAccess.count({
        where: {
          folder: { tenantId: req.tenant.id },
          isActivated: true,
          lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        },
      }),
    ]);

    return successResponse(res, {
      total,
      activated,
      pending,
      recentLogins,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
