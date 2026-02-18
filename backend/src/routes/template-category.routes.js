/**
 * Template Category Routes
 *
 * Categories for organizing document templates
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// LIST ALL CATEGORIES
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.templateCategory.findMany({
      where: { tenantId: req.tenant.id },
      include: {
        _count: { select: { templates: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse(res, categories);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SINGLE CATEGORY
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.templateCategory.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
      },
      include: {
        templates: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            documentType: true,
            isSystem: true,
            usageCount: true,
          },
        },
        _count: { select: { templates: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return successResponse(res, category);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CREATE CATEGORY
// ============================================================================

router.post('/', async (req, res, next) => {
  try {
    const { name, description, icon, color, displayOrder } = req.body;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    const category = await prisma.templateCategory.create({
      data: {
        name: name.trim(),
        description,
        icon,
        color,
        displayOrder: displayOrder || 0,
        tenantId: req.tenant.id,
      },
    });

    return successResponse(res, category, 'Category created', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// UPDATE CATEGORY
// ============================================================================

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, icon, color, displayOrder } = req.body;

    const existing = await prisma.templateCategory.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    const category = await prisma.templateCategory.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || existing.name,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        color: color !== undefined ? color : existing.color,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
      },
      include: {
        _count: { select: { templates: true } },
      },
    });

    return successResponse(res, category, 'Category updated');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE CATEGORY
// ============================================================================

router.delete('/:id', async (req, res, next) => {
  try {
    const category = await prisma.templateCategory.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        _count: { select: { templates: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Set templates' category to null before deleting
    await prisma.builderTemplate.updateMany({
      where: { templateCategoryId: req.params.id },
      data: { templateCategoryId: null },
    });

    await prisma.templateCategory.delete({
      where: { id: req.params.id },
    });

    return successResponse(res, null, 'Category deleted');
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// REORDER CATEGORIES
// ============================================================================

router.post('/reorder', async (req, res, next) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      throw new BadRequestError('Orders must be an array');
    }

    await prisma.$transaction(
      orders.map(({ id, displayOrder }) =>
        prisma.templateCategory.updateMany({
          where: { id, tenantId: req.tenant.id },
          data: { displayOrder },
        })
      )
    );

    return successResponse(res, null, 'Categories reordered');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
