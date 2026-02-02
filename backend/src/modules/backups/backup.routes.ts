import { Router } from 'express';
import { backupController } from './backup.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get backup statistics
router.get('/stats', backupController.getStatistics.bind(backupController));

// Get backup configuration
router.get('/config', backupController.getConfiguration.bind(backupController));

// List all backups
router.get('/', backupController.listBackups.bind(backupController));

// Trigger manual backup (admin only)
router.post('/trigger', backupController.triggerBackup.bind(backupController));

// Test backup configuration (admin only)
router.post('/test', backupController.testConfiguration.bind(backupController));

// Get specific backup
router.get('/:backupId', backupController.getBackup.bind(backupController));

// Get backup manifest
router.get('/:backupId/manifest', backupController.getManifest.bind(backupController));

export default router;
