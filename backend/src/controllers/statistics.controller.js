const prisma = require('../config/database');
const { successResponse } = require('../utils/response');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;

    const [
      totalDocuments,
      totalFolders,
      totalClients,
      pendingSignatures,
      signedDocuments,
      openFolders,
      pendingRequests,
      recentActivity,
    ] = await Promise.all([
      prisma.document.count({ where: { tenantId, deletedAt: null } }),
      prisma.folder.count({ where: { tenantId } }),
      prisma.client.count({ where: { tenantId } }),
      prisma.signature.count({ where: { document: { tenantId }, status: 'PENDING' } }),
      prisma.signature.count({ where: { document: { tenantId }, status: 'SIGNED' } }),
      prisma.folder.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.documentRequest.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return successResponse(res, {
      totalDocuments,
      totalFolders,
      totalClients,
      pendingSignatures,
      signedDocuments,
      openFolders,
      pendingRequests,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document statistics over time
 */
const getDocumentStats = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get documents created per day
    const documents = await prisma.document.findMany({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, type: true, status: true },
    });

    // Group by date
    const byDate = {};
    const byType = {};
    const byStatus = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      byDate[dateKey] = 0;
    }

    for (const doc of documents) {
      const dateKey = doc.createdAt.toISOString().split('T')[0];
      if (byDate[dateKey] !== undefined) {
        byDate[dateKey]++;
      }

      byType[doc.type] = (byType[doc.type] || 0) + 1;
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
    }

    // Convert to arrays for charts
    const timeline = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const typeDistribution = Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const statusDistribution = Object.entries(byStatus)
      .map(([status, count]) => ({ status, count }));

    return successResponse(res, {
      timeline,
      typeDistribution,
      statusDistribution,
      total: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get folder statistics
 */
const getFolderStats = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;

    const folders = await prisma.folder.findMany({
      where: { tenantId },
      select: {
        type: true,
        status: true,
        openedAt: true,
        closedAt: true,
        _count: { select: { documents: true } },
      },
    });

    const byType = {};
    const byStatus = {};
    let totalDocuments = 0;

    for (const folder of folders) {
      byType[folder.type] = (byType[folder.type] || 0) + 1;
      byStatus[folder.status] = (byStatus[folder.status] || 0) + 1;
      totalDocuments += folder._count.documents;
    }

    const typeDistribution = Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const statusDistribution = Object.entries(byStatus)
      .map(([status, count]) => ({ status, count }));

    return successResponse(res, {
      total: folders.length,
      totalDocuments,
      avgDocumentsPerFolder: folders.length > 0 ? Math.round(totalDocuments / folders.length) : 0,
      typeDistribution,
      statusDistribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity statistics
 */
const getActivityStats = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: { action: true, createdAt: true, entityType: true },
    });

    // Group by date
    const byDate = {};
    const byAction = {};
    const byEntityType = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      byDate[dateKey] = 0;
    }

    for (const activity of activities) {
      const dateKey = activity.createdAt.toISOString().split('T')[0];
      if (byDate[dateKey] !== undefined) {
        byDate[dateKey]++;
      }

      byAction[activity.action] = (byAction[activity.action] || 0) + 1;
      if (activity.entityType) {
        byEntityType[activity.entityType] = (byEntityType[activity.entityType] || 0) + 1;
      }
    }

    const timeline = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const topActions = Object.entries(byAction)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const entityDistribution = Object.entries(byEntityType)
      .map(([entityType, count]) => ({ entityType, count }))
      .sort((a, b) => b.count - a.count);

    return successResponse(res, {
      timeline,
      topActions,
      entityDistribution,
      total: activities.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client statistics
 */
const getClientStats = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;

    const clients = await prisma.client.findMany({
      where: { tenantId },
      select: {
        type: true,
        createdAt: true,
        _count: { select: { folders: true } },
      },
    });

    const byType = { INDIVIDUAL: 0, COMPANY: 0 };
    let totalFolders = 0;

    for (const client of clients) {
      byType[client.type]++;
      totalFolders += client._count.folders;
    }

    // New clients this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newThisMonth = clients.filter(c => new Date(c.createdAt) >= monthStart).length;

    return successResponse(res, {
      total: clients.length,
      individuals: byType.INDIVIDUAL,
      companies: byType.COMPANY,
      totalFolders,
      avgFoldersPerClient: clients.length > 0 ? Math.round(totalFolders / clients.length * 10) / 10 : 0,
      newThisMonth,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDocumentStats,
  getFolderStats,
  getActivityStats,
  getClientStats,
};
