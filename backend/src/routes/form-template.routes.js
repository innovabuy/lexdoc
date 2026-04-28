const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, createdResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

router.use(authenticate);
router.use(enforceTenant);

// Définition des sections par défaut
const DEFAULT_SECTIONS = [
  { section: 'IDENTITE', label: 'Identité principale', ordre: 1 },
  { section: 'COORDONNEES', label: 'Coordonnées', ordre: 2 },
  { section: 'SITUATION_FAMILIALE', label: 'Situation familiale', ordre: 3 },
  { section: 'FILIATION', label: 'Filiation', ordre: 4 },
  { section: 'CONJOINT_PACS', label: 'Conjoint / PACS', ordre: 5 },
  { section: 'SITUATION_MATRIMONIALE', label: 'Situation matrimoniale', ordre: 6 },
  { section: 'INFORMATIONS_PROJET', label: 'Informations projet', ordre: 7 },
];

// ============================================================================
// GET /api/form-templates — Liste des templates du cabinet
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const templates = await prisma.clientFormTemplate.findMany({
      where: { tenantId: req.tenant.id, deletedAt: null },
      include: {
        sections: { orderBy: { ordre: 'asc' } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, templates);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/form-templates/:id — Détail d'un template
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const template = await prisma.clientFormTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
      include: {
        sections: { orderBy: { ordre: 'asc' } },
        _count: { select: { responses: true } },
      },
    });

    if (!template) throw new NotFoundError('Template non trouvé');

    return successResponse(res, template);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/form-templates — Créer un template
// ============================================================================

router.post('/', async (req, res, next) => {
  try {
    const { name, description, folderType, isDefault, sections } = req.body;

    if (!name) throw new BadRequestError('Le nom du template est requis');

    // Si isDefault, désactiver les autres templates par défaut
    if (isDefault) {
      await prisma.clientFormTemplate.updateMany({
        where: { tenantId: req.tenant.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.clientFormTemplate.create({
      data: {
        tenantId: req.tenant.id,
        name,
        description: description || null,
        folderType: folderType || null,
        isDefault: isDefault || false,
        sections: {
          create: (sections || DEFAULT_SECTIONS).map((s) => ({
            section: s.section,
            label: s.label,
            ordre: s.ordre,
            isActive: s.isActive !== undefined ? s.isActive : true,
          })),
        },
      },
      include: {
        sections: { orderBy: { ordre: 'asc' } },
      },
    });

    return createdResponse(res, template, 'Template créé');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PUT /api/form-templates/:id — Modifier un template (sections actives)
// ============================================================================

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, folderType, isDefault, isActive, sections } = req.body;

    const existing = await prisma.clientFormTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!existing) throw new NotFoundError('Template non trouvé');

    // Si isDefault, désactiver les autres
    if (isDefault && !existing.isDefault) {
      await prisma.clientFormTemplate.updateMany({
        where: { tenantId: req.tenant.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.clientFormTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(folderType !== undefined && { folderType: folderType || null }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        sections: { orderBy: { ordre: 'asc' } },
      },
    });

    // Mettre à jour les sections si fournies
    if (sections && Array.isArray(sections)) {
      for (const s of sections) {
        await prisma.clientFormSection.upsert({
          where: {
            templateId_section: {
              templateId: req.params.id,
              section: s.section,
            },
          },
          update: {
            isActive: s.isActive !== undefined ? s.isActive : true,
            label: s.label || undefined,
            ordre: s.ordre !== undefined ? s.ordre : undefined,
          },
          create: {
            templateId: req.params.id,
            section: s.section,
            label: s.label || s.section,
            ordre: s.ordre || 0,
            isActive: s.isActive !== undefined ? s.isActive : true,
          },
        });
      }
    }

    // Recharger avec sections à jour
    const updated = await prisma.clientFormTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        sections: { orderBy: { ordre: 'asc' } },
        _count: { select: { responses: true } },
      },
    });

    return successResponse(res, updated, 'Template mis à jour');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE /api/form-templates/:id — Supprimer un template (soft delete)
// ============================================================================

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.clientFormTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, deletedAt: null },
    });

    if (!existing) throw new NotFoundError('Template non trouvé');

    await prisma.clientFormTemplate.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return successResponse(res, null, 'Template supprimé');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/form-templates/:templateId/responses — Réponses pour un template
// ============================================================================

router.get('/:templateId/responses', async (req, res, next) => {
  try {
    const responses = await prisma.clientFormResponse.findMany({
      where: { templateId: req.params.templateId, tenantId: req.tenant.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        folder: { select: { id: true, reference: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return successResponse(res, responses);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/clients/:clientId/form-response — Réponse formulaire d'un client
// ============================================================================

router.get('/clients/:clientId/form-response', async (req, res, next) => {
  try {
    const { templateId, folderId } = req.query;

    const where = {
      clientId: req.params.clientId,
      tenantId: req.tenant.id,
    };
    if (templateId) where.templateId = templateId;
    if (folderId) where.folderId = folderId;

    const responses = await prisma.clientFormResponse.findMany({
      where,
      include: {
        template: {
          include: { sections: { orderBy: { ordre: 'asc' } } },
        },
        folder: { select: { id: true, reference: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return successResponse(res, responses);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/clients/:clientId/form-response — Créer/màj réponse (côté avocat)
// ============================================================================

router.post('/clients/:clientId/form-response', async (req, res, next) => {
  try {
    const { templateId, folderId, data } = req.body;

    if (!templateId) throw new BadRequestError('templateId est requis');

    // Vérifier que le client appartient au tenant
    const client = await prisma.client.findFirst({
      where: { id: req.params.clientId, tenantId: req.tenant.id },
    });
    if (!client) throw new NotFoundError('Client non trouvé');

    // Vérifier que le template appartient au tenant
    const template = await prisma.clientFormTemplate.findFirst({
      where: { id: templateId, tenantId: req.tenant.id, deletedAt: null },
    });
    if (!template) throw new NotFoundError('Template non trouvé');

    const response = await prisma.clientFormResponse.upsert({
      where: {
        clientId_templateId_folderId: {
          clientId: req.params.clientId,
          templateId,
          folderId: folderId || null,
        },
      },
      update: {
        data: data || {},
      },
      create: {
        tenantId: req.tenant.id,
        clientId: req.params.clientId,
        templateId,
        folderId: folderId || null,
        data: data || {},
      },
      include: {
        template: { include: { sections: { orderBy: { ordre: 'asc' } } } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return successResponse(res, response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
