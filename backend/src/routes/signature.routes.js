const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const universignService = require('../services/universign.service');
const storageService = require('../services/storage.service');
const emailService = require('../services/email.service');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// SIGNATURE MANAGEMENT
// ============================================================================

/**
 * List all signatures for tenant
 * GET /api/signatures
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

    const [signatures, total] = await Promise.all([
      prisma.signature.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          document: { select: { id: true, name: true, status: true } },
          reminders: { orderBy: { sentAt: 'desc' }, take: 3 },
        },
      }),
      prisma.signature.count({ where }),
    ]);

    return paginatedResponse(res, signatures.map(s => omitSensitiveFields(s)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

/**
 * Get signature by ID
 * GET /api/signatures/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
      include: {
        document: true,
        reminders: { orderBy: { sentAt: 'desc' } },
      },
    });

    if (!signature) {
      throw new NotFoundError('Signature not found');
    }

    return successResponse(res, omitSensitiveFields(signature));
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new signature request (send to Universign)
 * POST /api/signatures
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      documentId,
      signers, // Array of { email, firstName, lastName, signerType }
    } = req.body;

    // Validate required fields
    if (!documentId || !signers || !Array.isArray(signers) || signers.length === 0) {
      throw new BadRequestError('Missing required fields: documentId, signers array');
    }

    // Validate signers
    for (const signer of signers) {
      if (!signer.email || !signer.firstName || !signer.lastName) {
        throw new BadRequestError('Each signer must have email, firstName, and lastName');
      }
    }

    // Find and validate document
    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId: req.tenant.id },
      include: { folder: { include: { client: true } } },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // DÉSACTIVÉ 2026-05-19 — Universign n'est plus le provider de signature.
    // Utiliser POST /api/documents/:id/sign (DocuSign) à la place.
    throw new BadRequestError('Universign provider has been deactivated. Use POST /api/documents/:id/sign (DocuSign) instead.');

    // Generate presigned URL for Universign
    // eslint-disable-next-line no-unreachable
    const documentUrl = await storageService.generatePresignedUrl(document.objectKey, 3600);

    // Create signature transaction with Universign
    let universignResult;
    try {
      universignResult = await universignService.createTransaction(documentUrl, signers);
    } catch (universignError) {
      throw new BadRequestError(`Universign error: ${universignError.message}`);
    }

    // Create signature records for each signer
    const createdSignatures = [];
    for (const signer of signers) {
      // Find the signature URL for this signer
      const signerUrl = universignResult.signatureUrls?.find(s => s.email === signer.email);

      const signature = await prisma.signature.create({
        data: {
          documentId,
          signerEmail: signer.email,
          signerName: `${signer.firstName} ${signer.lastName}`,
          signerType: signer.signerType || 'CLIENT',
          transactionId: universignResult.transactionId,
          signatureUrl: signerUrl?.url,
          status: 'PENDING',
          invitedAt: new Date(),
        },
      });
      createdSignatures.push(signature);
    }

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PENDING_SIGNATURE',
        requiresSignature: true,
      },
    });

    // Create or update document tracking
    await prisma.documentTracking.upsert({
      where: { documentId },
      update: {
        status: 'PENDING_SIGNATURE',
        deliveryMethod: 'SIGNATURE_ELECTRONIQUE',
        signatureRequestId: universignResult.transactionId,
        signatureStatus: 'PENDING',
      },
      create: {
        documentId,
        status: 'PENDING_SIGNATURE',
        deliveryMethod: 'SIGNATURE_ELECTRONIQUE',
        signatureRequestId: universignResult.transactionId,
        signatureStatus: 'PENDING',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_REQUEST_CREATED',
        entityType: 'Signature',
        entityId: createdSignatures[0]?.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          documentId,
          transactionId: universignResult.transactionId,
          signers: signers.map(s => s.email),
        },
      },
    });

    return successResponse(
      res,
      {
        transactionId: universignResult.transactionId,
        signatures: createdSignatures.map(s => omitSensitiveFields(s)),
        signatureUrls: universignResult.signatureUrls,
      },
      'Signature request created',
      201
    );
  } catch (error) {
    next(error);
  }
});

/**
 * Get signature status from Universign
 * GET /api/signatures/:id/status
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
    });

    if (!signature) {
      throw new NotFoundError('Signature not found');
    }

    if (!signature.transactionId) {
      throw new BadRequestError('No transaction ID available');
    }

    // DÉSACTIVÉ 2026-05-19 — Universign désactivé, status non récupérable.
    throw new BadRequestError('Universign provider has been deactivated. Live status not available.');

    // Get live status from Universign
    // eslint-disable-next-line no-unreachable
    const universignStatus = await universignService.getTransactionStatus(signature.transactionId);

    // Map status
    const statusMap = {
      pending: 'PENDING',
      ready: 'PENDING',
      signed: 'SIGNED',
      completed: 'SIGNED',
      refused: 'REFUSED',
      cancelled: 'CANCELLED',
      expired: 'EXPIRED',
    };

    const mappedStatus = statusMap[universignStatus.status?.toLowerCase()] || 'PENDING';

    // Update local record if status changed
    if (mappedStatus !== signature.status) {
      await prisma.signature.update({
        where: { id: signature.id },
        data: {
          status: mappedStatus,
          ...(mappedStatus === 'SIGNED' && { signedAt: new Date() }),
          ...(universignStatus.certificateUrl && { certificateUrl: universignStatus.certificateUrl }),
        },
      });
    }

    return successResponse(res, {
      signatureId: signature.id,
      currentStatus: mappedStatus,
      liveStatus: universignStatus,
      signedDocumentUrl: universignStatus.signedDocumentUrl,
      certificate: universignStatus.certificate,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Resend signature invitation
 * POST /api/signatures/:id/resend
 */
router.post('/:id/resend', async (req, res, next) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
      include: { document: true },
    });

    if (!signature) {
      throw new NotFoundError('Signature not found');
    }

    if (signature.status !== 'PENDING') {
      throw new BadRequestError('Can only resend invitations for pending signatures');
    }

    // Create reminder record
    const reminderCount = await prisma.signatureReminder.count({
      where: { signatureId: signature.id },
    });

    await prisma.signatureReminder.create({
      data: {
        signatureId: signature.id,
        reminderNumber: reminderCount + 1,
        sentAt: new Date(),
        emailSent: true,
        smsSent: false,
      },
    });

    // Send reminder email
    try {
      await emailService.sendSignatureReminder(signature, signature.document, reminderCount + 1);
    } catch (emailError) {
      // Log but don't fail the reminder if email sending fails
      console.error('Failed to send signature reminder email:', emailError.message);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_REMINDER_SENT',
        entityType: 'Signature',
        entityId: signature.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          signerEmail: signature.signerEmail,
          reminderNumber: reminderCount + 1,
        },
      },
    });

    return successResponse(res, { remindersSent: reminderCount + 1 }, 'Reminder sent');
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel signature request
 * DELETE /api/signatures/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
      },
    });

    if (!signature) {
      throw new NotFoundError('Signature not found');
    }

    if (signature.status === 'SIGNED') {
      throw new BadRequestError('Cannot cancel a completed signature');
    }

    // Update status to cancelled
    await prisma.signature.update({
      where: { id: signature.id },
      data: { status: 'CANCELLED' },
    });

    // Check if all signatures for document are cancelled
    const remainingPending = await prisma.signature.count({
      where: {
        documentId: signature.documentId,
        status: 'PENDING',
      },
    });

    if (remainingPending === 0) {
      // Update document status back to draft
      await prisma.document.update({
        where: { id: signature.documentId },
        data: {
          status: 'DRAFT',
          requiresSignature: false,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_CANCELLED',
        entityType: 'Signature',
        entityId: signature.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, null, 'Signature request cancelled');
  } catch (error) {
    next(error);
  }
});

/**
 * Get signature statistics
 * GET /api/signatures/stats
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const [total, pending, signed, refused, expired, cancelled] = await Promise.all([
      prisma.signature.count({
        where: { document: { tenantId: req.tenant.id } },
      }),
      prisma.signature.count({
        where: { document: { tenantId: req.tenant.id }, status: 'PENDING' },
      }),
      prisma.signature.count({
        where: { document: { tenantId: req.tenant.id }, status: 'SIGNED' },
      }),
      prisma.signature.count({
        where: { document: { tenantId: req.tenant.id }, status: 'REFUSED' },
      }),
      prisma.signature.count({
        where: { document: { tenantId: req.tenant.id }, status: 'EXPIRED' },
      }),
      prisma.signature.count({
        where: { document: { tenantId: req.tenant.id }, status: 'CANCELLED' },
      }),
    ]);

    return successResponse(res, {
      total,
      pending,
      signed,
      refused,
      expired,
      cancelled,
      completionRate: total > 0 ? ((signed / total) * 100).toFixed(1) : 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Download signed document
 * GET /api/signatures/:id/download
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
        status: 'SIGNED',
      },
    });

    if (!signature) {
      throw new NotFoundError('Signed document not found');
    }

    if (!signature.transactionId) {
      throw new BadRequestError('No transaction ID available');
    }

    // DÉSACTIVÉ 2026-05-19 — Universign désactivé, redirect non disponible.
    throw new BadRequestError('Universign provider has been deactivated. Signed document download via Universign unavailable.');

    // Get signed document URL from Universign
    // eslint-disable-next-line no-unreachable
    const universignStatus = await universignService.getTransactionStatus(signature.transactionId);

    if (!universignStatus.signedDocumentUrl) {
      throw new NotFoundError('Signed document not yet available');
    }

    return res.redirect(universignStatus.signedDocumentUrl);
  } catch (error) {
    next(error);
  }
});

/**
 * Download signature certificate
 * GET /api/signatures/:id/certificate
 */
router.get('/:id/certificate', async (req, res, next) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: {
        id: req.params.id,
        document: { tenantId: req.tenant.id },
        status: 'SIGNED',
      },
    });

    if (!signature) {
      throw new NotFoundError('Signed document not found');
    }

    if (signature.certificateUrl) {
      return res.redirect(signature.certificateUrl);
    }

    // DÉSACTIVÉ 2026-05-19 — Universign désactivé, certificate live fetch non disponible.
    throw new NotFoundError('Certificate not stored locally and Universign provider has been deactivated.');

    // Try to get certificate from Universign
    // eslint-disable-next-line no-unreachable
    if (signature.transactionId) {
      const universignStatus = await universignService.getTransactionStatus(signature.transactionId);
      if (universignStatus.certificate) {
        // Update local record
        await prisma.signature.update({
          where: { id: signature.id },
          data: { certificateUrl: universignStatus.certificate },
        });
        return res.redirect(universignStatus.certificate);
      }
    }

    throw new NotFoundError('Signature certificate not available');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
