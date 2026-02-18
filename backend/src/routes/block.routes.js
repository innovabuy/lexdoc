const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const { successResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

router.use(authenticate);
router.use(enforceTenant);

// GET /api/blocks — list all blocks for the cabinet
router.get('/', async (req, res, next) => {
  try {
    const { category, search, isSystem } = req.query;

    const where = {
      OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      deletedAt: null,
    };

    if (category) where.category = category;
    if (isSystem !== undefined) where.isSystem = isSystem === 'true';
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const blocks = await prisma.builderBlock.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { displayOrder: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        category: true,
        title: true,
        content: true,
        variables: true,
        tags: true,
        isMandatory: true,
        isSystem: true,
        displayOrder: true,
        usageCount: true,
        createdAt: true,
      },
    });

    // Group by type for the editor
    const system = blocks.filter(b => b.isSystem);
    const standard = blocks.filter(b => !b.isSystem && !b.tags?.includes('custom'));
    const custom = blocks.filter(b => !b.isSystem && b.tags?.includes('custom'));

    return successResponse(res, {
      blocks,
      grouped: {
        system,
        standard,
        custom,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/blocks — create custom block
router.post('/', async (req, res, next) => {
  try {
    const { title, content, category, variables, tags, displayOrder } = req.body;
    if (!title) throw new BadRequestError('title is required');
    if (!content) throw new BadRequestError('content is required');

    const block = await prisma.builderBlock.create({
      data: {
        tenantId: req.tenant.id,
        category: category || 'CUSTOM',
        title,
        content,
        variables: variables || null,
        tags: tags || ['custom'],
        isMandatory: false,
        isSystem: false,
        displayOrder: displayOrder || 50,
        createdById: req.user.id,
      },
    });

    return successResponse(res, block, 'Bloc cree', 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/blocks/:id — update block (not system)
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.builderBlock.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, isSystem: false },
    });
    if (!existing) throw new NotFoundError('Block not found or cannot be edited');

    const { title, content, category, variables, tags, displayOrder } = req.body;

    const block = await prisma.builderBlock.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(variables !== undefined && { variables }),
        ...(tags !== undefined && { tags }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    return successResponse(res, block, 'Bloc mis a jour');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/blocks/:id — delete (not system)
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.builderBlock.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id, isSystem: false },
    });
    if (!existing) throw new NotFoundError('Block not found or cannot be deleted');

    await prisma.builderBlock.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    return successResponse(res, null, 'Bloc supprime');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
