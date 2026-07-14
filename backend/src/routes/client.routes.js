const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
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

// GO-LIVE-6 M5 — complétude d'une PERSONNE MORALE : on compte les champs SOCIÉTÉ
// (alignés sur le garde-fou art. 648), pas les champs personne physique (civilité,
// naissance, filiation) qui affichaient « 10% / 15 champs manquants » sur une fiche
// PM pourtant complète.
const COMPANY_COMPLETENESS_FIELDS = {
  identity: {
    weight: 70,
    fields: [
      { key: 'companyName', label: 'Raison sociale', critical: true },
      { key: 'formeSociale', label: 'Forme sociale', critical: true },
      { key: 'capital', label: 'Capital social', critical: true },
      { key: 'siege', label: 'Siège social', critical: true },
      { key: 'villeImmatriculation', label: "Ville d'immatriculation", critical: true },
      { key: 'numeroImmatriculation', label: 'N° RCS / immatriculation', critical: true },
      { key: 'objetSocial', label: 'Objet social', critical: false },
    ],
  },
  contact: {
    weight: 30,
    fields: [
      { key: 'email', label: 'Email', critical: true },
      { key: 'phone', label: 'Téléphone', critical: false },
    ],
  },
};

function calculateCompleteness(client) {
  let totalWeight = 0;
  let filledWeight = 0;
  const missing = [];

  // GO-LIVE-6 M5 — le référentiel de complétude DÉPEND DU TYPE.
  const isCompany = client.type === 'COMPANY' || client.type === 'ASSOCIATION';
  const referential = isCompany ? COMPANY_COMPLETENESS_FIELDS : COMPLETENESS_FIELDS;

  for (const [section, config] of Object.entries(referential)) {
    const sectionFields = [...config.fields];

    // Champs conjoint conditionnels — uniquement pour une personne physique.
    if (!isCompany && section === 'family' && client.situationFamiliale) {
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
            select: { id: true, title: true, type: true, nature: true, status: true, reference: true },
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
      const includeFolders = req.query.includeFolders === 'true';
      const folderData = c.folders;
      delete result.folders;
      return {
        ...result,
        completeness: { percent, level },
        activeFolderCount: activeFolders,
        totalFolderCount: c.folders ? c.folders.length : 0,
        ...(includeFolders && { folders: folderData }),
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
      throw new NotFoundError('Client introuvable');
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
      throw new NotFoundError('Client introuvable');
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
    const { type, firstName, lastName, companyName, siret, email, phone, mobile, address, addressLine2, postalCode, city, country, notes,
      // GO-LIVE-1.C.1 — identité PM saisissable dès la création
      formeSociale, capital, siege, rcs, objetSocial, villeImmatriculation, numeroImmatriculation } = req.body;

    if (!type) {
      throw new BadRequestError('Le type de client est requis');
    }

    if (type === 'INDIVIDUAL' && (!firstName || !lastName)) {
      throw new BadRequestError('Le nom et le prénom sont requis pour un particulier');
    }

    if ((type === 'COMPANY' || type === 'ASSOCIATION') && !companyName) {
      throw new BadRequestError('La raison sociale est requise pour une personne morale');
    }

    // GO-LIVE-6 LOT D — validation du format email dès la création (avant, un email
    // invalide était accepté puis échouait silencieusement aux envois extranet/LRAR).
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError('Format d\'email invalide');
    }

    // Check email uniqueness within tenant
    if (email) {
      const existing = await prisma.client.findFirst({
        where: { email, tenantId: req.tenant.id, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestError('Un client avec cet email existe déjà');
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
        // GO-LIVE-1.C.1 — identité PM (persistée pour COMPANY/ASSOCIATION ; ignorée sinon)
        formeSociale: (type === 'COMPANY' || type === 'ASSOCIATION') ? (formeSociale || null) : null,
        capital: (type === 'COMPANY' || type === 'ASSOCIATION') ? (capital || null) : null,
        siege: (type === 'COMPANY' || type === 'ASSOCIATION') ? (siege || null) : null,
        rcs: (type === 'COMPANY' || type === 'ASSOCIATION') ? (rcs || null) : null,
        objetSocial: (type === 'COMPANY' || type === 'ASSOCIATION') ? (objetSocial || null) : null,
        villeImmatriculation: (type === 'COMPANY' || type === 'ASSOCIATION') ? (villeImmatriculation || null) : null,
        numeroImmatriculation: (type === 'COMPANY' || type === 'ASSOCIATION') ? (numeroImmatriculation || null) : null,
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
      throw new NotFoundError('Client introuvable');
    }

    const allowedFields = [
      'type', 'firstName', 'lastName', 'companyName', 'siret', 'vatNumber',
      'email', 'phone', 'mobile', 'address', 'addressLine2', 'postalCode',
      'city', 'country', 'notes', 'civilite', 'nomUsage', 'birthDate',
      'lieuNaissance', 'departementNaissance', 'paysNaissance', 'nationalite',
      'profession', 'secu', 'formeSociale', 'objetSocial', 'capital', 'siege',
      'rcs', 'villeImmatriculation', 'numeroImmatriculation',
      'complementAdressePerso', 'adressePro', 'complementAdressePro',
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
        throw new BadRequestError('Un client avec cet email existe déjà');
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
      throw new NotFoundError('Client introuvable');
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
      throw new NotFoundError('Client introuvable');
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
// GO-LIVE-6 C5 : suppression réservée à l'ADMIN. C2 : aligné sur la suppression de
// dossier — on ne supprime plus un client en laissant ses dossiers/documents orphelins
// et vivants. Bloqué s'il a des dossiers, sauf force=true (cascade soft-delete explicite).
router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Client introuvable');
    }

    const force = req.query.force === 'true';
    const folders = await prisma.folder.findMany({
      where: { clientId: req.params.id, tenantId: req.tenant.id, deletedAt: null },
      select: { id: true },
    });

    if (folders.length > 0 && !force) {
      const docCount = await prisma.document.count({
        where: { folderId: { in: folders.map((f) => f.id) }, deletedAt: null },
      });
      throw new BadRequestError(
        `Ce client a ${folders.length} dossier(s) et ${docCount} document(s). ` +
        `Supprimez-les d'abord, ou relancez avec force=true pour tout supprimer.`
      );
    }

    const now = new Date();
    if (force && folders.length > 0) {
      // Cascade explicite : documents des dossiers, puis dossiers, puis client.
      const folderIds = folders.map((f) => f.id);
      await prisma.document.updateMany({
        where: { folderId: { in: folderIds }, deletedAt: null },
        data: { deletedAt: now },
      });
      await prisma.folder.updateMany({
        where: { id: { in: folderIds } },
        data: { deletedAt: now },
      });
    }

    await prisma.client.update({
      where: { id: req.params.id },
      data: { deletedAt: now, isActive: false },
    });

    logger.info('Client soft-deleted', { clientId: req.params.id, tenantId: req.tenant.id, force, cascadedFolders: force ? folders.length : 0 });

    return successResponse(res, null, force && folders.length > 0
      ? `Client et ${folders.length} dossier(s) supprimés`
      : 'Client deleted');
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

// Get client timeline (aggregated from all client folders)
router.get('/:id/timeline', async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundError('Client introuvable');
    }

    // Get all folders for this client
    const folders = await prisma.folder.findMany({
      where: { clientId: req.params.id, tenantId: req.tenant.id },
      select: { id: true, title: true },
    });

    const folderIds = folders.map(f => f.id);

    if (folderIds.length === 0) {
      return successResponse(res, []);
    }

    // Get timeline events from all folders
    const events = await prisma.timelineEvent.findMany({
      where: { folderId: { in: folderIds } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        folder: { select: { id: true, title: true } },
      },
    });

    // Enrich with userName and folderTitle
    const enriched = events.map(evt => ({
      id: evt.id,
      type: evt.type,
      description: evt.description,
      metadata: evt.metadata,
      createdAt: evt.createdAt,
      folderId: evt.folderId,
      folderTitle: evt.folder?.title || '',
      userName: evt.user ? `${evt.user.firstName || ''} ${evt.user.lastName || ''}`.trim() : '',
    }));

    return successResponse(res, enriched);
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
      throw new NotFoundError('Client introuvable');
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

    // Send form completion email
    const formLink = `${process.env.CLIENT_PORTAL_URL || process.env.FRONTEND_URL}/extranet/form/${token}`;
    try {
      await emailService.sendFormCompletionEmail({
        to: client.email,
        clientName: client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client',
        tenantName: req.tenant.name,
        formLink,
        expiresIn: '7 jours',
      });
    } catch (emailError) {
      logger.error('Failed to send form completion email:', emailError);
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
    if (!client) throw new NotFoundError('Client introuvable');
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
      } else {
        // Reset access (whether activated or not) with a new token
        const folderToken = crypto.randomBytes(32).toString('hex');
        if (!firstFolderToken) firstFolderToken = folderToken;
        await prisma.clientAccess.update({
          where: { id: existing.id },
          data: {
            activationToken: folderToken,
            tokenExpiresAt,
            isActivated: false,
            passwordHash: null,
          },
        });
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
    const activationUrl = `${process.env.CLIENT_PORTAL_URL || process.env.FRONTEND_URL}/extranet/activate/${emailToken}`;
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
    if (!client) throw new NotFoundError('Client introuvable');
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
