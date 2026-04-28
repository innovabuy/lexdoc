const express = require('express');
const router = express.Router();

// Import routes
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const documentRoutes = require('./document.routes');
const clientRoutes = require('./client.routes');
const folderRoutes = require('./folder.routes');
const signatureRoutes = require('./signature.routes');
const lrarRoutes = require('./lrar.routes');
const webhookRoutes = require('./webhook.routes');
const legalInfoRoutes = require('./legal-info.routes');
const builderRoutes = require('./builder.routes');
const trackingRoutes = require('./tracking.routes');
const clientAccessRoutes = require('./client-access.routes');
const extranetRoutes = require('./extranet.routes');
const backupRoutes = require('./backup.routes');
const folderPersonRoutes = require('./folder-person.routes');
const debugRoutes = require('./debug.routes');
const folderCategoryRoutes = require('./folder-category.routes');
const templateCategoryRoutes = require('./template-category.routes');
const documentRequestRoutes = require('./document-request.routes');
const notificationRoutes = require('./notification.routes');
const exportRoutes = require('./export.routes');
const searchRoutes = require('./search.routes');
const deadlineRoutes = require('./deadline.routes');
const statisticsRoutes = require('./statistics.routes');
const chatRoutes = require('./chat.routes');
const onboardingRoutes = require('./onboarding.routes');
const templateRoutes = require('./template.routes');
const blockRoutes = require('./block.routes');
const docusignRoutes = require('./docusign.routes');
const sendingboxRoutes = require('./sendingbox.routes');
const treeTemplateRoutes = require('./tree-template.routes');
const userRoutes = require('./user.routes');
const settingsRoutes = require('./settings.routes');
const formTemplateRoutes = require('./form-template.routes');

// Register routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/clients', clientRoutes);
router.use('/folders', folderRoutes);
router.use('/signatures', signatureRoutes);
router.use('/lrar', lrarRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/legal-info', legalInfoRoutes);
router.use('/builder', builderRoutes);
router.use('/tracking', trackingRoutes);
router.use('/client-access', clientAccessRoutes);
router.use('/extranet', extranetRoutes);
router.use('/backups', backupRoutes);
router.use('/debug', debugRoutes);  // Before folderPersonRoutes (which applies auth globally)
router.use('/folder-categories', folderCategoryRoutes);
router.use('/template-categories', templateCategoryRoutes);
router.use('/document-requests', documentRequestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/export', exportRoutes);
router.use('/search', searchRoutes);
router.use('/deadlines', deadlineRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/chat', chatRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/templates', templateRoutes);
router.use('/blocks', blockRoutes);
router.use('/tree-templates', treeTemplateRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/form-templates', formTemplateRoutes);
router.use('/integrations/docusign', docusignRoutes);
router.use('/integrations/sendingbox', sendingboxRoutes);
router.use('/documents', docusignRoutes); // For /documents/:id/sign and /documents/:id/send-registered
router.use('/', folderPersonRoutes);

// Route aliases for common paths
router.use('/dashboard', statisticsRoutes);   // /api/dashboard/stats → /api/statistics/dashboard alias
router.use('/messages', chatRoutes);           // /api/messages → /api/chat/* alias

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LexDoc API v2.0',
    version: '2.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      documents: '/api/documents',
      clients: '/api/clients',
      folders: '/api/folders',
      signatures: '/api/signatures',
      lrar: '/api/lrar',
      webhooks: '/api/webhooks',
      legalInfo: '/api/legal-info',
      builder: '/api/builder',
      tracking: '/api/tracking',
      clientAccess: '/api/client-access',
      extranet: '/api/extranet',
      backups: '/api/backups',
      folderCategories: '/api/folder-categories',
      templateCategories: '/api/template-categories',
      documentRequests: '/api/document-requests',
      notifications: '/api/notifications',
      folderPersons: '/api/folders/:folderId/persons',
    },
  });
});

module.exports = router;
