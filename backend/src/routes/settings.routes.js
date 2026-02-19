const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse } = require('../utils/response');
const { ForbiddenError } = require('../utils/errors');
const { omitSensitiveFields } = require('../utils/helpers');
const multer = require('multer');
const storageService = require('../services/storage.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG and SVG images are allowed'));
    }
  },
});

router.use(authenticate);
router.use(enforceTenant);

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can manage settings');
  }
  next();
};

// GET /api/settings — Get full cabinet settings (tenant + tenantSettings)
router.get('/', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
    });

    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: req.tenant.id },
    });

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: { tenantId: req.tenant.id },
      });
    }

    return successResponse(res, {
      tenant: omitSensitiveFields(tenant),
      settings,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/tenant — Update tenant info (ADMIN only)
router.put('/tenant', requireAdmin, async (req, res, next) => {
  try {
    const {
      name, legalName, siret, address, postalCode, city, country,
      phone, email, website, toque, barreau, primaryColor,
    } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: req.tenant.id },
      data: {
        ...(name !== undefined && { name }),
        ...(legalName !== undefined && { legalName }),
        ...(siret !== undefined && { siret }),
        ...(address !== undefined && { address }),
        ...(postalCode !== undefined && { postalCode }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(toque !== undefined && { toque }),
        ...(barreau !== undefined && { barreau }),
        ...(primaryColor !== undefined && { primaryColor }),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'TENANT_UPDATED',
        entityType: 'Tenant',
        entityId: tenant.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: req.body,
      },
    });

    return successResponse(res, omitSensitiveFields(tenant), 'Tenant info updated');
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/preferences — Update tenant settings/preferences (ADMIN only)
router.put('/preferences', requireAdmin, async (req, res, next) => {
  try {
    const {
      enableReminders, reminderSchedule, maxReminders,
      reminderDelay1, reminderDelay2, reminderDelay3, reminderNotify,
      defaultSignatureDeadlineDays,
      emailFromName, emailReplyTo, emailSignature,
      documentRetentionYears, autoArchiveClosedFolders, autoArchiveAfterDays,
      enforceStrongPasswords, sessionTimeoutMinutes, require2FA,
      allowClientUpload, clientUploadMaxSizeMB,
    } = req.body;

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: req.tenant.id },
      update: {
        ...(enableReminders !== undefined && { enableReminders }),
        ...(reminderSchedule !== undefined && { reminderSchedule }),
        ...(maxReminders !== undefined && { maxReminders }),
        ...(reminderDelay1 !== undefined && { reminderDelay1 }),
        ...(reminderDelay2 !== undefined && { reminderDelay2 }),
        ...(reminderDelay3 !== undefined && { reminderDelay3 }),
        ...(reminderNotify !== undefined && { reminderNotify }),
        ...(defaultSignatureDeadlineDays !== undefined && { defaultSignatureDeadlineDays }),
        ...(emailFromName !== undefined && { emailFromName }),
        ...(emailReplyTo !== undefined && { emailReplyTo }),
        ...(emailSignature !== undefined && { emailSignature }),
        ...(documentRetentionYears !== undefined && { documentRetentionYears }),
        ...(autoArchiveClosedFolders !== undefined && { autoArchiveClosedFolders }),
        ...(autoArchiveAfterDays !== undefined && { autoArchiveAfterDays }),
        ...(enforceStrongPasswords !== undefined && { enforceStrongPasswords }),
        ...(sessionTimeoutMinutes !== undefined && { sessionTimeoutMinutes }),
        ...(require2FA !== undefined && { require2FA }),
        ...(allowClientUpload !== undefined && { allowClientUpload }),
        ...(clientUploadMaxSizeMB !== undefined && { clientUploadMaxSizeMB }),
      },
      create: {
        tenantId: req.tenant.id,
        ...(enableReminders !== undefined && { enableReminders }),
        ...(reminderSchedule !== undefined && { reminderSchedule }),
        ...(maxReminders !== undefined && { maxReminders }),
        ...(reminderDelay1 !== undefined && { reminderDelay1 }),
        ...(reminderDelay2 !== undefined && { reminderDelay2 }),
        ...(reminderDelay3 !== undefined && { reminderDelay3 }),
        ...(reminderNotify !== undefined && { reminderNotify }),
        ...(emailFromName !== undefined && { emailFromName }),
        ...(emailReplyTo !== undefined && { emailReplyTo }),
        ...(emailSignature !== undefined && { emailSignature }),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'SETTINGS_UPDATED',
        entityType: 'TenantSettings',
        entityId: settings.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: req.body,
      },
    });

    return successResponse(res, settings, 'Settings updated');
  } catch (error) {
    next(error);
  }
});

// POST /api/settings/logo — Upload logo (ADMIN only)
router.post('/logo', requireAdmin, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    }

    const ext = req.file.mimetype === 'image/svg+xml' ? 'svg' : req.file.mimetype.split('/')[1];
    const objectKey = `${req.tenant.id}/logo/cabinet-logo-${Date.now()}.${ext}`;
    await storageService.uploadFile(req.file.buffer, objectKey, {}, false);

    // Delete old logo if exists
    const currentTenant = await prisma.tenant.findUnique({ where: { id: req.tenant.id } });
    if (currentTenant.logo) {
      try { await storageService.deleteFile(currentTenant.logo); } catch (e) { /* ignore */ }
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.tenant.id },
      data: { logo: objectKey },
    });

    return successResponse(res, { logo: objectKey }, 'Logo uploaded');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/settings/logo — Remove logo (ADMIN only)
router.delete('/logo', requireAdmin, async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenant.id } });
    if (tenant.logo) {
      try { await storageService.deleteFile(tenant.logo); } catch (e) { /* ignore */ }
      await prisma.tenant.update({
        where: { id: req.tenant.id },
        data: { logo: null },
      });
    }
    return successResponse(res, null, 'Logo deleted');
  } catch (error) {
    next(error);
  }
});

// GET /api/settings/logo — Get logo URL
router.get('/logo', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenant.id } });
    if (!tenant?.logo) {
      return res.status(404).json({ success: false, error: { message: 'No logo found' } });
    }
    const url = await storageService.generatePresignedUrl(tenant.logo, 3600);
    return res.redirect(url);
  } catch (error) {
    next(error);
  }
});

// GET /api/settings/subscription — Get subscription info
router.get('/subscription', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
    });

    const [userCount, clientCount] = await Promise.all([
      prisma.user.count({ where: { tenantId: req.tenant.id } }),
      prisma.client.count({ where: { tenantId: req.tenant.id, deletedAt: null } }),
    ]);

    // Estimate storage used (sum of document sizes)
    const storageResult = await prisma.document.aggregate({
      where: { tenantId: req.tenant.id },
      _sum: { size: true },
    });
    const storageUsedBytes = Number(storageResult._sum.size || 0);

    return successResponse(res, {
      subscriptionTier: tenant.subscriptionTier || 'TRIAL',
      maxUsers: tenant.maxUsers || 5,
      maxClients: tenant.maxClients || 50,
      maxStorage: tenant.maxStorage || 1073741824, // 1GB default
      trialEndsAt: tenant.trialEndsAt,
      subscribedAt: tenant.subscribedAt,
      currentUsers: userCount,
      currentClients: clientCount,
      storageUsed: storageUsedBytes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
