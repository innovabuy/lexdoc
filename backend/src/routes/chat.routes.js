const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');

router.use(authenticate);
router.use(enforceTenant);

// GET / — alias: returns conversations (for /api/messages compatibility)
router.get('/', chatController.getConversations);

// Get available users for messaging
router.get('/users', chatController.getAvailableUsers);

// Get unread count
router.get('/unread', chatController.getUnreadCount);

// Get all conversations
router.get('/conversations', chatController.getConversations);

// Create new conversation
router.post('/conversations', chatController.createConversation);

// Get single conversation with messages
router.get('/conversations/:id', chatController.getConversation);

// Mark conversation as read
router.post('/conversations/:id/read', chatController.markAsRead);

// Send message to conversation
router.post('/conversations/:id/messages', chatController.sendMessage);

// Edit message
router.patch('/conversations/:id/messages/:messageId', chatController.editMessage);

// Delete message
router.delete('/conversations/:id/messages/:messageId', chatController.deleteMessage);

module.exports = router;
