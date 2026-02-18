const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePaginationParams, omitSensitiveFields, generateToken } = require('../utils/helpers');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// COMPLETENESS LOGIC
// ============================================================================

const COMPLETENESS_FIELDS = {
  identity: {
    weight: 30,
    fields: [
      { key: 'civilite', label: 'Civilité', critical: false },
      { key: 'lastName', label: 'Nom', critical: true },
      { key: 'firstName', label: 'Prénom', critical: true },
      { key: 'birthDate', label: 'Date de naissance', critical: true },
      { key: 'lieuNaissance', label: 'Lieu de naissance', critical: true },
      { key: 'nationalite', label: 'Nationalité', critical: true },
      { key: 'profession', label: 'Profession', critical: false },
    ],
  },
  contact: {
    weight: 30,
    fields: [
      { key: 'address', label: 'Adresse personnelle', critical: true },
      { key: 'postalCode', label: 'Code postal', critical: true },
      { key: 'city', label: 'Ville', critical: true },
      { key: 'phone', label: 'Téléphone', critical: false },
      { key: 'email', label: 'Email', critical: true },
    ],
  },
  family: {
    weight: 25,
    fields: [
      { key: 'situationFamiliale', label: 'Situation familiale', critical: true },
    ],
  },
  filiation: {
    weight: 15,
    fields: [
      { key: 'pereNom', label: 'Nom du père', critical: false },
      { key: 'perePrenom', label: 'Prénom du père', critical: false },
      { key: 'mereNomJeuneFille', label: 'Nom de la mère', critical: false },
      { key: 'merePrenom', label: 'Prénom de la mère', critical: false },
    ],
  },
};

function calculateCompleteness(client) {
  let totalWeight = 0;
  let filledWeight = 0;
  const missing = [];

  for (const [section, config] of Object.entries(COMPLETENESS_FIELDS)) {
    const sectionFields = [...config.fields];

    // Add conditional family fields if married/pacsed
    if (section === 'family' && client.situationFamiliale) {
      const s = client.situationFamiliale.toLowerCase();
      if (s === 'marie' || s === 'marié' || s === 'pacse' || s === 'pacsé') {
        sectionFields.push(
          { key: 'conjointNom', label: 'Nom du conjoint', critical: false },
          { key: 'conjointPrenom', label: 'Prénom du conjoint', critical: false },
          { key: 'regimeMatrimonial', label: 'Régime matrimonial', critical: false }
        );
      }
    }

    const filledCount = sectionFields.filter(
      (f) => client[f.key] != null && client[f.key] !== ''
    ).length;
    const sectionPercent = sectionFields.length > 0 ? filledCount / sectionFields.length : 1;

    totalWeight += config.weight;
    filledWeight += config.weight * sectionPercent;

    sectionFields
      .filter((f) => !client[f.key] || client[f.key] === '')
      .forEach((f) => {
        missing.push({ ...f, section });
      });
  }

  const percent = Math.round((filledWeight / totalWeight) * 100);
  const level = percent >= 80 ? 'complet' : percent >= 50 ? 'incomplet' : 'critique';
  const criticalMissing = missing.filter((f) => f.critical);

  return { percent, level, missing, criticalMissing };
}

// ============================================================================
// ROUTES
// ============================================================================

// List clients (with search + type + status filter + sort)
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { search, type, status, sort, order } = req.query;

    const where = { tenantId: req.tenant.id, deletedAt: null };

    if (type) {
      where.type = type;
    }

    if (status === 'archived') {
      where.isActive = false;
    } else if (status === 'active') {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { siret: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sort) {
      const dir = order === 'asc' ? 'asc' : 'desc';
      orderBy = { [sort]: dir };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          folders: {
            where: { deletedAt: null },
            select: { id: true, status: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Add completeness + folder count
    const enriched = clients.map((c) => {
      const { percent, level } = calculateCompleteness(c);
      const activeFolders = c.folders.filter(
        (f) => f.status !== 'ARCHIVED' && f.status !== 'CLOSED'
      ).length;
      const result = omitSensitiveFields(c, ['extranetPassword']);
      delete result.folders;
      return {
        ...result,
        completeness: { percent, level },
        activeFolderCount: activeFolders,
        totalFolderCount: c.folders.length,
      };
    });

    return paginatedResponse(res, enriched, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get client by ID
router.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
      include: {
        folders: {
          where: { deletedAt: null },
          select: {
            id: true,
            reference: true,
            title: true,
            type: true,
            status: true,
            openedAt: true,
          },
          orderBy: { openedAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const completeness = calculateCompleteness(client);
    const result = omitSensitiveFields(client, ['extranetPassword']);

    return successResponse(res, { ...result, completeness });
  } catch (error) {
    next(error);
  }
});

// Get client completeness
router.get('/:id/completeness', async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const completeness = calculateCompleteness(client);
    return successResponse(res, completeness);
  } catch (error) {
    next(error);
  }
});

// Create client
router.post('/', async (req, res, next) => {
  try {
    const { type, firstName, lastName, companyName, siret, email, phone, mobile, address, addressLine2, postalCode, city, country, notes } = req.body;

    if (!type) {
      throw new BadRequestError('Client type is required');
    }

    if (type === 'INDIVIDUAL' && (!firstName || !lastName)) {
      throw new BadRequestError('First name and last name are required for individual clients');
    }

    if ((type === 'COMPANY' || type === 'ASSOCIATION') && !companyName) {
      throw new BadRequestError('Company name is required for company/association clients');
    }

    // Check email uniqueness within tenant
    if (email) {
      const existing = await prisma.client.findFirst({
        where: { email, tenantId: req.tenant.id, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestError('A client with this email already exists');
      }
    }

    const client = await prisma.client.create({
      data: {
        type,
        firstName: firstName || null,
        lastName: lastName || null,
        companyName: companyName || null,
        siret: siret || null,
        email: email || null,
        phone: phone || null,
        mobile: mobile || null,
        address: address || null,
        addressLine2: addressLine2 || null,
        postalCode: postalCode || null,
        city: city || null,
        country: country || 'France',
        notes: notes || null,
        tenantId: req.tenant.id,
      },
    });

    // Calculate and save completeness
    const { percent } = calculateCompleteness(client);
    await prisma.client.update({
      where: { id: client.id },
      data: { profileCompletionPercent: percent },
    });

    logger.info('Client created', { clientId: client.id, tenantId: req.tenant.id });

    return successResponse(res, omitSensitiveFields({ ...client, profileCompletionPercent: percent }, ['extranetPassword']), 'Client created', 201);
  } catch (error) {
    next(error);
  }
});

// Update client (full)
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Client not found');
    }

    const allowedFields = [
      'type', 'firstName', 'lastName', 'companyName', 'siret', 'vatNumber',
      'email', 'phone', 'mobile', 'address', 'addressLine2', 'postalCode',
      'city', 'country', 'notes', 'civilite', 'nomUsage', 'birthDate',
      'lieuNaissance', 'departementNaissance', 'paysNaissance', 'nationalite',
      'profession', 'secu', 'formeSociale', 'objetSocial', 'capital', 'siege',
      'rcs', 'complementAdressePerso', 'adressePro', 'complementAdressePro',
      'cpPro', 'villePro', 'paysPro', 'telPro', 'fax', 'emailSecondaire',
      'pereNom', 'perePrenom', 'mereNomJeuneFille', 'merePrenom',
      'situationFamiliale', 'conjointNom', 'conjointPrenom',
      'conjointDateNaissance', 'conjointNationalite', 'conjointProfession',
      'regimeMatrimonial', 'dateContratMariage', 'notaireMariage',
      'nbEnfantsMineurs', 'nbEnfantsMajeurs',
    ];

    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field] === '' ? null : req.body[field];
      }
    }

    // Check email uniqueness if changed
    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.client.findFirst({
        where: { email: data.email, tenantId: req.tenant.id, NOT: { id: req.params.id }, deletedAt: null },
      });
      if (emailTaken) {
        throw new BadRequestError('A client with this email already exists');
      }
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data,
    });

    // Recalculate completeness
    const { percent } = calculateCompleteness(client);
    await prisma.client.update({
      where: { id: client.id },
      data: { profileCompletionPercent: percent },
    });

    logger.info('Client updated', { clientId: client.id, tenantId: req.tenant.id });

    return successResponse(res, omitSensitiveFields({ ...client, profileCompletionPercent: percent }, ['extranetPassword']), 'Client updated');
  } catch (error) {
    next(error);
  }
});

// Update client section
router.patch('/:id/section/:section', async (req, res, next) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Client not found');
    }

    const sectionFieldMap = {
      identity: ['civilite', 'firstName', 'lastName', 'nomUsage', 'birthDate', 'lieuNaissance', 'departementNaissance', 'paysNaissance', 'nationalite', 'profession', 'secu'],
      contact: ['address', 'addressLine2', 'postalCode', 'city', 'country', 'phone', 'mobile', 'email', 'complementAdressePerso', 'adressePro', 'complementAdressePro', 'cpPro', 'villePro', 'paysPro', 'telPro', 'fax', 'emailSecondaire'],
      family: ['situationFamiliale', 'conjointNom', 'conjointPrenom', 'conjointDateNaissance', 'conjointNationalite', 'conjointProfession', 'regimeMatrimonial', 'dateContratMariage', 'notaireMariage', 'nbEnfantsMineurs', 'nbEnfantsMajeurs'],
      filiation: ['pereNom', 'perePrenom', 'mereNomJeuneFille', 'merePrenom'],
      company: ['companyName', 'siret', 'vatNumber', 'formeSociale', 'objetSocial', 'capital', 'siege', 'rcs'],
    };

    const allowedFields = sectionFieldMap[req.params.section];
    if (!allowedFields) {
      throw new BadRequestError('Invalid section: ' + req.params.section);
    }

    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field] === '' ? null : req.body[field];
      }
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data,
    });

    // Recalculate completeness
    const { percent } = calculateCompleteness(client);
    await prisma.client.update({
      where: { id: client.id },
      data: { profileCompletionPercent: percent },
    });

    return successResponse(res, omitSensitiveFields({ ...client, profileCompletionPercent: percent }, ['extranetPassword']), 'Section updated');
  } catch (error) {
    next(error);
  }
});

// Archive / unarchive client
router.patch('/:id/archive', async (req, res, next) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Client not found');
    }

    const newIsActive = !existing.isActive;
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { isActive: newIsActive },
    });

    logger.info(`Client ${newIsActive ? 'unarchived' : 'archived'}`, { clientId: req.params.id, tenantId: req.tenant.id });

    return successResponse(res, omitSensitiveFields(client, ['extranetPassword']), newIsActive ? 'Client restauré' : 'Client archivé');
  } catch (error) {
    next(error);
  }
});

// Soft delete client
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Client not found');
    }

    await prisma.client.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    logger.info('Client soft-deleted', { clientId: req.params.id, tenantId: req.tenant.id });

    return successResponse(res, null, 'Client deleted');
  } catch (error) {
    next(error);
  }
});

// Get client folders
router.get('/:id/folders', async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { clientId: req.params.id, tenantId: req.tenant.id, deletedAt: null },
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: folders });
  } catch (error) {
    next(error);
  }
});

// Send form to client (extranet)
router.post('/:id/send-form', async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    if (!client.email) {
      throw new BadRequestError('Client does not have an email address');
    }

    const token = generateToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.client.update({
      where: { id: client.id },
      data: {
        invitationToken: token,
        invitationSentAt: new Date(),
        invitationExpiresAt: expiresAt,
      },
    });

    // Create timeline event on the client's first folder (if any)
    const firstFolder = await prisma.folder.findFirst({
      where: { clientId: client.id, tenantId: req.tenant.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (firstFolder) {
      await prisma.timelineEvent.create({
        data: {
          folderId: firstFolder.id,
          type: 'formulaire_envoye',
          description: `Formulaire de complétude envoyé à ${client.email}`,
          userId: req.user.id,
          metadata: { clientId: client.id, email: client.email },
        },
      });
    }

    logger.info('Client form sent', { clientId: client.id, email: client.email });

    return successResponse(res, {
      success: true,
      message: `Formulaire envoyé à ${client.email}`,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EXTRANET INVITATION & REMINDERS
// ============================================================================

// Invite client to extranet
router.post('/:id/invite-extranet', async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!client) throw new NotFoundError('Client not found');
    if (!client.email) throw new BadRequestError('Client has no email address');

    // Find the client's folders and create ClientAccess for each
    const folders = await prisma.folder.findMany({
      where: { clientId: client.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (folders.length === 0) {
      throw new BadRequestError('Client has no folders');
    }

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    // Primary token stored on the client record for the activation link
    const primaryToken = crypto.randomBytes(32).toString('hex');

    // Create or update ClientAccess for each folder (unique token per access)
    // Track the token for the first folder — used in the email activation link
    let firstFolderToken = null;
    for (const folder of folders) {
      const existing = await prisma.clientAccess.findUnique({
        where: { folderId_email: { folderId: folder.id, email: client.email.toLowerCase() } },
      });

      if (!existing) {
        const folderToken = crypto.randomBytes(32).toString('hex');
        if (!firstFolderToken) firstFolderToken = folderToken;
        await prisma.clientAccess.create({
          data: {
            folderId: folder.id,
            email: client.email.toLowerCase(),
            activationToken: folderToken,
            tokenExpiresAt,
          },
        });
      } else if (!existing.isActivated) {
        const folderToken = crypto.randomBytes(32).toString('hex');
        if (!firstFolderToken) firstFolderToken = folderToken;
        await prisma.clientAccess.update({
          where: { id: existing.id },
          data: { activationToken: folderToken, tokenExpiresAt },
        });
      } else {
        // Already activated — use its token reference if first
        if (!firstFolderToken) firstFolderToken = existing.activationToken;
      }
    }

    // Update client invitation fields
    await prisma.client.update({
      where: { id: client.id },
      data: {
        hasExternet: true,
        invitationToken: primaryToken,
        invitationSentAt: new Date(),
        invitationExpiresAt: tokenExpiresAt,
      },
    });

    // Create automatic reminders (J+3, J+7, J+14)
    const now = new Date();
    const reminders = [
      { days: 3, number: 1 },
      { days: 7, number: 2 },
      { days: 14, number: 3 },
    ];

    for (const r of reminders) {
      const scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + r.days);

      await prisma.clientReminder.create({
        data: {
          tenantId: req.tenant.id,
          clientId: client.id,
          type: 'profile_completion',
          scheduledAt,
          reminderNumber: r.number,
          channel: 'email',
          status: 'pending',
        },
      });
    }

    // Timeline event
    const firstFolder = folders[0];
    await prisma.timelineEvent.create({
      data: {
        folderId: firstFolder.id,
        type: 'extranet_invitation',
        description: `Invitation extranet envoyée à ${client.email}`,
        userId: req.user.id,
        metadata: { clientId: client.id, email: client.email },
      },
    });

    // Send invitation email — use the first folder's activation token (the one verify-token/activate will look up)
    const emailToken = firstFolderToken || primaryToken;
    const activationUrl = `${process.env.CLIENT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/extranet/activate/${emailToken}`;
    try {
      await emailService.sendClientInvitation({
        to: client.email,
        clientName: client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client',
        folderTitle: firstFolder.title,
        tenantName: req.tenant.name,
        activationLink: activationUrl,
        expiresIn: '7 jours',
      });
    } catch (emailError) {
      logger.error('Failed to send extranet invitation email:', emailError);
    }

    logger.info('Extranet invitation sent', { clientId: client.id, email: client.email });

    return successResponse(res, {
      activationUrl,
      email: client.email,
      foldersCount: folders.length,
      remindersCreated: reminders.length,
    }, 'Invitation extranet envoyée');
  } catch (error) {
    next(error);
  }
});

// Manual remind client
router.post('/:id/remind-extranet', async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!client) throw new NotFoundError('Client not found');
    if (!client.email) throw new BadRequestError('Client has no email address');

    // Check if profile already submitted
    if (client.profileSubmittedAt) {
      throw new BadRequestError('Client profile already submitted');
    }

    // Create immediate reminder
    await prisma.clientReminder.create({
      data: {
        tenantId: req.tenant.id,
        clientId: client.id,
        type: 'profile_completion',
        scheduledAt: new Date(),
        sentAt: new Date(),
        reminderNumber: 0,
        channel: 'email',
        status: 'sent',
      },
    });

    // Send email
    try {
      await emailService.sendDocumentRequestReminder({
        to: client.email,
        clientName: client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client',
        requestTitle: 'Compléter votre fiche d\'informations',
        folderTitle: '',
        dueDate: null,
        reminderCount: 0,
        tenantName: req.tenant.name,
      });
    } catch (emailError) {
      logger.error('Failed to send extranet reminder email:', emailError);
    }

    // Timeline event
    const firstFolder = await prisma.folder.findFirst({
      where: { clientId: client.id, tenantId: req.tenant.id, deletedAt: null },
    });
    if (firstFolder) {
      await prisma.timelineEvent.create({
        data: {
          folderId: firstFolder.id,
          type: 'extranet_relance',
          description: `Relance extranet envoyée à ${client.email}`,
          userId: req.user.id,
        },
      });
    }

    return successResponse(res, null, 'Relance envoyée');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
