const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { ForbiddenError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');

router.use(authenticate);
router.use(enforceTenant);

// Only ADMIN can access backup features
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can manage backups');
  }
  next();
};

router.use(requireAdmin);

// List backup logs
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { type, status } = req.query;

    const where = {
      OR: [{ tenantId: req.tenant.id }, { tenantId: null }],
    };

    if (type) where.type = type;
    if (status) where.status = status;

    const [backups, total] = await Promise.all([
      prisma.backupLog.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.backupLog.count({ where }),
    ]);

    return paginatedResponse(res, backups.map((b) => omitSensitiveFields(b)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get backup by ID
router.get('/:id', async (req, res, next) => {
  try {
    const backup = await prisma.backupLog.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { tenantId: null }],
      },
    });

    if (!backup) {
      return res.status(404).json({ success: false, error: { message: 'Backup not found' } });
    }

    return successResponse(res, omitSensitiveFields(backup));
  } catch (error) {
    next(error);
  }
});

// Trigger manual backup
router.post('/trigger', async (req, res, next) => {
  try {
    const { type = 'FULL' } = req.body;

    // Create backup log entry
    const backup = await prisma.backupLog.create({
      data: {
        tenantId: req.tenant.id,
        type,
        status: 'IN_PROGRESS',
      },
    });

    // In a real implementation, this would trigger the backup job
    // For now, we'll simulate it
    setTimeout(async () => {
      try {
        await prisma.backupLog.update({
          where: { id: backup.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            fileSize: BigInt(Math.floor(Math.random() * 100000000)), // Simulated size
            googleDriveId: `backup_${backup.id}_${Date.now()}`,
          },
        });
      } catch (error) {
        await prisma.backupLog.update({
          where: { id: backup.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: error.message,
          },
        });
      }
    }, 5000);

    return successResponse(res, omitSensitiveFields(backup), 'Backup started', 202);
  } catch (error) {
    next(error);
  }
});

// Get backup stats
router.get('/stats/summary', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, completed, failed, lastBackup] = await Promise.all([
      prisma.backupLog.count({
        where: {
          OR: [{ tenantId: req.tenant.id }, { tenantId: null }],
          startedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.backupLog.count({
        where: {
          OR: [{ tenantId: req.tenant.id }, { tenantId: null }],
          status: 'COMPLETED',
          startedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.backupLog.count({
        where: {
          OR: [{ tenantId: req.tenant.id }, { tenantId: null }],
          status: 'FAILED',
          startedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.backupLog.findFirst({
        where: {
          OR: [{ tenantId: req.tenant.id }, { tenantId: null }],
          status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    // Calculate total backup size
    const sizeResult = await prisma.backupLog.aggregate({
      where: {
        OR: [{ tenantId: req.tenant.id }, { tenantId: null }],
        status: 'COMPLETED',
        startedAt: { gte: thirtyDaysAgo },
      },
      _sum: { fileSize: true },
    });

    return successResponse(res, {
      last30Days: {
        total,
        completed,
        failed,
        totalSize: sizeResult._sum.fileSize?.toString() || '0',
      },
      lastBackup: lastBackup ? omitSensitiveFields(lastBackup) : null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
