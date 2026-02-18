const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all conversations for current user
 */
const getConversations = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            // We'll fetch user info separately
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Get user info for participants
    const userIds = [...new Set(conversations.flatMap(c => c.participants.map(p => p.userId)))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Format response
    const formatted = conversations.map(conv => {
      const myParticipant = conv.participants.find(p => p.userId === userId);
      const otherParticipants = conv.participants
        .filter(p => p.userId !== userId)
        .map(p => ({ ...p, user: userMap[p.userId] }));

      return {
        id: conv.id,
        subject: conv.subject,
        folderId: conv.folderId,
        participants: otherParticipants,
        lastMessage: conv.messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: myParticipant?.unreadCount || 0,
        createdAt: conv.createdAt,
      };
    });

    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single conversation with messages
 */
const getConversation = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId },
      },
    });

    if (!participant) {
      return errorResponse(res, 'Conversation non trouvee', 404);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    });

    // Get messages with pagination
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.message.count({
        where: { conversationId: id, isDeleted: false },
      }),
    ]);

    // Get user info
    const userIds = [
      ...new Set([
        ...conversation.participants.map(p => p.userId),
        ...messages.map(m => m.senderId),
      ]),
    ];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Mark as read
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date(), unreadCount: 0 },
    });

    return successResponse(res, {
      ...conversation,
      participants: conversation.participants.map(p => ({
        ...p,
        user: userMap[p.userId],
      })),
      messages: messages.reverse().map(m => ({
        ...m,
        sender: userMap[m.senderId],
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new conversation
 */
const createConversation = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;
    const { subject, participantIds, folderId, initialMessage } = req.body;

    // Validate participants
    if (!participantIds || participantIds.length === 0) {
      return errorResponse(res, 'Au moins un participant requis', 400);
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        subject,
        folderId,
        tenantId,
        lastMessageAt: initialMessage ? new Date() : null,
        participants: {
          create: [
            { userId },
            ...participantIds.map(id => ({ userId: id })),
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    // Create initial message if provided
    if (initialMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: initialMessage,
          senderId: userId,
          tenantId,
        },
      });

      // Update unread counts for other participants
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: { not: userId },
        },
        data: { unreadCount: 1 },
      });
    }

    return successResponse(res, conversation, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Send message to conversation
 */
const sendMessage = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;
    const { id } = req.params;
    const { content, attachments } = req.body;

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId },
      },
    });

    if (!participant) {
      return errorResponse(res, 'Conversation non trouvee', 404);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        content,
        attachments,
        senderId: userId,
        tenantId,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    // Update unread counts for other participants
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId: { not: userId },
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    });

    return successResponse(res, { ...message, sender }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit message
 */
const editMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id, messageId } = req.params;
    const { content } = req.body;

    // Verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      return errorResponse(res, 'Message non trouve', 404);
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
    });

    return successResponse(res, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id, messageId } = req.params;

    // Verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      return errorResponse(res, 'Message non trouve', 404);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return successResponse(res, { success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users available for messaging
 */
const getAvailableUsers = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;

    const users = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        id: { not: userId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return successResponse(res, users);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark conversation as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId,
      },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });

    return successResponse(res, { success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;

    const result = await prisma.conversationParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    });

    return successResponse(res, { unreadCount: result._sum.unreadCount || 0 });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  editMessage,
  deleteMessage,
  getAvailableUsers,
  markAsRead,
  getUnreadCount,
};
