const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/', healthController.getHealth);
router.get('/db', healthController.getDatabaseHealth);
router.get('/detailed', healthController.getDetailedHealth);

module.exports = router;
