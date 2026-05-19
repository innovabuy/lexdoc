const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const logger = require('../config/logger');
const crypto = require('crypto');

// ============================================================================
// UNIVERSIGN WEBHOOK
// ============================================================================

/**
 * Universign webhook endpoint for signature status updates
 * POST /api/webhooks/universign
 *
 * DÉSACTIVÉ 2026-05-19 — LexDoc utilise DocuSign uniquement.
 * Universign n'est plus un provider actif. Le handler retourne 410 Gone.
 * Code original conservé en commentaire pour rollback rapide ; suppression
 * définitive en backlog post-démo Pragmavox.
 */
router.post('/universign', (req, res) => {
  logger.warn('Universign webhook called but provider is deactivated', {
    bodyKeys: Object.keys(req.body || {}),
  });
  return res.status(410).json({ error: 'Universign provider has been deactivated. Use DocuSign instead.' });
});

/* ORIGINAL HANDLER — kept for rollback only
router.post('/universign', async (req, res) => {
  try {
    const {
      transactionId,
      status,
      signers,
      signedDocumentUrl,
      certificateUrl,
      timestamp,
    } = req.body;

    logger.info('Universign webhook received', { transactionId, status });

    // Verify webhook signature if configured
    const webhookSecret = process.env.UNIVERSIGN_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-universign-signature'];
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Universign webhook signature mismatch', { transactionId });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Find signature by transactionId
    const signature = await prisma.signature.findUnique({
      where: { transactionId },
      include: {
        document: {
          include: { tracking: true },
        },
      },
    });

    if (!signature) {
      logger.warn('Universign webhook: Transaction not found', { transactionId });
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Map Universign status to our SignatureStatus enum
    const statusMap = {
      pending: 'PENDING',
      ready: 'PENDING',
      signed: 'SIGNED',
      completed: 'SIGNED',
      refused: 'REFUSED',
      cancelled: 'CANCELLED',
      expired: 'EXPIRED',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'PENDING';

    // Update signature
    await prisma.signature.update({
      where: { id: signature.id },
      data: {
        status: mappedStatus,
        ...(mappedStatus === 'SIGNED' && { signedAt: new Date() }),
        ...(mappedStatus === 'REFUSED' && { refusedAt: new Date() }),
        ...(mappedStatus === 'EXPIRED' && { expiredAt: new Date() }),
        ...(certificateUrl && { certificateUrl }),
      },
    });

    // Update document tracking if exists
    if (signature.document?.tracking) {
      const allSignatures = await prisma.signature.findMany({
        where: { documentId: signature.documentId },
      });

      const allSigned = allSignatures.every(s => s.status === 'SIGNED' || s.id === signature.id && mappedStatus === 'SIGNED');
      const anySigned = allSignatures.some(s => s.status === 'SIGNED') || mappedStatus === 'SIGNED';

      await prisma.documentTracking.update({
        where: { id: signature.document.tracking.id },
        data: {
          signatureStatus: mappedStatus,
          ...(mappedStatus === 'SIGNED' && {
            signedAt: new Date(),
            signedBy: { push: signature.signerEmail },
          }),
          ...(allSigned && { status: 'SIGNED' }),
        },
      });

      // Update document status if all signed
      if (allSigned) {
        await prisma.document.update({
          where: { id: signature.documentId },
          data: { status: 'SIGNED' },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: `SIGNATURE_${mappedStatus}`,
        entityType: 'Signature',
        entityId: signature.id,
        tenantId: signature.document.tenantId,
        metadata: {
          transactionId,
          signerEmail: signature.signerEmail,
          webhookStatus: status,
        },
      },
    });

    logger.info('Universign webhook processed', {
      transactionId,
      signatureId: signature.id,
      newStatus: mappedStatus,
    });

    return res.json({ received: true, status: mappedStatus });
  } catch (error) {
    logger.error('Universign webhook error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});
*/

// ============================================================================
// SENDINGBOX WEBHOOK
// ============================================================================

/**
 * SendingBox webhook endpoint for LRAR status updates
 * POST /api/webhooks/sendingbox
 */
router.post('/sendingbox', async (req, res) => {
  try {
    const {
      id: letterId,
      status,
      trackingNumber,
      deliveredAt,
      returnedAt,
      proofUrl,
      events,
      timestamp,
    } = req.body;

    logger.info('SendingBox webhook received', { letterId, status, trackingNumber });

    // Verify webhook signature if configured
    const webhookSecret = process.env.SENDINGBOX_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-sendingbox-signature'];
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('SendingBox webhook signature mismatch', { letterId });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Find registered mail by sendingBoxId
    const registeredMail = await prisma.registeredMail.findUnique({
      where: { sendingBoxId: letterId },
      include: {
        document: {
          include: { tracking: true },
        },
      },
    });

    if (!registeredMail) {
      // Try finding by tracking number
      const mailByTracking = await prisma.registeredMail.findUnique({
        where: { trackingNumber },
        include: {
          document: {
            include: { tracking: true },
          },
        },
      });

      if (!mailByTracking) {
        logger.warn('SendingBox webhook: Shipment not found', { letterId, trackingNumber });
        return res.status(404).json({ error: 'Shipment not found' });
      }
    }

    const mail = registeredMail || (await prisma.registeredMail.findUnique({
      where: { trackingNumber },
      include: { document: { include: { tracking: true } } },
    }));

    // Map SendingBox status to our RegisteredMailStatus enum
    const statusMap = {
      preparing: 'PREPARING',
      created: 'PREPARING',
      sent: 'SENT',
      in_transit: 'IN_TRANSIT',
      delivered: 'DELIVERED',
      returned: 'RETURNED',
      error: 'ERROR',
      failed: 'ERROR',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'PREPARING';

    // Update registered mail
    await prisma.registeredMail.update({
      where: { id: mail.id },
      data: {
        status: mappedStatus,
        ...(trackingNumber && { trackingNumber }),
        ...(mappedStatus === 'SENT' && { sentAt: new Date() }),
        ...(mappedStatus === 'DELIVERED' && { deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date() }),
        ...(mappedStatus === 'RETURNED' && { returnedAt: returnedAt ? new Date(returnedAt) : new Date() }),
        ...(proofUrl && { proofUrl }),
      },
    });

    // Update document tracking if exists
    if (mail.document?.tracking) {
      await prisma.documentTracking.update({
        where: { id: mail.document.tracking.id },
        data: {
          lrarStatus: mappedStatus,
          ...(trackingNumber && { lrarTrackingNumber: trackingNumber }),
          ...(mappedStatus === 'SENT' && { sentAt: new Date() }),
          ...(mappedStatus === 'DELIVERED' && {
            deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
            status: 'DELIVERED',
          }),
        },
      });

      // Update document status if delivered
      if (mappedStatus === 'DELIVERED') {
        await prisma.document.update({
          where: { id: mail.documentId },
          data: { status: 'SENT' },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: `LRAR_${mappedStatus}`,
        entityType: 'RegisteredMail',
        entityId: mail.id,
        tenantId: mail.document.tenantId,
        metadata: {
          letterId,
          trackingNumber,
          webhookStatus: status,
          events,
        },
      },
    });

    logger.info('SendingBox webhook processed', {
      letterId,
      registeredMailId: mail.id,
      newStatus: mappedStatus,
    });

    return res.json({ received: true, status: mappedStatus });
  } catch (error) {
    logger.error('SendingBox webhook error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

// ============================================================================
// DOCUSIGN WEBHOOK
// ============================================================================

/**
 * DocuSign webhook endpoint (Connect)
 * POST /api/webhooks/docusign
 */
router.post('/docusign', async (req, res) => {
  try {
    // DocuSign sends XML by default, but can send JSON via Connect
    const body = req.body;

    // Handle both XML (DocuSignEnvelopeInformation) and JSON formats
    let envelopeId, envelopeStatus, recipients;

    if (body.EnvelopeStatus || body.envelopeId) {
      // JSON format
      envelopeId = body.envelopeId || body.EnvelopeStatus?.EnvelopeID;
      envelopeStatus = body.status || body.EnvelopeStatus?.Status;
      recipients = body.recipients || [];
    } else {
      // Minimal fallback
      envelopeId = body.envelopeId || body.envelope_id;
      envelopeStatus = body.status || body.envelope_status;
    }

    logger.info('DocuSign webhook received', { envelopeId, envelopeStatus });

    if (!envelopeId) {
      return res.status(400).json({ error: 'Missing envelopeId' });
    }

    // Find SignatureRequest by docusignEnvelopeId
    const sigRequest = await prisma.signatureRequest.findFirst({
      where: { docusignEnvelopeId: envelopeId },
      include: {
        document: { include: { tracking: true } },
      },
    });

    if (!sigRequest) {
      logger.warn('DocuSign webhook: Envelope not found', { envelopeId });
      // Still return 200 to prevent DocuSign from retrying
      return res.json({ received: true, message: 'Envelope not found' });
    }

    // Map DocuSign status
    const statusMap = {
      completed: 'signe',
      declined: 'annule',
      voided: 'annule',
      sent: 'envoye',
      delivered: 'envoye',
    };

    const newStatus = statusMap[(envelopeStatus || '').toLowerCase()] || sigRequest.statut;

    // Update SignatureRequest
    const updateData = { statut: newStatus };
    if (newStatus === 'signe') {
      updateData.completedAt = new Date();
      // Update signataires to all signed
      if (sigRequest.signataires && Array.isArray(sigRequest.signataires)) {
        updateData.signataires = sigRequest.signataires.map(s => ({ ...s, status: 'signe' }));
      }
    }
    if (newStatus === 'annule') {
      if (sigRequest.signataires && Array.isArray(sigRequest.signataires)) {
        updateData.signataires = sigRequest.signataires.map(s => ({ ...s, status: 'refuse' }));
      }
    }

    await prisma.signatureRequest.update({
      where: { id: sigRequest.id },
      data: updateData,
    });

    // Update document status
    if (newStatus === 'signe') {
      await prisma.document.update({
        where: { id: sigRequest.documentId },
        data: {
          status: 'SIGNED',
          docusignStatus: 'completed',
          docusignSignedAt: new Date(),
        },
      });

      // Download signed document and store it
      try {
        const settings = await prisma.tenantSettings.findUnique({
          where: { tenantId: sigRequest.document.tenantId },
        });
        if (settings?.docusignAccessToken) {
          const docusignService = require('../services/docusign.service');
          const signedBuffer = await docusignService.downloadSignedDocument(
            settings.docusignAccessToken,
            envelopeId
          );
          // Store as new version
          const storageKey = `signed/${sigRequest.documentId}_signed_${Date.now()}.pdf`;
          const storageService = require('../services/storage.service');
          await storageService.uploadFile(storageKey, signedBuffer, 'application/pdf', false);
          logger.info('Signed document stored', { storageKey });
        }
      } catch (dlErr) {
        logger.error('Failed to download/store signed document', { error: dlErr.message });
      }
    } else if (newStatus === 'annule') {
      await prisma.document.update({
        where: { id: sigRequest.documentId },
        data: {
          status: 'DRAFT',
          docusignStatus: (envelopeStatus || '').toLowerCase(),
        },
      });
    }

    // Update DocumentTracking if exists
    if (sigRequest.document?.tracking) {
      const trackingUpdate = {};
      if (newStatus === 'signe') {
        trackingUpdate.status = 'SIGNED';
        trackingUpdate.signatureStatus = 'SIGNED';
        trackingUpdate.signedAt = new Date();
      } else if (newStatus === 'annule') {
        trackingUpdate.signatureStatus = 'CANCELLED';
      }
      if (Object.keys(trackingUpdate).length > 0) {
        await prisma.documentTracking.update({
          where: { id: sigRequest.document.tracking.id },
          data: trackingUpdate,
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: `DOCUSIGN_${(envelopeStatus || 'unknown').toUpperCase()}`,
        entityType: 'SignatureRequest',
        entityId: sigRequest.id,
        tenantId: sigRequest.document.tenantId,
        metadata: {
          envelopeId,
          envelopeStatus,
        },
      },
    });

    logger.info('DocuSign webhook processed', {
      envelopeId,
      signatureRequestId: sigRequest.id,
      newStatus,
    });

    return res.json({ received: true, status: newStatus });
  } catch (error) {
    logger.error('DocuSign webhook error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

/**
 * GET /api/webhooks/docusign — verification endpoint
 */
router.get('/docusign', (req, res) => {
  const challenge = req.query.challenge || req.query['hub.challenge'];
  if (challenge) return res.send(challenge);
  return res.json({ status: 'DocuSign webhook endpoint ready' });
});

// ============================================================================
// WEBHOOK VERIFICATION ENDPOINTS
// ============================================================================

/**
 * Verification endpoint for Universign webhook setup
 * GET /api/webhooks/universign
 *
 * DÉSACTIVÉ 2026-05-19 — voir POST /universign ci-dessus.
 */
router.get('/universign', (req, res) => {
  return res.status(410).json({ error: 'Universign provider has been deactivated. Use DocuSign instead.' });
});

/**
 * Verification endpoint for SendingBox webhook setup
 * GET /api/webhooks/sendingbox
 */
router.get('/sendingbox', (req, res) => {
  const challenge = req.query.challenge || req.query['hub.challenge'];
  if (challenge) {
    return res.send(challenge);
  }
  return res.json({ status: 'SendingBox webhook endpoint ready' });
});

module.exports = router;
