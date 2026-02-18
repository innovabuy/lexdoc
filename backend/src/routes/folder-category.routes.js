/**
 * Folder Category Routes
 *
 * Hierarchical document categories for organizing documents within folders
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

router.use(authenticate);
router.use(enforceTenant);

// ============================================================================
// LIST ALL CATEGORIES (with hierarchy)
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const { flat, parentId } = req.query;

    // If flat=true, return all categories without nesting
    if (flat === 'true') {
      const categories = await prisma.folderCategory.findMany({
        where: { tenantId: req.tenant.id },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      return successResponse(res, categories);
    }

    // If parentId specified, get children of that parent
    if (parentId) {
      const categories = await prisma.folderCategory.findMany({
        where: {
          tenantId: req.tenant.id,
          parentId: parentId === 'null' ? null : parentId,
        },
        include: {
          children: {
            orderBy: { displayOrder: 'asc' },
          },
          _count: { select: { documents: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      return successResponse(res, categories);
    }

    // Default: return tree structure (root categories with nested children)
    const rootCategories = await prisma.folderCategory.findMany({
      where: {
        tenantId: req.tenant.id,
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: true, // Support 2 levels of nesting
            _count: { select: { documents: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: { select: { documents: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse(res, rootCategories);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SINGLE CATEGORY
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.folderCategory.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
      },
      include: {
        parent: true,
        children: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: { select: { documents: true } },
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
    const { name, description, color, icon, parentId, displayOrder } = req.body;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    // Verify parent exists if provided
    if (parentId) {
      const parent = await prisma.folderCategory.findFirst({
        where: { id: parentId, tenantId: req.tenant.id },
      });
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    const category = await prisma.folderCategory.create({
      data: {
        name: name.trim(),
        description,
        color,
        icon,
        parentId: parentId || null,
        displayOrder: displayOrder || 0,
        tenantId: req.tenant.id,
      },
      include: {
        parent: true,
        _count: { select: { documents: true } },
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
    const { name, description, color, icon, parentId, displayOrder } = req.body;

    // Verify category exists
    const existing = await prisma.folderCategory.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    // Prevent setting parent to self or descendant
    if (parentId) {
      if (parentId === req.params.id) {
        throw new BadRequestError('Category cannot be its own parent');
      }

      // Check if parentId is a descendant of this category
      const isDescendant = await checkIsDescendant(req.params.id, parentId, req.tenant.id);
      if (isDescendant) {
        throw new BadRequestError('Cannot set a descendant as parent');
      }

      // Verify parent exists
      const parent = await prisma.folderCategory.findFirst({
        where: { id: parentId, tenantId: req.tenant.id },
      });
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    const category = await prisma.folderCategory.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || existing.name,
        description: description !== undefined ? description : existing.description,
        color: color !== undefined ? color : existing.color,
        icon: icon !== undefined ? icon : existing.icon,
        parentId: parentId !== undefined ? (parentId || null) : existing.parentId,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
      },
      include: {
        parent: true,
        children: true,
        _count: { select: { documents: true } },
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
    const { moveDocumentsTo } = req.query;

    const category = await prisma.folderCategory.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // If category has documents, require moveDocumentsTo or set to null
    if (category._count.documents > 0) {
      if (moveDocumentsTo) {
        // Move documents to another category
        await prisma.document.updateMany({
          where: { folderCategoryId: req.params.id },
          data: { folderCategoryId: moveDocumentsTo === 'null' ? null : moveDocumentsTo },
        });
      } else {
        // Set documents' category to null
        await prisma.document.updateMany({
          where: { folderCategoryId: req.params.id },
          data: { folderCategoryId: null },
        });
      }
    }

    // Delete category (children will be cascade deleted)
    await prisma.folderCategory.delete({
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
    const { orders } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(orders)) {
      throw new BadRequestError('Orders must be an array');
    }

    // Update all orders in a transaction
    await prisma.$transaction(
      orders.map(({ id, displayOrder }) =>
        prisma.folderCategory.updateMany({
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkIsDescendant(categoryId, potentialDescendantId, tenantId) {
  const children = await prisma.folderCategory.findMany({
    where: { parentId: categoryId, tenantId },
    select: { id: true },
  });

  for (const child of children) {
    if (child.id === potentialDescendantId) {
      return true;
    }
    const isDesc = await checkIsDescendant(child.id, potentialDescendantId, tenantId);
    if (isDesc) return true;
  }

  return false;
}

module.exports = router;
