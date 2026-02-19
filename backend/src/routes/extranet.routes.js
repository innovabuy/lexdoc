const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const emailService = require('../services/email.service');

const { authenticate: authenticateCabinet } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const notificationService = require('../services/notification.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXTRANET_EXPIRES_IN || '30d';

// Middleware to authenticate client access
const authenticateClient = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'client') {
      throw new UnauthorizedError('Invalid token type');
    }

    const access = await prisma.clientAccess.findUnique({
      where: { id: decoded.accessId },
      include: {
        folder: {
          include: {
            client: true,
            tenant: true,
          },
        },
      },
    });

    if (!access || !access.isActivated) {
      throw new UnauthorizedError('Access not found or not activated');
    }

    req.clientAccess = access;
    req.folder = access.folder;
    req.tenant = access.folder.tenant;

    // Log access
    await prisma.clientAccessLog.create({
      data: {
        accessId: access.id,
        action: 'API_REQUEST',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

// ============================================================================
// PUBLIC ROUTES (no auth required)
// ============================================================================

// Activate account (set password)
router.post('/activate', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new BadRequestError('Token and password are required');
    }

    if (password.length < 12) {
      throw new BadRequestError('Le mot de passe doit contenir au moins 12 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestError('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestError('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestError('Le mot de passe doit contenir au moins un chiffre');
    }

    const access = await prisma.clientAccess.findFirst({
      where: {
        activationToken: token,
        tokenExpiresAt: { gt: new Date() },
        isActivated: false,
      },
      include: {
        folder: { include: { client: true } },
      },
    });

    if (!access) {
      throw new NotFoundError('Invalid or expired activation token');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Activate the primary access (the one matching the token)
    await prisma.clientAccess.update({
      where: { id: access.id },
      data: {
        passwordHash,
        isActivated: true,
        activationToken: null,
        tokenExpiresAt: null,
      },
    });

    // Also activate all other pending accesses for the same email (multi-folder)
    await prisma.clientAccess.updateMany({
      where: {
        email: access.email,
        isActivated: false,
        id: { not: access.id },
      },
      data: {
        passwordHash,
        isActivated: true,
        activationToken: null,
        tokenExpiresAt: null,
      },
    });

    // Log activation
    await prisma.clientAccessLog.create({
      data: {
        accessId: access.id,
        action: 'ACCOUNT_ACTIVATED',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    // Generate JWT so client is logged in immediately
    const jwtToken = jwt.sign(
      {
        accessId: access.id,
        folderId: access.folderId,
        email: access.email,
        type: 'client',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const client = access.folder.client;
    return successResponse(res, {
      token: jwtToken,
      email: access.email,
      clientId: client?.id,
      profileCompletionPercent: client?.profileCompletionPercent || 0,
    }, 'Account activated successfully');
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const access = await prisma.clientAccess.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        isActivated: true,
      },
      include: {
        folder: {
          include: {
            client: true,
            tenant: { select: { id: true, name: true, logo: true, primaryColor: true } },
          },
        },
      },
    });

    if (!access || !access.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password.trim(), access.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await prisma.clientAccess.update({
      where: { id: access.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login
    await prisma.clientAccessLog.create({
      data: {
        accessId: access.id,
        action: 'LOGIN',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    // Generate token
    const token = jwt.sign(
      {
        accessId: access.id,
        folderId: access.folderId,
        email: access.email,
        type: 'client',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return successResponse(res, {
      token,
      access: {
        id: access.id,
        email: access.email,
        folder: {
          id: access.folder.id,
          reference: access.folder.reference,
          title: access.folder.title,
        },
        client: access.folder.client
          ? {
              firstName: access.folder.client.firstName,
              lastName: access.folder.client.lastName,
              companyName: access.folder.client.companyName,
            }
          : null,
        tenant: access.folder.tenant,
        profileCompletionPercent: access.folder.client?.profileCompletionPercent || 0,
        profileSubmittedAt: access.folder.client?.profileSubmittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Check token validity
router.get('/verify-token/:token', async (req, res, next) => {
  try {
    const access = await prisma.clientAccess.findFirst({
      where: {
        activationToken: req.params.token,
        tokenExpiresAt: { gt: new Date() },
        isActivated: false,
      },
      include: {
        folder: {
          include: {
            client: true,
            tenant: { select: { name: true, logo: true, primaryColor: true } },
          },
        },
      },
    });

    if (!access) {
      return res.status(404).json({ success: false, valid: false, error: { message: 'Invalid or expired token' } });
    }

    return successResponse(res, {
      valid: true,
      email: access.email,
      folderTitle: access.folder.title,
      clientName: access.folder.client?.companyName ||
        `${access.folder.client?.firstName || ''} ${access.folder.client?.lastName || ''}`.trim(),
      tenant: access.folder.tenant,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PROTECTED ROUTES (client auth required)
// ============================================================================

// Get current client info
router.get('/me', authenticateClient, async (req, res, next) => {
  try {
    const access = req.clientAccess;

    return successResponse(res, {
      id: access.id,
      email: access.email,
      lastLoginAt: access.lastLoginAt,
      folder: {
        id: access.folder.id,
        reference: access.folder.reference,
        title: access.folder.title,
        description: access.folder.description,
        status: access.folder.status,
      },
      client: access.folder.client
        ? {
            firstName: access.folder.client.firstName,
            lastName: access.folder.client.lastName,
            companyName: access.folder.client.companyName,
            email: access.folder.client.email,
          }
        : null,
      tenant: {
        name: access.folder.tenant.name,
        logo: access.folder.tenant.logo,
        primaryColor: access.folder.tenant.primaryColor,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get dashboard stats
router.get('/dashboard', authenticateClient, async (req, res, next) => {
  try {
    const folderId = req.folder.id;

    const [totalDocuments, pendingSignature, signed, pendingRequests, recentDocuments, recentRequests] = await Promise.all([
      prisma.document.count({
        where: { folderId, deletedAt: null },
      }),
      prisma.document.count({
        where: { folderId, deletedAt: null, status: 'PENDING_SIGNATURE' },
      }),
      prisma.document.count({
        where: { folderId, deletedAt: null, status: 'SIGNED' },
      }),
      prisma.documentRequest.count({
        where: { folderId, status: 'PENDING' },
      }),
      prisma.document.findMany({
        where: { folderId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          createdAt: true,
          requiresSignature: true,
        },
      }),
      prisma.documentRequest.findMany({
        where: { folderId, status: 'PENDING' },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          dueDate: true,
          createdAt: true,
        },
      }),
    ]);

    return successResponse(res, {
      stats: {
        totalDocuments,
        pendingSignature,
        signed,
        pendingRequests,
      },
      recentDocuments: recentDocuments.map((d) => omitSensitiveFields(d)),
      pendingRequests: recentRequests,
    });
  } catch (error) {
    next(error);
  }
});

// List documents in folder
router.get('/documents', authenticateClient, async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { status, type, search } = req.query;
    const folderId = req.folder.id;

    const where = { folderId, deletedAt: null };

    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          mimeType: true,
          status: true,
          createdAt: true,
          requiresSignature: true,
          signatureDeadline: true,
          signatures: {
            select: {
              id: true,
              signerEmail: true,
              status: true,
              signedAt: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return paginatedResponse(res, documents.map((d) => omitSensitiveFields(d)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get document details
router.get('/documents/:id', authenticateClient, async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        folderId: req.folder.id,
        deletedAt: null,
      },
      include: {
        signatures: {
          orderBy: { createdAt: 'desc' },
          include: {
            reminders: {
              orderBy: { sentAt: 'desc' },
            },
          },
        },
        registeredMails: {
          orderBy: { createdAt: 'desc' },
        },
        tracking: {
          include: {
            reminders: {
              orderBy: { sentAt: 'desc' },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Log document view
    await prisma.clientAccessLog.create({
      data: {
        accessId: req.clientAccess.id,
        action: `DOCUMENT_VIEW:${document.id}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    return successResponse(res, omitSensitiveFields(document));
  } catch (error) {
    next(error);
  }
});

// Get document download URL
router.get('/documents/:id/download', authenticateClient, async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        folderId: req.folder.id,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const storageService = require('../services/storage.service');
    const url = await storageService.generatePresignedUrl(document.objectKey);

    // Log download
    await prisma.clientAccessLog.create({
      data: {
        accessId: req.clientAccess.id,
        action: `DOCUMENT_DOWNLOAD:${document.id}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    return successResponse(res, { url, filename: document.originalName });
  } catch (error) {
    next(error);
  }
});

// Get activity log
router.get('/activity', authenticateClient, async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);

    const [logs, total] = await Promise.all([
      prisma.clientAccessLog.findMany({
        where: { accessId: req.clientAccess.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.clientAccessLog.count({
        where: { accessId: req.clientAccess.id },
      }),
    ]);

    return paginatedResponse(res, logs.map((l) => omitSensitiveFields(l)), { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DOCUMENT REQUESTS (Demandes de pièces)
// ============================================================================

// List document requests for client's folder
router.get('/document-requests', authenticateClient, async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { status } = req.query;
    const folderId = req.folder.id;

    const where = { folderId };
    if (status) {
      where.status = status;
    }

    const [requests, total, pendingCount] = await Promise.all([
      prisma.documentRequest.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          reminderCount: true,
          responseDocumentId: true,
          responseDate: true,
          responseNotes: true,
          responseDocument: {
            select: {
              id: true,
              name: true,
              originalName: true,
              createdAt: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.documentRequest.count({ where }),
      prisma.documentRequest.count({
        where: { folderId, status: 'PENDING' },
      }),
    ]);

    return paginatedResponse(res, requests, { page, pageSize, total, pendingCount });
  } catch (error) {
    next(error);
  }
});

// Get single document request
router.get('/document-requests/:id', authenticateClient, async (req, res, next) => {
  try {
    const request = await prisma.documentRequest.findFirst({
      where: {
        id: req.params.id,
        folderId: req.folder.id,
      },
      include: {
        responseDocument: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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

// Upload document in response to a request
router.post('/document-requests/:id/respond', authenticateClient, async (req, res, next) => {
  try {
    const multer = require('multer');
    const storageService = require('../services/storage.service');
    const crypto = require('crypto');

    // Configure multer for memory storage
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    }).single('file');

    upload(req, res, async (err) => {
      if (err) {
        return next(new BadRequestError(err.message));
      }

      if (!req.file) {
        return next(new BadRequestError('No file uploaded'));
      }

      // Verify request exists and is pending
      const request = await prisma.documentRequest.findFirst({
        where: {
          id: req.params.id,
          folderId: req.folder.id,
          status: 'PENDING',
        },
      });

      if (!request) {
        return next(new NotFoundError('Document request not found or already completed'));
      }

      // Generate checksum
      const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

      // Upload to storage
      const objectKey = `${req.tenant.id}/${req.folder.id}/responses/${Date.now()}-${req.file.originalname}`;
      await storageService.uploadFile(req.file.buffer, objectKey, req.file.mimetype);

      // Create document record
      const document = await prisma.document.create({
        data: {
          name: req.body.name || req.file.originalname,
          description: req.body.notes || `Réponse à la demande: ${request.title}`,
          type: 'OTHER',
          filename: objectKey.split('/').pop(),
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          checksum,
          bucketName: process.env.MINIO_BUCKET || 'lexdoc',
          objectKey,
          status: 'DRAFT',
          folderId: req.folder.id,
          createdById: req.folder.createdById, // Use folder creator as document creator
          tenantId: req.tenant.id,
        },
      });

      // Update request with response
      const updatedRequest = await prisma.documentRequest.update({
        where: { id: request.id },
        data: {
          status: 'COMPLETED',
          responseDocumentId: document.id,
          responseDate: new Date(),
          responseNotes: req.body.notes || null,
        },
        include: {
          responseDocument: {
            select: {
              id: true,
              name: true,
              originalName: true,
            },
          },
        },
      });

      // Log upload
      await prisma.clientAccessLog.create({
        data: {
          accessId: req.clientAccess.id,
          action: `DOCUMENT_UPLOAD:${document.id}`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        },
      });

      return successResponse(res, updatedRequest, 'Document uploaded successfully');
    });
  } catch (error) {
    next(error);
  }
});

// Add notes to a completed request
router.patch('/document-requests/:id/notes', authenticateClient, async (req, res, next) => {
  try {
    const { notes } = req.body;

    const request = await prisma.documentRequest.findFirst({
      where: {
        id: req.params.id,
        folderId: req.folder.id,
      },
    });

    if (!request) {
      throw new NotFoundError('Document request not found');
    }

    const updated = await prisma.documentRequest.update({
      where: { id: request.id },
      data: { responseNotes: notes },
    });

    return successResponse(res, updated);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DIRECT DOCUMENT UPLOAD
// ============================================================================

// Upload a document directly (not in response to a request)
router.post('/documents/upload', authenticateClient, async (req, res, next) => {
  try {
    const multer = require('multer');
    const storageService = require('../services/storage.service');

    // Configure multer for memory storage
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    }).single('file');

    upload(req, res, async (err) => {
      if (err) {
        return next(new BadRequestError(err.message));
      }

      if (!req.file) {
        return next(new BadRequestError('No file uploaded'));
      }

      // Generate checksum
      const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

      // Upload to storage
      const objectKey = `${req.tenant.id}/${req.folder.id}/client-uploads/${Date.now()}-${req.file.originalname}`;
      await storageService.uploadFile(req.file.buffer, objectKey, req.file.mimetype);

      // Create document record
      const document = await prisma.document.create({
        data: {
          name: req.body.name || req.file.originalname,
          description: req.body.description || 'Document envoyé par le client',
          type: req.body.type || 'OTHER',
          filename: objectKey.split('/').pop(),
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          checksum,
          bucketName: process.env.MINIO_BUCKET || 'lexdoc',
          objectKey,
          status: 'DRAFT',
          folderId: req.folder.id,
          createdById: req.folder.createdById,
          tenantId: req.tenant.id,
          tags: ['client-upload'],
        },
      });

      // Log upload
      await prisma.clientAccessLog.create({
        data: {
          accessId: req.clientAccess.id,
          action: `DOCUMENT_UPLOAD_DIRECT:${document.id}`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'CLIENT_DOCUMENT_UPLOADED',
          entityType: 'Document',
          entityId: document.id,
          tenantId: req.tenant.id,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          metadata: {
            clientEmail: req.clientAccess.email,
            folderId: req.folder.id,
            filename: req.file.originalname,
          },
        },
      });

      return successResponse(res, {
        id: document.id,
        name: document.name,
        originalName: document.originalName,
        type: document.type,
        size: document.size,
        createdAt: document.createdAt,
      }, 'Document uploaded successfully', 201);
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PASSWORD & SETTINGS
// ============================================================================

// Change password
router.post('/change-password', authenticateClient, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current and new password are required');
    }

    if (newPassword.length < 12) {
      throw new BadRequestError('Le mot de passe doit contenir au moins 12 caractères');
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw new BadRequestError('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(newPassword)) {
      throw new BadRequestError('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new BadRequestError('Le mot de passe doit contenir au moins un chiffre');
    }

    const access = await prisma.clientAccess.findUnique({
      where: { id: req.clientAccess.id },
    });

    const validPassword = await bcrypt.compare(currentPassword, access.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.clientAccess.update({
      where: { id: req.clientAccess.id },
      data: { passwordHash: newPasswordHash },
    });

    // Log password change
    await prisma.clientAccessLog.create({
      data: {
        accessId: req.clientAccess.id,
        action: 'PASSWORD_CHANGED',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PROFILE WIZARD ROUTES
// ============================================================================

const STEP_FIELDS = {
  1: {
    allowed: ['civilite', 'lastName', 'firstName', 'birthDate', 'lieuNaissance', 'departementNaissance', 'paysNaissance', 'nationalite', 'profession', 'secu'],
    required: ['civilite', 'lastName', 'firstName', 'birthDate'],
    label: 'Identité',
  },
  2: {
    allowed: ['address', 'addressLine2', 'postalCode', 'city', 'phone', 'adressePro', 'complementAdressePro', 'cpPro', 'villePro', 'telPro'],
    required: ['address', 'postalCode', 'city'],
    label: 'Coordonnées',
  },
  3: {
    allowed: ['situationFamiliale', 'conjointNom', 'conjointPrenom', 'conjointDateNaissance', 'conjointNationalite', 'conjointProfession', 'regimeMatrimonial', 'dateContratMariage', 'notaireMariage', 'nbEnfantsMineurs', 'nbEnfantsMajeurs'],
    required: ['situationFamiliale'],
    label: 'Situation familiale',
  },
  4: {
    allowed: ['pereNom', 'perePrenom', 'mereNomJeuneFille', 'merePrenom'],
    required: ['pereNom', 'mereNomJeuneFille'],
    label: 'Filiation',
  },
};

const DATE_FIELDS = ['birthDate', 'conjointDateNaissance', 'dateContratMariage'];
const INT_FIELDS = ['nbEnfantsMineurs', 'nbEnfantsMajeurs'];

function calculateProfileCompletion(client) {
  const allRequired = Object.values(STEP_FIELDS).flatMap((s) => s.required);
  const filled = allRequired.filter((f) => client[f] != null && String(client[f]).trim() !== '').length;
  return Math.round((filled / allRequired.length) * 100);
}

function getProfileMissingFields(client) {
  const missing = [];
  for (const [step, config] of Object.entries(STEP_FIELDS)) {
    for (const field of config.required) {
      if (!client[field] || String(client[field]).trim() === '') {
        missing.push({ step: parseInt(step), field, label: config.label });
      }
    }
  }
  return missing;
}

function getProfileCurrentStep(client) {
  for (const [step, config] of Object.entries(STEP_FIELDS)) {
    const allFilled = config.required.every((f) => client[f] != null && String(client[f]).trim() !== '');
    if (!allFilled) return parseInt(step);
  }
  return 5;
}

// Get full client profile
router.get('/me/profile', authenticateClient, async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.clientAccess.folder.clientId },
    });
    if (!client) throw new NotFoundError('Client not found');

    const safeClient = { ...client };
    delete safeClient.extranetPassword;
    delete safeClient.invitationToken;
    return successResponse(res, safeClient);
  } catch (error) {
    next(error);
  }
});

// Get profile completeness
router.get('/me/profile/completeness', authenticateClient, async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.clientAccess.folder.clientId },
    });
    if (!client) throw new NotFoundError('Client not found');

    const percent = calculateProfileCompletion(client);
    const missing = getProfileMissingFields(client);
    const step = getProfileCurrentStep(client);

    return successResponse(res, { percent, missing, step, profileLastStep: client.profileLastStep });
  } catch (error) {
    next(error);
  }
});

// Save profile step
router.patch('/me/profile/step/:step', authenticateClient, async (req, res, next) => {
  try {
    const step = parseInt(req.params.step);
    if (step < 1 || step > 4) throw new BadRequestError('Step must be between 1 and 4');

    const stepConfig = STEP_FIELDS[step];
    const clientId = req.clientAccess.folder.clientId;
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundError('Client not found');

    const updateData = {};
    for (const field of stepConfig.allowed) {
      if (req.body[field] !== undefined) {
        if (DATE_FIELDS.includes(field)) {
          updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (INT_FIELDS.includes(field)) {
          updateData[field] = req.body[field] != null ? parseInt(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field] === '' ? null : req.body[field];
        }
      }
    }

    const newStep = Math.max(client.profileLastStep || 0, step);
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { ...updateData, profileLastStep: newStep },
    });

    const percent = calculateProfileCompletion(updated);
    await prisma.client.update({
      where: { id: clientId },
      data: { profileCompletionPercent: percent },
    });

    // Timeline event
    await prisma.timelineEvent.create({
      data: {
        folderId: req.clientAccess.folderId,
        type: 'extranet_profile_step',
        description: `Client a complété l'étape ${stepConfig.label}`,
        metadata: { step, percent },
      },
    });

    // Notify cabinet users
    const tenantId = req.tenant.id;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true, role: { in: ['ADMIN', 'LAWYER'] } },
      select: { id: true },
    });

    const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';
    for (const user of users) {
      await notificationService.create({
        userId: user.id,
        tenantId,
        type: 'CLIENT_STEP_COMPLETED',
        title: 'Fiche client mise à jour',
        message: `${clientName} a complété l'étape "${stepConfig.label}" (${percent}%)`,
        entityType: 'Client',
        entityId: clientId,
        link: `/clients/${clientId}`,
        sendEmail: false,
      });
    }

    return successResponse(res, { step, percent, profileLastStep: newStep });
  } catch (error) {
    next(error);
  }
});

// Submit profile (final validation)
router.post('/me/profile/submit', authenticateClient, async (req, res, next) => {
  try {
    const clientId = req.clientAccess.folder.clientId;
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundError('Client not found');

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        profileSubmittedAt: new Date(),
        profileSubmittedVersion: (client.profileSubmittedVersion || 0) + 1,
        profileCompletionPercent: calculateProfileCompletion(client),
      },
    });

    // Cancel pending profile reminders
    await prisma.clientReminder.updateMany({
      where: { clientId, status: 'pending', type: 'profile_completion' },
      data: { status: 'cancelled' },
    });

    // Timeline event
    await prisma.timelineEvent.create({
      data: {
        folderId: req.clientAccess.folderId,
        type: 'extranet_profile_submitted',
        description: 'Client a soumis sa fiche complète',
        metadata: { version: updated.profileSubmittedVersion },
      },
    });

    // Notify cabinet users
    const tenantId = req.tenant.id;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true, role: { in: ['ADMIN', 'LAWYER'] } },
      select: { id: true },
    });

    const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';
    for (const user of users) {
      await notificationService.create({
        userId: user.id,
        tenantId,
        type: 'CLIENT_PROFILE_COMPLETE',
        title: 'Fiche client complète',
        message: `${clientName} a soumis sa fiche d'informations complète`,
        entityType: 'Client',
        entityId: clientId,
        link: `/clients/${clientId}`,
        sendEmail: true,
      });
    }

    return successResponse(res, { submitted: true, version: updated.profileSubmittedVersion });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MULTI-FOLDER ACCESS
// ============================================================================

// List all accessible folders for this client email
router.get('/me/folders', authenticateClient, async (req, res, next) => {
  try {
    const accesses = await prisma.clientAccess.findMany({
      where: {
        email: req.clientAccess.email,
        isActivated: true,
        folder: { tenantId: req.tenant.id, deletedAt: null },
      },
      include: {
        folder: {
          select: {
            id: true,
            reference: true,
            title: true,
            type: true,
            status: true,
            updatedAt: true,
            _count: {
              select: {
                documents: { where: { visibleExtranet: true, deletedAt: null } },
              },
            },
          },
        },
      },
    });

    const folders = accesses.map((a) => ({
      ...a.folder,
      documentCount: a.folder._count.documents,
    }));

    return successResponse(res, folders);
  } catch (error) {
    next(error);
  }
});

// Get documents in a specific folder (only visibleExtranet = true)
router.get('/me/folders/:folderId/documents', authenticateClient, async (req, res, next) => {
  try {
    const access = await prisma.clientAccess.findFirst({
      where: {
        email: req.clientAccess.email,
        folderId: req.params.folderId,
        isActivated: true,
      },
    });
    if (!access) throw new NotFoundError('Folder not found');

    const documents = await prisma.document.findMany({
      where: {
        folderId: req.params.folderId,
        visibleExtranet: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        mimeType: true,
        status: true,
        createdAt: true,
        originalName: true,
        size: true,
        signatures: {
          select: {
            id: true,
            signerEmail: true,
            signerName: true,
            signatureUrl: true,
            status: true,
          },
        },
      },
    });

    // Convert BigInt size to Number for JSON serialization
    const serializable = documents.map(d => ({
      ...d,
      size: d.size != null ? Number(d.size) : null,
      signatures: d.signatures || [],
    }));

    return successResponse(res, serializable);
  } catch (error) {
    next(error);
  }
});

// Download a document (must be visible extranet + client has access)
router.get('/me/documents/:id/download', authenticateClient, async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        visibleExtranet: true,
        deletedAt: null,
        folder: {
          clientAccesses: {
            some: {
              email: req.clientAccess.email,
              isActivated: true,
            },
          },
        },
      },
    });

    if (!document) throw new NotFoundError('Document not found');

    const storageService = require('../services/storage.service');
    const url = await storageService.generatePresignedUrl(document.objectKey);

    // Log download
    await prisma.clientAccessLog.create({
      data: {
        accessId: req.clientAccess.id,
        action: `DOCUMENT_DOWNLOAD:${document.id}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    return successResponse(res, { url, filename: document.originalName });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ADMIN ROUTES (cabinet auth, not client auth)
// ============================================================================

// Recent extranet activity
router.get('/admin/activity', authenticateCabinet, enforceTenant, async (req, res, next) => {
  try {
    const logs = await prisma.clientAccessLog.findMany({
      where: {
        access: { folder: { tenantId: req.tenant.id } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        access: {
          select: {
            email: true,
            folder: {
              select: { id: true, title: true, client: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    return successResponse(res, logs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
