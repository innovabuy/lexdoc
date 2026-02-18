const prisma = require('../config/database');
const { successResponse } = require('../utils/response');

/**
 * Global search across documents, folders, and clients
 */
const globalSearch = async (req, res, next) => {
  try {
    const { q, types } = req.query;
    const tenantId = req.tenant.id;

    if (!q || q.length < 2) {
      return successResponse(res, { documents: [], folders: [], clients: [] });
    }

    const searchTypes = types ? types.split(',') : ['documents', 'folders', 'clients'];
    const results = {};

    // Search Documents
    if (searchTypes.includes('documents')) {
      results.documents = await prisma.document.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { originalName: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          mimeType: true,
          createdAt: true,
          folder: { select: { id: true, title: true } },
        },
      });
    }

    // Search Folders
    if (searchTypes.includes('folders')) {
      results.folders = await prisma.folder.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { reference: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          reference: true,
          type: true,
          status: true,
          color: true,
          client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        },
      });
    }

    // Search Clients
    if (searchTypes.includes('clients')) {
      results.clients = await prisma.client.findMany({
        where: {
          tenantId,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { companyName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          type: true,
        },
      });
    }

    return successResponse(res, results);
  } catch (error) {
    next(error);
  }
};

/**
 * Advanced search with multiple filters
 */
const advancedSearch = async (req, res, next) => {
  try {
    const {
      q,
      entityType,
      status,
      type,
      dateFrom,
      dateTo,
      folderId,
      clientId,
      tags,
      page = 1,
      pageSize = 20,
    } = req.query;

    const tenantId = req.tenant.id;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    let results = [];
    let total = 0;

    if (entityType === 'document' || !entityType) {
      const where = {
        tenantId,
        deletedAt: null,
      };

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { originalName: { contains: q, mode: 'insensitive' } },
        ];
      }
      if (status) where.status = status;
      if (type) where.type = type;
      if (folderId) where.folderId = folderId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }
      if (tags) {
        const tagArray = tags.split(',').map(t => t.trim());
        where.tags = { hasSome: tagArray };
      }

      const [docs, count] = await Promise.all([
        prisma.document.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            folder: { select: { id: true, title: true, reference: true } },
          },
        }),
        prisma.document.count({ where }),
      ]);

      results = docs.map(d => ({ ...d, entityType: 'document' }));
      total = count;
    }

    if (entityType === 'folder') {
      const where = { tenantId };

      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { reference: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
      if (status) where.status = status;
      if (type) where.type = type;
      if (clientId) where.clientId = clientId;
      if (dateFrom || dateTo) {
        where.openedAt = {};
        if (dateFrom) where.openedAt.gte = new Date(dateFrom);
        if (dateTo) where.openedAt.lte = new Date(dateTo);
      }

      const [folders, count] = await Promise.all([
        prisma.folder.findMany({
          where,
          skip,
          take,
          orderBy: { openedAt: 'desc' },
          include: {
            client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
            _count: { select: { documents: true } },
          },
        }),
        prisma.folder.count({ where }),
      ]);

      results = folders.map(f => ({ ...f, entityType: 'folder' }));
      total = count;
    }

    if (entityType === 'client') {
      const where = { tenantId };

      if (q) {
        where.OR = [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { companyName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }
      if (type) where.type = type;

      const [clients, count] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { folders: true } },
          },
        }),
        prisma.client.count({ where }),
      ]);

      results = clients.map(c => ({ ...c, entityType: 'client' }));
      total = count;
    }

    return res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        pages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
  advancedSearch,
};
