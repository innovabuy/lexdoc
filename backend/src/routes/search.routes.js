const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');

router.use(authenticate);
router.use(enforceTenant);

// Global quick search
router.get('/', searchController.globalSearch);

// Advanced search with filters
router.get('/advanced', searchController.advancedSearch);

module.exports = router;
