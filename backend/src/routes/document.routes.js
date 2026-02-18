const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, true); // Allow all for flexibility
    }
  },
});

router.use(authenticate);
router.use(enforceTenant);

// Bulk operations (before /:id routes)
router.post('/bulk-download', documentController.bulkDownload);
router.delete('/bulk-delete', documentController.bulkDelete);

// Document CRUD
router.get('/', documentController.list);
router.post('/', upload.single('file'), documentController.create);
router.get('/trash', documentController.getDeleted);
router.get('/:id', documentController.getById);
router.put('/:id', documentController.update);
router.delete('/:id', documentController.delete);

// Preview (inline display)
router.get('/:id/preview', documentController.preview);

// Download
router.get('/:id/download', documentController.download);

// Versioning
router.get('/:id/versions', documentController.getVersions);
router.post('/:id/versions', upload.single('file'), documentController.uploadVersion);

// Restore
router.post('/:id/restore', documentController.restore);

// Extranet visibility toggle
router.patch('/:id/extranet', documentController.toggleExtranet);

module.exports = router;
