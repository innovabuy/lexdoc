const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const onboardingController = require('../controllers/onboarding.controller');

router.use(authenticate);

router.get('/status', onboardingController.getStatus);
router.post('/step/:step', onboardingController.saveStep);
router.post('/complete', onboardingController.complete);

module.exports = router;
