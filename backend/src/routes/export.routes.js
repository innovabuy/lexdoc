const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');

router.use(authenticate);
router.use(enforceTenant);

// Export folder report
router.get('/folders/:id/pdf', exportController.exportFolderPDF);

// Export document list
router.get('/documents/pdf', exportController.exportDocumentListPDF);

// Export activity report
router.get('/activity/pdf', exportController.exportActivityPDF);

module.exports = router;
