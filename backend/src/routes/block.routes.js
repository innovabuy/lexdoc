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
        description: true,
        variables: true,
        tags: true,
        isMandatory: true,
        isSystem: true,
        isPersonalise: true,
        displayOrder: true,
        usageCount: true,
        createdAt: true,
      },
    });

    // Group by type for the editor
    const system = blocks.filter(b => b.isSystem);
    const personalise = blocks.filter(b => b.isPersonalise && !b.isSystem);
    const standard = blocks.filter(b => !b.isSystem && !b.isPersonalise && !b.tags?.includes('custom'));
    const custom = blocks.filter(b => !b.isSystem && !b.isPersonalise && b.tags?.includes('custom'));

    return successResponse(res, {
      blocks,
      grouped: {
        system,
        personalise,
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
    const { title, content, category, description, variables, tags, displayOrder, isPersonalise } = req.body;
    if (!title) throw new BadRequestError('title is required');
    if (!content) throw new BadRequestError('content is required');

    // Auto-extract variables from content if not explicitly provided
    let finalVars = variables || null;
    if (!variables && content) {
      const regex = /\{\{([^}]+)\}\}/g;
      const vars = new Set();
      let match;
      while ((match = regex.exec(content)) !== null) {
        const v = match[1].trim().split(' ')[0];
        if (!v.startsWith('#') && !v.startsWith('/') && v !== 'else' && !v.startsWith('@') && v !== 'this') {
          vars.add(v);
        }
      }
      if (vars.size > 0) finalVars = Array.from(vars);
    }

    const block = await prisma.builderBlock.create({
      data: {
        tenantId: req.tenant.id,
        category: category || 'CUSTOM',
        title,
        content,
        description: description || null,
        variables: finalVars,
        tags: tags || ['custom'],
        isMandatory: false,
        isSystem: false,
        isPersonalise: isPersonalise === true,
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

    const { title, content, category, description, variables, tags, displayOrder } = req.body;

    // Auto-extract variables if content changed
    let finalVars = variables;
    if (content !== undefined && variables === undefined) {
      const regex = /\{\{([^}]+)\}\}/g;
      const vars = new Set();
      let match;
      while ((match = regex.exec(content)) !== null) {
        const v = match[1].trim().split(' ')[0];
        if (!v.startsWith('#') && !v.startsWith('/') && v !== 'else' && !v.startsWith('@') && v !== 'this') {
          vars.add(v);
        }
      }
      finalVars = vars.size > 0 ? Array.from(vars) : existing.variables;
    }

    const block = await prisma.builderBlock.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(finalVars !== undefined && { variables: finalVars }),
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
