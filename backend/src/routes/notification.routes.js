const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Get preferences
router.get('/preferences', notificationController.getPreferences);

// Update preferences
router.put('/preferences', notificationController.updatePreferences);

// Mark all as read
router.post('/mark-all-read', notificationController.markAllAsRead);

// Mark one as read
router.post('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
