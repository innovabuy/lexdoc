const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { omitSensitiveFields } = require('../utils/helpers');
const multer = require('multer');
const storageService = require('../services/storage.service');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPEG images are allowed'));
    }
  },
});

router.use(authenticate);
router.use(enforceTenant);

// Only ADMIN can manage legal info
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can manage legal information');
  }
  next();
};

// Get legal info for current tenant
router.get('/', async (req, res, next) => {
  try {
    let legalInfo = await prisma.avocatLegalInfo.findUnique({
      where: { tenantId: req.tenant.id },
    });

    if (!legalInfo) {
      // Create default entry if none exists
      legalInfo = await prisma.avocatLegalInfo.create({
        data: { tenantId: req.tenant.id },
      });
    }

    return successResponse(res, omitSensitiveFields(legalInfo));
  } catch (error) {
    next(error);
  }
});

// Update legal info
router.put('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      numeroToque,
      barreau,
      specialites,
      rcs,
      tvaIntra,
      assuranceRC,
      numeroPolice,
      mentionsLegales,
    } = req.body;

    // Parse specialites if string
    const parsedSpecialites = typeof specialites === 'string'
      ? specialites.split(',').map(s => s.trim()).filter(Boolean)
      : (specialites || []);

    const legalInfo = await prisma.avocatLegalInfo.upsert({
      where: { tenantId: req.tenant.id },
      update: {
        numeroToque,
        barreau,
        specialites: parsedSpecialites,
        rcs,
        tvaIntra,
        assuranceRC,
        numeroPolice,
        mentionsLegales,
      },
      create: {
        tenantId: req.tenant.id,
        numeroToque,
        barreau,
        specialites: parsedSpecialites,
        rcs,
        tvaIntra,
        assuranceRC,
        numeroPolice,
        mentionsLegales,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'LEGAL_INFO_UPDATED',
        entityType: 'AvocatLegalInfo',
        entityId: legalInfo.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: { numeroToque, barreau, specialites: parsedSpecialites, rcs, tvaIntra },
      },
    });

    return successResponse(res, omitSensitiveFields(legalInfo), 'Legal information updated');
  } catch (error) {
    next(error);
  }
});

// Upload signature image
router.post('/signature', requireAdmin, upload.single('signature'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    }

    const objectKey = `${req.tenant.id}/legal/signature-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    await storageService.uploadFile(req.file.buffer, objectKey, {}, false); // No encryption for images

    const legalInfo = await prisma.avocatLegalInfo.upsert({
      where: { tenantId: req.tenant.id },
      update: { signaturePath: objectKey },
      create: { tenantId: req.tenant.id, signaturePath: objectKey },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SIGNATURE_UPLOADED',
        entityType: 'AvocatLegalInfo',
        entityId: legalInfo.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, { signaturePath: objectKey }, 'Signature uploaded');
  } catch (error) {
    next(error);
  }
});

// Upload cachet (stamp) image
router.post('/cachet', requireAdmin, upload.single('cachet'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    }

    const objectKey = `${req.tenant.id}/legal/cachet-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    await storageService.uploadFile(req.file.buffer, objectKey, {}, false); // No encryption for images

    const legalInfo = await prisma.avocatLegalInfo.upsert({
      where: { tenantId: req.tenant.id },
      update: { cachetPath: objectKey },
      create: { tenantId: req.tenant.id, cachetPath: objectKey },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CACHET_UPLOADED',
        entityType: 'AvocatLegalInfo',
        entityId: legalInfo.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, { cachetPath: objectKey }, 'Stamp uploaded');
  } catch (error) {
    next(error);
  }
});

// Get signature image
router.get('/signature', async (req, res, next) => {
  try {
    const legalInfo = await prisma.avocatLegalInfo.findUnique({
      where: { tenantId: req.tenant.id },
    });

    if (!legalInfo?.signaturePath) {
      return res.status(404).json({ success: false, error: { message: 'No signature found' } });
    }

    const url = await storageService.generatePresignedUrl(legalInfo.signaturePath, 3600);
    return res.redirect(url);
  } catch (error) {
    next(error);
  }
});

// Get cachet image
router.get('/cachet', async (req, res, next) => {
  try {
    const legalInfo = await prisma.avocatLegalInfo.findUnique({
      where: { tenantId: req.tenant.id },
    });

    if (!legalInfo?.cachetPath) {
      return res.status(404).json({ success: false, error: { message: 'No cachet found' } });
    }

    const url = await storageService.generatePresignedUrl(legalInfo.cachetPath, 3600);
    return res.redirect(url);
  } catch (error) {
    next(error);
  }
});

// Delete signature
router.delete('/signature', requireAdmin, async (req, res, next) => {
  try {
    const legalInfo = await prisma.avocatLegalInfo.findUnique({
      where: { tenantId: req.tenant.id },
    });

    if (legalInfo?.signaturePath) {
      await storageService.deleteFile(legalInfo.signaturePath);
      await prisma.avocatLegalInfo.update({
        where: { tenantId: req.tenant.id },
        data: { signaturePath: null },
      });
    }

    return successResponse(res, null, 'Signature deleted');
  } catch (error) {
    next(error);
  }
});

// Delete cachet
router.delete('/cachet', requireAdmin, async (req, res, next) => {
  try {
    const legalInfo = await prisma.avocatLegalInfo.findUnique({
      where: { tenantId: req.tenant.id },
    });

    if (legalInfo?.cachetPath) {
      await storageService.deleteFile(legalInfo.cachetPath);
      await prisma.avocatLegalInfo.update({
        where: { tenantId: req.tenant.id },
        data: { cachetPath: null },
      });
    }

    return successResponse(res, null, 'Stamp deleted');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
