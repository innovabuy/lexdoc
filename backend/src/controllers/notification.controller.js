const notificationService = require('../services/notification.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePaginationParams } = require('../utils/helpers');

/**
 * Get user's notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page, pageSize } = parsePaginationParams(req.query);
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getUserNotifications(req.user.id, {
      page,
      pageSize,
      unreadOnly,
    });

    return res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread count only
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user.id, {
      page: 1,
      pageSize: 1,
      unreadOnly: true,
    });

    return successResponse(res, { unreadCount: result.unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    return successResponse(res, null, 'Notification marquee comme lue');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, null, 'Toutes les notifications ont ete marquees comme lues');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    const prefs = await notificationService.getUserPreferences(req.user.id);
    return successResponse(res, prefs);
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const allowedFields = [
      'emailSignatures',
      'emailDocuments',
      'emailDeadlines',
      'emailMessages',
      'emailDigest',
      'digestFrequency',
      'pushEnabled',
      'pushSignatures',
      'pushDocuments',
      'pushDeadlines',
      'pushMessages',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const prefs = await notificationService.updatePreferences(req.user.id, updates);
    return successResponse(res, prefs, 'Preferences mises a jour');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const prisma = require('../config/database');
    await prisma.notification.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    return successResponse(res, null, 'Notification supprimee');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  deleteNotification,
};
