const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse } = require('../utils/response');

/**
 * GET /api/integrations/sendingbox/status
 */
router.get('/status', authenticate, enforceTenant, async (req, res, next) => {
  try {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: req.tenant.id },
    });

    const connected = !!(settings?.sendingboxApiKey);
    const maskedKey = settings?.sendingboxApiKey
      ? '••••••••••••' + settings.sendingboxApiKey.slice(-4)
      : '';

    return successResponse(res, { connected, maskedKey });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/integrations/sendingbox
 * Save API key
 */
router.put('/', authenticate, enforceTenant, async (req, res, next) => {
  try {
    const { apiKey } = req.body;

    await prisma.tenantSettings.upsert({
      where: { tenantId: req.tenant.id },
      update: {
        sendingboxApiKey: apiKey,
        sendingboxConnectedAt: new Date(),
      },
      create: {
        tenantId: req.tenant.id,
        sendingboxApiKey: apiKey,
        sendingboxConnectedAt: new Date(),
      },
    });

    return successResponse(res, null, 'Cle API sauvegardee');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
