const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');

router.use(authenticate);
router.use(enforceTenant);

// Dashboard overview
router.get('/dashboard', statisticsController.getDashboardStats);
router.get('/stats', statisticsController.getDashboardStats); // alias for /api/dashboard/stats

// Document statistics
router.get('/documents', statisticsController.getDocumentStats);

// Folder statistics
router.get('/folders', statisticsController.getFolderStats);

// Activity statistics
router.get('/activity', statisticsController.getActivityStats);

// Client statistics
router.get('/clients', statisticsController.getClientStats);

module.exports = router;
