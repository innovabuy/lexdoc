const prisma = require('../config/database');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/helpers');
const notificationService = require('../services/notification.service');
const timeline = require('../services/timeline.service');

/**
 * List deadlines with filters
 */
const list = async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { status, type, folderId, assignedToId, startDate, endDate, priority } = req.query;

    const where = { tenantId: req.tenant.id };

    if (status) where.status = status;
    if (type) where.type = type;
    if (folderId) where.folderId = folderId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (priority) where.priority = priority;

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    const [deadlines, total] = await Promise.all([
      prisma.deadline.findMany({
        where,
        skip,
        take,
        orderBy: { dueDate: 'asc' },
        include: {
          folder: { select: { id: true, title: true, reference: true, color: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.deadline.count({ where }),
    ]);

    return paginatedResponse(res, deadlines, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get calendar view data (for a month)
 */
const getCalendar = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const deadlines = await prisma.deadline.findMany({
      where: {
        tenantId: req.tenant.id,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'CANCELLED' },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        folder: { select: { id: true, title: true, color: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Group by date
    const byDate = {};
    for (const deadline of deadlines) {
      const dateKey = deadline.dueDate.toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(deadline);
    }

    return successResponse(res, {
      deadlines,
      byDate,
      month: parseInt(month),
      year: parseInt(year),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming deadlines
 */
const getUpcoming = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const deadlines = await prisma.deadline.findMany({
      where: {
        tenantId: req.tenant.id,
        dueDate: {
          gte: new Date(),
          lte: endDate,
        },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
      include: {
        folder: { select: { id: true, title: true, color: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return successResponse(res, deadlines);
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue deadlines
 */
const getOverdue = async (req, res, next) => {
  try {
    const deadlines = await prisma.deadline.findMany({
      where: {
        tenantId: req.tenant.id,
        dueDate: { lt: new Date() },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        folder: { select: { id: true, title: true, color: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Mark as overdue
    if (deadlines.length > 0) {
      await prisma.deadline.updateMany({
        where: {
          id: { in: deadlines.map(d => d.id) },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        data: { status: 'OVERDUE' },
      });
    }

    return successResponse(res, deadlines);
  } catch (error) {
    next(error);
  }
};

/**
 * Get deadline by ID
 */
const getById = async (req, res, next) => {
  try {
    const deadline = await prisma.deadline.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
      },
      include: {
        folder: { select: { id: true, title: true, reference: true, color: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!deadline) {
      throw new NotFoundError('Echeance non trouvee');
    }

    return successResponse(res, deadline);
  } catch (error) {
    next(error);
  }
};

/**
 * Create deadline
 */
const create = async (req, res, next) => {
  try {
    const {
      title,
      description,
      dueDate,
      dueTime,
      type = 'DEADLINE',
      priority = 'NORMAL',
      folderId,
      assignedToId,
      reminders,
    } = req.body;

    if (!title || !dueDate) {
      throw new BadRequestError('Titre et date requis');
    }

    const deadline = await prisma.deadline.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        dueTime,
        type,
        priority,
        folderId: folderId || null,
        assignedToId: assignedToId || null,
        reminders: reminders || [{ daysBefore: 1 }, { daysBefore: 7 }],
        createdById: req.user.id,
        tenantId: req.tenant.id,
      },
      include: {
        folder: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Notify assigned user
    if (assignedToId && assignedToId !== req.user.id) {
      await notificationService.create({
        userId: assignedToId,
        tenantId: req.tenant.id,
        type: 'DEADLINE_APPROACHING',
        title: 'Nouvelle echeance assignee',
        message: `Vous avez ete assigne a l'echeance "${title}" pour le ${new Date(dueDate).toLocaleDateString('fr-FR')}.`,
        entityType: 'Deadline',
        entityId: deadline.id,
        link: '/calendar',
      });
    }

    // Timeline event
    if (deadline.folderId) {
      const typeLabels = { DEADLINE: 'Échéance', HEARING: 'Audience', MEETING: 'Rendez-vous', REMINDER: 'Rappel', TASK: 'Tâche', OTHER: 'Autre' };
      await timeline.addEvent({
        folderId: deadline.folderId,
        type: 'echeance_creee',
        description: `${typeLabels[type] || 'Échéance'} créée : "${title}" (${new Date(dueDate).toLocaleDateString('fr-FR')})`,
        userId: req.user.id,
        metadata: { deadlineId: deadline.id, type, priority, dueDate },
      });
    }

    return successResponse(res, deadline, 'Echeance creee', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update deadline
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      dueDate,
      dueTime,
      type,
      priority,
      status,
      folderId,
      assignedToId,
      reminders,
    } = req.body;

    const existing = await prisma.deadline.findFirst({
      where: { id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Echeance non trouvee');
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (dueTime !== undefined) data.dueTime = dueTime;
    if (type !== undefined) data.type = type;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) {
      data.status = status;
      if (status === 'COMPLETED') {
        data.completedAt = new Date();
        data.completedById = req.user.id;
      }
    }
    if (folderId !== undefined) data.folderId = folderId || null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (reminders !== undefined) data.reminders = reminders;

    const deadline = await prisma.deadline.update({
      where: { id },
      data,
      include: {
        folder: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return successResponse(res, deadline, 'Echeance mise a jour');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete deadline
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.deadline.findFirst({
      where: { id, tenantId: req.tenant.id },
    });

    if (!existing) {
      throw new NotFoundError('Echeance non trouvee');
    }

    await prisma.deadline.delete({ where: { id } });

    return successResponse(res, null, 'Echeance supprimee');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark deadline as complete
 */
const complete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.deadline.findFirst({
      where: { id, tenantId: req.tenant.id },
      select: { id: true, title: true, folderId: true },
    });

    const deadline = await prisma.deadline.updateMany({
      where: { id, tenantId: req.tenant.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedById: req.user.id,
      },
    });

    // Timeline event
    if (existing?.folderId) {
      await timeline.addEvent({
        folderId: existing.folderId,
        type: 'echeance_terminee',
        description: `Échéance terminée : "${existing.title}"`,
        userId: req.user.id,
        metadata: { deadlineId: id },
      });
    }

    return successResponse(res, null, 'Echeance terminee');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  getCalendar,
  getUpcoming,
  getOverdue,
  getById,
  create,
  update,
  remove,
  complete,
};
