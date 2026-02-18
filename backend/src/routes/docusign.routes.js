const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse } = require('../utils/response');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const docusignService = require('../services/docusign.service');
const storageService = require('../services/storage.service');
const logger = require('../config/logger');

// ============================================================================
// OAUTH2 FLOW
// ============================================================================

/**
 * GET /api/integrations/docusign/auth-url
 * Returns the OAuth2 authorization URL
 */
router.get('/auth-url', authenticate, enforceTenant, async (req, res, next) => {
  try {
    const state = req.tenant.id;
    const url = docusignService.getAuthorizationUrl(state);
    return successResponse(res, { url });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/docusign/callback
 * OAuth2 callback — exchanges code for tokens
 */
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) throw new BadRequestError('Missing authorization code');

    const tokens = await docusignService.exchangeCodeForToken(code);
    const userInfo = await docusignService.getUserInfo(tokens.accessToken);

    // Store tokens in TenantSettings (encrypted in real production)
    const tenantId = state; // state = tenantId
    if (tenantId) {
      await prisma.tenantSettings.upsert({
        where: { tenantId },
        update: {
          docusignAccessToken: tokens.accessToken,
          docusignRefreshToken: tokens.refreshToken,
          docusignAccountId: userInfo.accountId,
          docusignAccountName: userInfo.accountName || userInfo.email,
          docusignConnectedAt: new Date(),
        },
        create: {
          tenantId,
          docusignAccessToken: tokens.accessToken,
          docusignRefreshToken: tokens.refreshToken,
          docusignAccountId: userInfo.accountId,
          docusignAccountName: userInfo.accountName || userInfo.email,
          docusignConnectedAt: new Date(),
        },
      });
    }

    // Redirect to frontend integrations page
    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(`${frontendUrl}/parametres/integrations?docusign=connected`);
  } catch (error) {
    logger.error('DocuSign callback failed', { error: error.message });
    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(`${frontendUrl}/parametres/integrations?docusign=error`);
  }
});

/**
 * GET /api/integrations/docusign/status
 * Returns connection status
 */
router.get('/status', authenticate, enforceTenant, async (req, res, next) => {
  try {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: req.tenant.id },
    });

    const connected = !!(settings?.docusignAccessToken && settings?.docusignAccountId);

    return successResponse(res, {
      connected,
      accountName: settings?.docusignAccountName || null,
      connectedAt: settings?.docusignConnectedAt || null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/docusign/disconnect
 * Disconnects DocuSign
 */
router.post('/disconnect', authenticate, enforceTenant, async (req, res, next) => {
  try {
    await prisma.tenantSettings.update({
      where: { tenantId: req.tenant.id },
      data: {
        docusignAccessToken: null,
        docusignRefreshToken: null,
        docusignAccountId: null,
        docusignAccountName: null,
        docusignConnectedAt: null,
      },
    });

    return successResponse(res, null, 'DocuSign deconnecte');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SEND DOCUMENT FOR SIGNATURE
// ============================================================================

/**
 * POST /api/documents/:id/sign
 * Send a document for DocuSign signature
 */
router.post('/:id/sign', authenticate, enforceTenant, async (req, res, next) => {
  try {
    const { signers, subject, message, expiresAfterDays, ordreSignature } = req.body;

    if (!signers || !Array.isArray(signers) || signers.length === 0) {
      throw new BadRequestError('Au moins un signataire est requis');
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
      include: { folder: true },
    });
    if (!document) throw new NotFoundError('Document non trouve');

    // Get DocuSign tokens
    const isDemoMode = process.env.DOCUSIGN_DEMO_MODE === 'true';
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: req.tenant.id },
    });
    if (!isDemoMode && !settings?.docusignAccessToken) {
      throw new BadRequestError('DocuSign non connecte. Configurez l\'integration dans les parametres.');
    }

    // Download document from storage
    let documentBuffer;
    try {
      const fileData = await storageService.downloadFile(document.objectKey, false);
      documentBuffer = fileData.buffer || fileData;
    } catch (err) {
      throw new BadRequestError('Impossible de recuperer le document: ' + err.message);
    }

    // Set routing order based on signature order
    const orderedSigners = signers.map((s, i) => ({
      name: s.name,
      email: s.email,
      routingOrder: ordreSignature === 'sequentiel' ? i + 1 : 1,
    }));

    // Send envelope via DocuSign
    let result;
    try {
      result = await docusignService.sendEnvelope(settings.docusignAccessToken, {
        documentBuffer,
        documentName: document.name,
        signers: orderedSigners,
        subject: subject || `Signature requise : ${document.name}`,
        message,
        expiresAfterDays: expiresAfterDays || 7,
      });
    } catch (err) {
      // Try refreshing token and retry
      if (settings.docusignRefreshToken) {
        try {
          const newTokens = await docusignService.refreshAccessToken(settings.docusignRefreshToken);
          await prisma.tenantSettings.update({
            where: { tenantId: req.tenant.id },
            data: {
              docusignAccessToken: newTokens.accessToken,
              docusignRefreshToken: newTokens.refreshToken,
            },
          });
          result = await docusignService.sendEnvelope(newTokens.accessToken, {
            documentBuffer,
            documentName: document.name,
            signers: orderedSigners,
            subject: subject || `Signature requise : ${document.name}`,
            message,
            expiresAfterDays: expiresAfterDays || 7,
          });
        } catch (refreshErr) {
          throw new BadRequestError('Erreur DocuSign: ' + refreshErr.message);
        }
      } else {
        throw new BadRequestError('Erreur DocuSign: ' + err.message);
      }
    }

    // Create SignatureRequest record
    const sigRequest = await prisma.signatureRequest.create({
      data: {
        folderId: document.folderId,
        documentId: document.id,
        docusignEnvelopeId: result.envelopeId,
        signataires: signers.map((s, i) => ({
          nom: s.name,
          email: s.email,
          ordre: ordreSignature === 'sequentiel' ? i + 1 : 1,
          status: 'en_attente',
        })),
        ordreSignature: ordreSignature || 'parallele',
        dateExpiration: expiresAfterDays
          ? new Date(Date.now() + expiresAfterDays * 86400000)
          : new Date(Date.now() + 7 * 86400000),
        messagePersonnalise: message || null,
        statut: 'envoye',
        sentAt: new Date(),
      },
    });

    // Update document status
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'PENDING_SIGNATURE',
        docusignEnvelopeId: result.envelopeId,
        docusignStatus: 'sent',
        docusignSentAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_SENT',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        metadata: {
          envelopeId: result.envelopeId,
          signers: signers.map(s => s.email),
          ordreSignature,
        },
      },
    });

    logger.info('Document sent for DocuSign signature', {
      documentId: document.id,
      envelopeId: result.envelopeId,
      signersCount: signers.length,
    });

    return successResponse(res, {
      signatureRequestId: sigRequest.id,
      envelopeId: result.envelopeId,
      status: 'envoye',
    }, 'Document envoye a la signature', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SEND DOCUMENT VIA REGISTERED MAIL
// ============================================================================

/**
 * POST /api/documents/:id/send-registered
 * Estimate cost for registered mail
 */
router.post('/:id/send-registered', authenticate, enforceTenant, async (req, res, next) => {
  try {
    const { recipientPersonId, type } = req.body;

    if (!type || !['LR', 'LRAR'].includes(type)) {
      throw new BadRequestError('Type doit etre LR ou LRAR');
    }

    const document = await prisma.document.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
      include: { folder: { include: { persons: true } } },
    });
    if (!document) throw new NotFoundError('Document non trouve');

    // Find recipient
    let recipient = null;
    if (recipientPersonId && document.folder?.persons) {
      recipient = document.folder.persons.find(p => p.id === recipientPersonId);
    }
    if (!recipient) {
      throw new BadRequestError('Destinataire non trouve dans les personnes du dossier');
    }

    // Validate address
    if (!recipient.address || !recipient.city || !recipient.postalCode) {
      throw new BadRequestError('Adresse incomplete pour le destinataire. Veuillez renseigner l\'adresse, la ville et le code postal.');
    }

    // Estimated costs (approximate)
    const costs = {
      LR: 4.50,
      LRAR: 5.80,
    };

    return successResponse(res, {
      recipient: {
        id: recipient.id,
        name: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.companyName,
        address: recipient.address,
        postalCode: recipient.postalCode,
        city: recipient.city,
        country: recipient.country || 'FR',
      },
      type,
      estimatedCost: costs[type],
      addressValid: true,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/:id/send-registered/confirm
 * Actually send the registered mail
 */
router.post('/:id/send-registered/confirm', authenticate, enforceTenant, async (req, res, next) => {
  try {
    const { recipientPersonId, type } = req.body;
    const sendingBoxService = require('../services/sendingbox.service');

    if (!type || !['LR', 'LRAR'].includes(type)) {
      throw new BadRequestError('Type doit etre LR ou LRAR');
    }

    const document = await prisma.document.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
      include: { folder: { include: { persons: true } } },
    });
    if (!document) throw new NotFoundError('Document non trouve');

    // Find recipient
    let recipient = null;
    if (recipientPersonId && document.folder?.persons) {
      recipient = document.folder.persons.find(p => p.id === recipientPersonId);
    }
    if (!recipient) throw new BadRequestError('Destinataire non trouve');

    if (!recipient.address || !recipient.city || !recipient.postalCode) {
      throw new BadRequestError('Adresse incomplete');
    }

    // Download document
    let documentBuffer;
    try {
      const fileData = await storageService.downloadFile(document.objectKey, false);
      documentBuffer = fileData.buffer || fileData;
    } catch {
      throw new BadRequestError('Impossible de recuperer le document');
    }

    // Generate a temporary URL for SendingBox
    const tempUrl = await storageService.generatePresignedUrl(document.objectKey);

    // Send via SendingBox
    const result = await sendingBoxService.sendRegisteredMail(
      { url: tempUrl, buffer: documentBuffer },
      {
        name: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.companyName,
        address: recipient.address,
        postalCode: recipient.postalCode,
        city: recipient.city,
        country: recipient.country || 'FR',
      }
    );

    // Create RegisteredMail record
    const registeredMail = await prisma.registeredMail.create({
      data: {
        documentId: document.id,
        recipientName: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.companyName,
        recipientAddress: recipient.address,
        recipientCity: recipient.city,
        recipientPostalCode: recipient.postalCode,
        recipientCountry: recipient.country || 'FR',
        sendingBoxId: result.sendingBoxId,
        trackingNumber: result.trackingNumber,
        status: 'SENT',
        sentAt: new Date(),
        cost: result.cost,
      },
    });

    // Update document status
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'SENT',
        sendingboxTrackingId: result.trackingNumber || result.sendingBoxId,
        sendingboxStatus: 'sent',
        sendingboxSentAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'LRAR_SENT',
        entityType: 'Document',
        entityId: document.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        metadata: {
          type,
          recipientName: registeredMail.recipientName,
          trackingNumber: result.trackingNumber,
          cost: result.cost,
        },
      },
    });

    logger.info('Registered mail sent', {
      documentId: document.id,
      type,
      trackingNumber: result.trackingNumber,
    });

    return successResponse(res, {
      registeredMailId: registeredMail.id,
      trackingNumber: result.trackingNumber,
      status: 'SENT',
      cost: result.cost,
    }, `${type} envoye avec succes`, 201);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
