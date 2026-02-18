const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const sendingBoxService = require('../services/sendingbox.service');
const storageService = require('../services/storage.service');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// LRAR MANAGEMENT
// ============================================================================

/**
 * List all LRAR shipments for tenant
 * GET /api/lrar
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { status, documentId } = req.query;

    const where = {
      document: { tenantId: req.tenant.id },
    };

    if (status) where.status = status;
    if (documentId) where.documentId = documentId;

    const [shipments, total] = await Promise.all([
      prisma.registeredMail.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          document: {
            select: { id: true, name: true, type: true },
          },
        },
      }),
      prisma.registeredMail.count({ where }),
    ]);

    return paginatedResponse(res, shipments.map(s => omitSensitiveFields(s)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

/**
 * Get LRAR shipment by ID
 * GET /api/lrar/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const shipment = await prisma.registeredMail.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
      include: {
        document: {
          select: { id: true, name: true, type: true, status: true },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundError('LRAR shipment not found');
    }

    return successResponse(res, omitSensitiveFields(shipment));
  } catch (error) {
    next(error);
  }
});

/**
 * Create and send a new LRAR
 * POST /api/lrar
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      documentId,
      recipientName,
      recipientAddress,
      recipientCity,
      recipientPostalCode,
      recipientCountry = 'FR',
    } = req.body;

    // Validate required fields
    if (!documentId || !recipientName || !recipientAddress || !recipientCity || !recipientPostalCode) {
      throw new BadRequestError('Missing required fields: documentId, recipientName, recipientAddress, recipientCity, recipientPostalCode');
    }

    // Find and validate document
    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId: req.tenant.id },
      include: { folder: true },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Generate presigned URL for SendingBox
    const documentUrl = await storageService.generatePresignedUrl(document.objectKey, 3600);

    // Create LRAR record
    const registeredMail = await prisma.registeredMail.create({
      data: {
        documentId,
        recipientName,
        recipientAddress,
        recipientCity,
        recipientPostalCode,
        recipientCountry,
        status: 'PREPARING',
      },
    });

    // Send via SendingBox
    try {
      const sendingBoxResult = await sendingBoxService.sendRegisteredMail(
        { url: documentUrl },
        {
          name: recipientName,
          address: recipientAddress,
          postalCode: recipientPostalCode,
          city: recipientCity,
          country: recipientCountry,
        }
      );

      // Update with SendingBox response
      await prisma.registeredMail.update({
        where: { id: registeredMail.id },
        data: {
          sendingBoxId: sendingBoxResult.sendingBoxId,
          trackingNumber: sendingBoxResult.trackingNumber,
          cost: sendingBoxResult.cost,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Update or create document tracking
      await prisma.documentTracking.upsert({
        where: { documentId },
        update: {
          deliveryMethod: 'LRAR',
          lrarTrackingNumber: sendingBoxResult.trackingNumber,
          lrarStatus: 'SENT',
          sentAt: new Date(),
          status: 'PENDING_DELIVERY',
        },
        create: {
          documentId,
          deliveryMethod: 'LRAR',
          lrarTrackingNumber: sendingBoxResult.trackingNumber,
          lrarStatus: 'SENT',
          sentAt: new Date(),
          status: 'PENDING_DELIVERY',
        },
      });

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'SENT' },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'LRAR_SENT',
          entityType: 'RegisteredMail',
          entityId: registeredMail.id,
          userId: req.user.id,
          tenantId: req.tenant.id,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            documentId,
            recipientName,
            recipientCity,
            trackingNumber: sendingBoxResult.trackingNumber,
          },
        },
      });

      const updatedMail = await prisma.registeredMail.findUnique({
        where: { id: registeredMail.id },
        include: {
          document: { select: { id: true, name: true } },
        },
      });

      return successResponse(res, omitSensitiveFields(updatedMail), 'LRAR sent successfully', 201);
    } catch (sendingError) {
      // Update status to error
      await prisma.registeredMail.update({
        where: { id: registeredMail.id },
        data: { status: 'ERROR' },
      });

      throw new BadRequestError(`SendingBox error: ${sendingError.message}`);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Get tracking status from SendingBox
 * GET /api/lrar/:id/tracking
 */
router.get('/:id/tracking', async (req, res, next) => {
  try {
    const shipment = await prisma.registeredMail.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
    });

    if (!shipment) {
      throw new NotFoundError('LRAR shipment not found');
    }

    if (!shipment.trackingNumber) {
      throw new BadRequestError('No tracking number available');
    }

    // Get live status from SendingBox
    const trackingStatus = await sendingBoxService.getTrackingStatus(shipment.trackingNumber);

    // Update local record
    const statusMap = {
      preparing: 'PREPARING',
      sent: 'SENT',
      in_transit: 'IN_TRANSIT',
      delivered: 'DELIVERED',
      returned: 'RETURNED',
      error: 'ERROR',
    };

    const mappedStatus = statusMap[trackingStatus.status?.toLowerCase()] || shipment.status;

    if (mappedStatus !== shipment.status) {
      await prisma.registeredMail.update({
        where: { id: shipment.id },
        data: {
          status: mappedStatus,
          ...(mappedStatus === 'DELIVERED' && { deliveredAt: trackingStatus.deliveredAt }),
          ...(trackingStatus.proofUrl && { proofUrl: trackingStatus.proofUrl }),
        },
      });
    }

    return successResponse(res, {
      trackingNumber: shipment.trackingNumber,
      currentStatus: mappedStatus,
      liveStatus: trackingStatus,
      deliveredAt: trackingStatus.deliveredAt,
      proofUrl: trackingStatus.proofUrl,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel LRAR (only if not yet sent)
 * DELETE /api/lrar/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const shipment = await prisma.registeredMail.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
    });

    if (!shipment) {
      throw new NotFoundError('LRAR shipment not found');
    }

    if (shipment.status !== 'PREPARING') {
      throw new BadRequestError('Cannot cancel LRAR that has already been sent');
    }

    await prisma.registeredMail.delete({
      where: { id: shipment.id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'LRAR_CANCELLED',
        entityType: 'RegisteredMail',
        entityId: shipment.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, null, 'LRAR cancelled');
  } catch (error) {
    next(error);
  }
});

/**
 * Get download proof URL
 * GET /api/lrar/:id/proof
 */
router.get('/:id/proof', async (req, res, next) => {
  try {
    const shipment = await prisma.registeredMail.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
    });

    if (!shipment) {
      throw new NotFoundError('LRAR shipment not found');
    }

    if (!shipment.proofUrl) {
      // Try to get proof from SendingBox
      if (shipment.trackingNumber) {
        const trackingStatus = await sendingBoxService.getTrackingStatus(shipment.trackingNumber);
        if (trackingStatus.proofUrl) {
          await prisma.registeredMail.update({
            where: { id: shipment.id },
            data: { proofUrl: trackingStatus.proofUrl },
          });
          return res.redirect(trackingStatus.proofUrl);
        }
      }
      throw new NotFoundError('Delivery proof not yet available');
    }

    return res.redirect(shipment.proofUrl);
  } catch (error) {
    next(error);
  }
});

/**
 * Get LRAR statistics
 * GET /api/lrar/stats
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const [total, preparing, sent, inTransit, delivered, returned, errored] = await Promise.all([
      prisma.registeredMail.count({
        where: { document: { tenantId: req.tenant.id } },
      }),
      prisma.registeredMail.count({
        where: { document: { tenantId: req.tenant.id }, status: 'PREPARING' },
      }),
      prisma.registeredMail.count({
        where: { document: { tenantId: req.tenant.id }, status: 'SENT' },
      }),
      prisma.registeredMail.count({
        where: { document: { tenantId: req.tenant.id }, status: 'IN_TRANSIT' },
      }),
      prisma.registeredMail.count({
        where: { document: { tenantId: req.tenant.id }, status: 'DELIVERED' },
      }),
      prisma.registeredMail.count({
        where: { document: { tenantId: req.tenant.id }, status: 'RETURNED' },
      }),
      prisma.registeredMail.count({
        where: { document: { tenantId: req.tenant.id }, status: 'ERROR' },
      }),
    ]);

    return successResponse(res, {
      total,
      preparing,
      sent,
      inTransit,
      delivered,
      returned,
      errored,
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : 0,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
