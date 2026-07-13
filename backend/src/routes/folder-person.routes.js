const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const timeline = require('../services/timeline.service');

router.use(authenticate);
router.use(enforceTenant);

// Valid enum values
// GO-LIVE-6 C4 — resynchronisé avec l'enum Prisma PersonRole. POSTULANT et CO_DEBITEUR
// existaient dans l'enum ET étaient consommés par collectData (postulant.*, boucle
// co_debiteurs de l'assignation), mais étaient ABSENTS de cette liste → l'API refusait
// (400) de les ajouter. Résultat : aucune assignation ne pouvait avoir de postulant/
// co-débiteur. (CLIENT reste hors liste : le client du dossier vient de la relation folder.)
const PERSON_ROLES = [
  'PARTIE_ADVERSE',
  'AVOCAT_ADVERSE',
  'POSTULANT',
  'CO_DEBITEUR',
  'TEMOIN',
  'EXPERT',
  'NOTAIRE',
  'HUISSIER',
  'MEDIATEUR',
  'AUTRE',
];

const PERSON_TYPES = ['PHYSIQUE', 'MORALE'];

// ── GO-LIVE-1.B — Identité personne morale (adversaire PM) ──
// Le front saisit le capital en euros et l'envoie DÉJÀ converti en CENTIMES (entier).
// Ici on se contente de coercer en entier sûr ; toute valeur non numérique → null (pas d'erreur 500).
function coerceCapital(cap) {
  if (cap === null || cap === undefined || cap === '') return null;
  const n = Number(cap);
  return Number.isFinite(n) ? Math.round(n) : null;
}

// Champs PM complets pour une CRÉATION : nuls si le type n'est pas MORALE (payload sale ignoré).
function buildPmFields(type, body) {
  if (type !== 'MORALE') {
    return { formeSociale: null, capital: null, villeImmatriculation: null, numeroImmatriculation: null };
  }
  return {
    formeSociale: body.formeSociale?.trim() || null,
    capital: coerceCapital(body.capital),
    villeImmatriculation: body.villeImmatriculation?.trim() || null,
    numeroImmatriculation: body.numeroImmatriculation?.trim() || null,
  };
}

// Champs PM pour une MISE À JOUR MORALE : undefined = inchangé (Prisma ignore), sinon valeur/null.
function buildPmFieldsPartial(body) {
  return {
    formeSociale: body.formeSociale !== undefined ? (body.formeSociale?.trim() || null) : undefined,
    capital: body.capital !== undefined ? coerceCapital(body.capital) : undefined,
    villeImmatriculation: body.villeImmatriculation !== undefined ? (body.villeImmatriculation?.trim() || null) : undefined,
    numeroImmatriculation: body.numeroImmatriculation !== undefined ? (body.numeroImmatriculation?.trim() || null) : undefined,
  };
}

// Role labels for display
const ROLE_LABELS = {
  PARTIE_ADVERSE: 'Partie adverse',
  AVOCAT_ADVERSE: 'Avocat adverse',
  POSTULANT: 'Avocat postulant',
  CO_DEBITEUR: 'Co-débiteur',
  TEMOIN: 'Témoin',
  EXPERT: 'Expert',
  NOTAIRE: 'Notaire',
  HUISSIER: 'Huissier',
  MEDIATEUR: 'Médiateur',
  AUTRE: 'Autre',
};

// ============================================================================
// FOLDER PERSONS CRUD
// ============================================================================

// List persons for a folder
router.get('/folders/:folderId/persons', async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { role, type, search } = req.query;

    // Verify folder belongs to tenant
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId: req.tenant.id },
    });

    if (!folder) throw new NotFoundError('Dossier non trouvé');

    const where = { folderId, tenantId: req.tenant.id };

    if (role && PERSON_ROLES.includes(role)) where.role = role;
    if (type && PERSON_TYPES.includes(type)) where.type = type;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [persons, total] = await Promise.all([
      prisma.folderPerson.findMany({
        where,
        skip,
        take,
        orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.folderPerson.count({ where }),
    ]);

    // Add role labels
    const personsWithLabels = persons.map((p) => ({
      ...omitSensitiveFields(p),
      roleLabel: ROLE_LABELS[p.role] || p.role,
    }));

    return paginatedResponse(res, personsWithLabels, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
});

// Get a single person by ID
router.get('/folders/:folderId/persons/:id', async (req, res, next) => {
  try {
    const { folderId, id } = req.params;

    const person = await prisma.folderPerson.findFirst({
      where: {
        id,
        folderId,
        tenantId: req.tenant.id,
      },
      include: {
        folder: {
          select: { id: true, reference: true, title: true },
        },
      },
    });

    if (!person) throw new NotFoundError('Personne non trouvée');

    return successResponse(res, {
      ...omitSensitiveFields(person),
      roleLabel: ROLE_LABELS[person.role] || person.role,
    });
  } catch (error) {
    next(error);
  }
});

// Create a new person for a folder
router.post('/folders/:folderId/persons', async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const {
      type = 'PHYSIQUE',
      role,
      firstName,
      lastName,
      company,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      notes,
    } = req.body;

    // Verify folder belongs to tenant
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, tenantId: req.tenant.id },
    });
    // GO-LIVE-1.B — champs personne morale : persistés uniquement si type === MORALE.
    // Un payload "sale" (champs PM sur un PHYSIQUE) est donc ignoré proprement (pas d'erreur).
    const pmData = buildPmFields(type, req.body);

    if (!folder) throw new NotFoundError('Dossier non trouvé');

    // Validate required fields
    if (!role || !PERSON_ROLES.includes(role)) {
      throw new BadRequestError(`Rôle invalide. Valeurs acceptées: ${PERSON_ROLES.join(', ')}`);
    }

    if (!type || !PERSON_TYPES.includes(type)) {
      throw new BadRequestError(`Type invalide. Valeurs acceptées: ${PERSON_TYPES.join(', ')}`);
    }

    // GO-LIVE-6 C3 — validation SELON LE TYPE. Une personne MORALE n'a pas de "nom de
    // famille" : on exige la raison sociale (company), pas lastName. Le contrôle lastName
    // ne s'applique qu'à une personne PHYSIQUE (avant, il s'exécutait pour les deux).
    if (type === 'PHYSIQUE') {
      if (!lastName || lastName.trim() === '') {
        throw new BadRequestError('Le nom est requis pour une personne physique');
      }
      if (!firstName || firstName.trim() === '') {
        throw new BadRequestError('Le prénom est requis pour une personne physique');
      }
    } else if (type === 'MORALE') {
      if (!company || company.trim() === '') {
        throw new BadRequestError('La raison sociale est requise pour une personne morale');
      }
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError('Format d\'email invalide');
    }

    const person = await prisma.folderPerson.create({
      data: {
        folderId,
        tenantId: req.tenant.id,
        type,
        role,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        company: company?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode?.trim() || null,
        country: country?.trim() || 'FR',
        notes: notes?.trim() || null,
        ...pmData,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_PERSON_CREATED',
        entityType: 'FolderPerson',
        entityId: person.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: { folderId, role, type },
      },
    });

    // Timeline event
    const personName = person.firstName ? `${person.firstName} ${person.lastName}` : (person.company || person.lastName);
    await timeline.addEvent({
      folderId,
      type: 'personne_ajoutee',
      description: `${ROLE_LABELS[person.role] || person.role} ajouté(e) : ${personName}`,
      userId: req.user.id,
      metadata: { personId: person.id, role: person.role, type: person.type },
    });

    return successResponse(
      res,
      {
        ...omitSensitiveFields(person),
        roleLabel: ROLE_LABELS[person.role] || person.role,
      },
      'Personne ajoutée au dossier',
      201
    );
  } catch (error) {
    next(error);
  }
});

// Update a person
router.put('/folders/:folderId/persons/:id', async (req, res, next) => {
  try {
    const { folderId, id } = req.params;
    const {
      type,
      role,
      firstName,
      lastName,
      company,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      notes,
    } = req.body;

    // Verify person exists and belongs to folder/tenant
    const existingPerson = await prisma.folderPerson.findFirst({
      where: {
        id,
        folderId,
        tenantId: req.tenant.id,
      },
    });

    if (!existingPerson) throw new NotFoundError('Personne non trouvée');

    // Validate role if provided
    if (role && !PERSON_ROLES.includes(role)) {
      throw new BadRequestError(`Rôle invalide. Valeurs acceptées: ${PERSON_ROLES.join(', ')}`);
    }

    // Validate type if provided
    if (type && !PERSON_TYPES.includes(type)) {
      throw new BadRequestError(`Type invalide. Valeurs acceptées: ${PERSON_TYPES.join(', ')}`);
    }

    // Determine final type
    const finalType = type || existingPerson.type;

    // GO-LIVE-6 C3 — nom (lastName) requis UNIQUEMENT pour une personne PHYSIQUE.
    if (finalType === 'PHYSIQUE') {
      const finalLastName = lastName !== undefined ? lastName : existingPerson.lastName;
      if (!finalLastName || finalLastName.trim() === '') {
        throw new BadRequestError('Le nom est requis pour une personne physique');
      }
      const finalFirstName = firstName !== undefined ? firstName : existingPerson.firstName;
      if (!finalFirstName || finalFirstName.trim() === '') {
        throw new BadRequestError('Le prénom est requis pour une personne physique');
      }
    }

    if (finalType === 'MORALE') {
      const finalCompany = company !== undefined ? company : existingPerson.company;
      if (!finalCompany || finalCompany.trim() === '') {
        throw new BadRequestError('La raison sociale est requise pour une personne morale');
      }
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError('Format d\'email invalide');
    }

    // GO-LIVE-1.B — champs personne morale selon le type FINAL.
    // MORALE : applique les valeurs fournies (undefined = inchangé). PHYSIQUE : force null
    // (bascule MORALE→PHYSIQUE nettoie l'identité PM, payload PM sur PHYSIQUE ignoré).
    const pmData = finalType === 'MORALE'
      ? buildPmFieldsPartial(req.body)
      : { formeSociale: null, capital: null, villeImmatriculation: null, numeroImmatriculation: null };

    const person = await prisma.folderPerson.update({
      where: { id },
      data: {
        type: type || undefined,
        role: role || undefined,
        firstName: firstName !== undefined ? (firstName?.trim() || null) : undefined,
        lastName: lastName !== undefined ? lastName.trim() : undefined,
        company: company !== undefined ? (company?.trim() || null) : undefined,
        email: email !== undefined ? (email?.trim().toLowerCase() || null) : undefined,
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        address: address !== undefined ? (address?.trim() || null) : undefined,
        city: city !== undefined ? (city?.trim() || null) : undefined,
        postalCode: postalCode !== undefined ? (postalCode?.trim() || null) : undefined,
        country: country !== undefined ? (country?.trim() || null) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
        ...pmData,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_PERSON_UPDATED',
        entityType: 'FolderPerson',
        entityId: person.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: { type, role, firstName, lastName, company, email, phone, address },
      },
    });

    return successResponse(res, {
      ...omitSensitiveFields(person),
      roleLabel: ROLE_LABELS[person.role] || person.role,
    }, 'Personne mise à jour');
  } catch (error) {
    next(error);
  }
});

// Delete a person
router.delete('/folders/:folderId/persons/:id', requireRole('ADMIN'), async (req, res, next) => { // GO-LIVE-6 C5
  try {
    const { folderId, id } = req.params;

    // Verify person exists and belongs to folder/tenant
    const person = await prisma.folderPerson.findFirst({
      where: {
        id,
        folderId,
        tenantId: req.tenant.id,
      },
    });

    if (!person) throw new NotFoundError('Personne non trouvée');

    await prisma.folderPerson.delete({
      where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_PERSON_DELETED',
        entityType: 'FolderPerson',
        entityId: id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          folderId,
          deletedPerson: {
            type: person.type,
            role: person.role,
            lastName: person.lastName,
            firstName: person.firstName,
          },
        },
      },
    });

    // Timeline event
    const deletedName = person.firstName ? `${person.firstName} ${person.lastName}` : (person.company || person.lastName);
    await timeline.addEvent({
      folderId,
      type: 'personne_supprimee',
      description: `${ROLE_LABELS[person.role] || person.role} retiré(e) : ${deletedName}`,
      userId: req.user.id,
      metadata: { role: person.role, type: person.type },
    });

    return successResponse(res, null, 'Personne supprimée du dossier');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UTILITIES
// ============================================================================

// Get available roles (for frontend dropdowns)
router.get('/persons/roles', async (req, res, next) => {
  try {
    const roles = PERSON_ROLES.map((role) => ({
      value: role,
      label: ROLE_LABELS[role] || role,
    }));

    return successResponse(res, roles);
  } catch (error) {
    next(error);
  }
});

// Get available types (for frontend dropdowns)
router.get('/persons/types', async (req, res, next) => {
  try {
    const types = [
      { value: 'PHYSIQUE', label: 'Personne physique' },
      { value: 'MORALE', label: 'Personne morale' },
    ];

    return successResponse(res, types);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
