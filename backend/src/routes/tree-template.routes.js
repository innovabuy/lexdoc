const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, createdResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

router.use(authenticate);
router.use(enforceTenant);

// GET /api/tree-templates — List all tree templates for tenant
router.get('/', async (req, res, next) => {
  try {
    const templates = await prisma.folderTreeTemplate.findMany({
      where: { tenantId: req.tenant.id },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, templates);
  } catch (error) {
    next(error);
  }
});

// GET /api/tree-templates/:id — Get single template
router.get('/:id', async (req, res, next) => {
  try {
    const template = await prisma.folderTreeTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!template) throw new NotFoundError('Tree template not found');
    return successResponse(res, template);
  } catch (error) {
    next(error);
  }
});

// POST /api/tree-templates — Create new template
router.post('/', async (req, res, next) => {
  try {
    const { name, folderType, categories, isDefault } = req.body;

    if (!name || !folderType) {
      throw new BadRequestError('name and folderType are required');
    }

    // If setting as default, unset others of same folderType
    if (isDefault) {
      await prisma.folderTreeTemplate.updateMany({
        where: { tenantId: req.tenant.id, folderType, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.folderTreeTemplate.create({
      data: {
        tenantId: req.tenant.id,
        name,
        folderType,
        categories: categories || [],
        isDefault: isDefault || false,
      },
    });

    return createdResponse(res, template, 'Tree template created');
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new BadRequestError('A template with this name already exists'));
    }
    next(error);
  }
});

// PUT /api/tree-templates/:id — Update template
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.folderTreeTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('Tree template not found');

    const { name, folderType, categories, isDefault } = req.body;

    // If setting as default, unset others of same type
    if (isDefault && !existing.isDefault) {
      const type = folderType || existing.folderType;
      await prisma.folderTreeTemplate.updateMany({
        where: { tenantId: req.tenant.id, folderType: type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.folderTreeTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(folderType !== undefined && { folderType }),
        ...(categories !== undefined && { categories }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return successResponse(res, template, 'Tree template updated');
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new BadRequestError('A template with this name already exists'));
    }
    next(error);
  }
});

// DELETE /api/tree-templates/:id — Delete template
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.folderTreeTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('Tree template not found');

    await prisma.folderTreeTemplate.delete({ where: { id: req.params.id } });

    return successResponse(res, null, 'Tree template deleted');
  } catch (error) {
    next(error);
  }
});

// POST /api/tree-templates/:id/set-default — Set as default for its folderType
router.post('/:id/set-default', async (req, res, next) => {
  try {
    const existing = await prisma.folderTreeTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('Tree template not found');

    // Unset all defaults for this folderType
    await prisma.folderTreeTemplate.updateMany({
      where: { tenantId: req.tenant.id, folderType: existing.folderType, isDefault: true },
      data: { isDefault: false },
    });

    // Set this one as default
    const template = await prisma.folderTreeTemplate.update({
      where: { id: req.params.id },
      data: { isDefault: true },
    });

    return successResponse(res, template, 'Default template set');
  } catch (error) {
    next(error);
  }
});

// PUT /api/tree-templates/:id/categories — Update categories order
router.put('/:id/categories', async (req, res, next) => {
  try {
    const existing = await prisma.folderTreeTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!existing) throw new NotFoundError('Tree template not found');

    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      throw new BadRequestError('categories must be an array');
    }

    const template = await prisma.folderTreeTemplate.update({
      where: { id: req.params.id },
      data: { categories },
    });

    return successResponse(res, template, 'Categories reordered');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
