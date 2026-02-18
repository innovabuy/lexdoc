/**
 * Document Request Routes
 *
 * Manage document requests to clients
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/helpers');
const logger = require('../config/logger');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// LIST DOCUMENT REQUESTS
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { folderId, status, priority, search } = req.query;

    const where = {
      tenantId: req.tenant.id,
      ...(folderId && { folderId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [requests, total] = await Promise.all([
      prisma.documentRequest.findMany({
        where,
        include: {
          folder: {
            select: { id: true, title: true, reference: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          responseDocument: {
            select: { id: true, name: true, originalName: true },
          },
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { priority: 'desc' }, // URGENT first
          { dueDate: 'asc' }, // Earliest due date first
        ],
        skip,
        take,
      }),
      prisma.documentRequest.count({ where }),
    ]);

    return paginatedResponse(res, requests, total, page, pageSize);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET REQUESTS BY FOLDER
// ============================================================================

router.get('/folder/:folderId', async (req, res, next) => {
  try {
    // Verify folder belongs to tenant
    const folder = await prisma.folder.findFirst({
      where: { id: req.params.folderId, tenantId: req.tenant.id },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    const requests = await prisma.documentRequest.findMany({
      where: {
        folderId: req.params.folderId,
        tenantId: req.tenant.id,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        responseDocument: {
          select: { id: true, name: true, originalName: true, createdAt: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return successResponse(res, requests);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SINGLE REQUEST
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const request = await prisma.documentRequest.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
      },
      include: {
        folder: {
          select: { id: true, title: true, reference: true, client: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        responseDocument: true,
      },
    });

    if (!request) {
      throw new NotFoundError('Document request not found');
    }

    return successResponse(res, request);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CREATE REQUEST
// ============================================================================

router.post('/', async (req, res, next) => {
  try {
    const { folderId, title, description, priority, dueDate } = req.body;

    if (!folderId) {
      throw new BadRequestError('Folder ID is required');
    }

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    // Verify folder belongs to tenant
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId: req.tenant.id },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    const request = await prisma.documentRequest.create({
      data: {
        folderId,
        title: title.trim(),
        description,
        priority: priority || 'NORMAL',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user.id,
        tenantId: req.tenant.id,
      },
      include: {
        folder: {
          select: { id: true, title: true, reference: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_REQUEST_CREATED',
        entityType: 'DocumentRequest',
        entityId: request.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        metadata: { folderId, title },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info('Document request created', {
      requestId: request.id,
      folderId,
      userId: req.user.id,
    });

    return successResponse(res, request, 'Document request created', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE REQUEST
// ============================================================================

router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    const existing = await prisma.documentRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Document request not found');
    }

    const request = await prisma.documentRequest.update({
      where: { id: req.params.id },
      data: {
        title: title?.trim() || existing.title,
        description: description !== undefined ? description : existing.description,
        priority: priority || existing.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
        status: status || existing.status,
      },
      include: {
        folder: {
          select: { id: true, title: true, reference: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        responseDocument: true,
      },
    });

    return successResponse(res, request, 'Document request updated');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COMPLETE REQUEST (Link response document)
// ============================================================================

router.post('/:id/complete', async (req, res, next) => {
  try {
    const { responseDocumentId, responseNotes } = req.body;

    const existing = await prisma.documentRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Document request not found');
    }

    if (existing.status === 'COMPLETED') {
      throw new BadRequestError('Request is already completed');
    }

    // Verify document belongs to tenant if provided
    if (responseDocumentId) {
      const document = await prisma.document.findFirst({
        where: { id: responseDocumentId, tenantId: req.tenant.id },
      });
      if (!document) {
        throw new NotFoundError('Response document not found');
      }
    }

    const request = await prisma.documentRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        responseDocumentId: responseDocumentId || null,
        responseDate: new Date(),
        responseNotes,
      },
      include: {
        folder: {
          select: { id: true, title: true, reference: true },
        },
        responseDocument: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_REQUEST_COMPLETED',
        entityType: 'DocumentRequest',
        entityId: request.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        metadata: { responseDocumentId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, request, 'Document request completed');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CANCEL REQUEST
// ============================================================================

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const existing = await prisma.documentRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Document request not found');
    }

    if (existing.status === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel a completed request');
    }

    const request = await prisma.documentRequest.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    return successResponse(res, request, 'Document request cancelled');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SEND REMINDER
// ============================================================================

router.post('/:id/remind', async (req, res, next) => {
  try {
    const existing = await prisma.documentRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        folder: {
          include: { client: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Document request not found');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestError('Can only remind for pending requests');
    }

    // Update reminder count
    const request = await prisma.documentRequest.update({
      where: { id: req.params.id },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });

    // Send email reminder to client
    try {
      const folder = existing.folder;
      const client = folder?.client;
      if (client?.email) {
        const emailService = require('../services/email.service');
        await emailService.sendDocumentRequestReminder({
          to: client.email,
          clientName: client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim(),
          requestTitle: existing.title,
          folderTitle: folder.title,
          dueDate: existing.dueDate ? new Date(existing.dueDate).toLocaleDateString('fr-FR') : null,
          reminderCount: request.reminderCount,
          tenantName: req.tenant.name,
        });
      }
    } catch (emailErr) {
      logger.warn('Failed to send document request reminder email', { error: emailErr.message });
    }

    logger.info('Document request reminder sent', {
      requestId: request.id,
      reminderCount: request.reminderCount,
    });

    return successResponse(res, request, 'Reminder sent');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE REQUEST
// ============================================================================

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.documentRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Document request not found');
    }

    await prisma.documentRequest.delete({
      where: { id: req.params.id },
    });

    return successResponse(res, null, 'Document request deleted');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATS
// ============================================================================

router.get('/stats/summary', async (req, res, next) => {
  try {
    const { folderId } = req.query;

    const where = {
      tenantId: req.tenant.id,
      ...(folderId && { folderId }),
    };

    const [total, pending, completed, cancelled, overdue] = await Promise.all([
      prisma.documentRequest.count({ where }),
      prisma.documentRequest.count({ where: { ...where, status: 'PENDING' } }),
      prisma.documentRequest.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.documentRequest.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.documentRequest.count({
        where: {
          ...where,
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return successResponse(res, {
      total,
      pending,
      completed,
      cancelled,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
