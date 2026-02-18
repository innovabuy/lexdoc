const express = require('express');
const router = express.Router();
const deadlineController = require('../controllers/deadline.controller');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');

router.use(authenticate);
router.use(enforceTenant);

// List and filters
router.get('/', deadlineController.list);

// Calendar view
router.get('/calendar', deadlineController.getCalendar);

// Upcoming deadlines
router.get('/upcoming', deadlineController.getUpcoming);

// Overdue deadlines
router.get('/overdue', deadlineController.getOverdue);

// CRUD
router.get('/:id', deadlineController.getById);
router.post('/', deadlineController.create);
router.put('/:id', deadlineController.update);
router.delete('/:id', deadlineController.remove);

// Actions
router.post('/:id/complete', deadlineController.complete);

module.exports = router;
