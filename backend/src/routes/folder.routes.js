const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folder.controller');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');

router.use(authenticate);
router.use(enforceTenant);

// Folder tree (hierarchy view)
router.get('/tree', folderController.getTree);

// Wizard creation (must be before /:id to avoid conflict)
router.post('/wizard', folderController.createWizard);

// Next reference
router.get('/next-reference', folderController.nextReference);

// Folder CRUD
router.get('/', folderController.list);
router.post('/', folderController.create);
router.get('/:id', folderController.getById);
router.put('/:id', folderController.update);
router.delete('/:id', folderController.delete);

// Status change
router.patch('/:id/status', folderController.patchStatus);

// Documents grouped by category
router.get('/:id/documents', folderController.getDocumentsGrouped);

// Signatures for folder
router.get('/:id/signatures', folderController.getSignatures);

// Timeline events
router.get('/:id/timeline', folderController.getTimeline);

// Doc categories
router.post('/:id/doc-categories', folderController.addDocCategory);

// Folder navigation
router.get('/:id/breadcrumb', folderController.getBreadcrumb);

// Move folder
router.post('/:id/move', folderController.move);

// Folder activity/timeline
router.get('/:id/activity', folderController.getActivity);

module.exports = router;
