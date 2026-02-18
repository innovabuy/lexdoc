const prisma = require('../config/database');
const { successResponse } = require('../utils/response');
const { Sentry } = require('../config/sentry');

/**
 * Health check basique
 */
const getHealth = (req, res) => {
  return successResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

/**
 * Health check base de données
 */
const getDatabaseHealth = async (req, res, next) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;

    return successResponse(res, {
      status: 'ok',
      database: 'connected',
      responseTime: `${duration}ms`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Health check détaillé
 */
const getDetailedHealth = async (req, res, next) => {
  try {
    // Database
    const dbStart = Date.now();
    const tenantsCount = await prisma.tenant.count();
    const usersCount = await prisma.user.count();
    const documentsCount = await prisma.document.count();
    const dbDuration = Date.now() - dbStart;

    // Memory
    const memUsage = process.memoryUsage();

    return successResponse(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        status: 'connected',
        responseTime: `${dbDuration}ms`,
        stats: {
          tenants: tenantsCount,
          users: usersCount,
          documents: documentsCount,
        },
      },
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      monitoring: {
        sentry: {
          enabled: !!process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getDatabaseHealth,
  getDetailedHealth,
};
