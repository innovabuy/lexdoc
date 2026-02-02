import { Router } from 'express';
import { wizardsController } from './wizards.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Onboarding status
router.get(
  '/onboarding/status',
  wizardsController.getOnboardingStatus.bind(wizardsController)
);

// Get all wizard progress
router.get('/all', wizardsController.getAllProgress.bind(wizardsController));

// Update preferences
router.patch(
  '/preferences',
  wizardsController.updatePreferences.bind(wizardsController)
);

// Wizard-specific routes
router.get(
  '/:type/progress',
  wizardsController.getProgress.bind(wizardsController)
);

router.put(
  '/:type/progress',
  wizardsController.updateProgress.bind(wizardsController)
);

router.post(
  '/:type/complete',
  wizardsController.completeWizard.bind(wizardsController)
);

router.post('/:type/skip', wizardsController.skipWizard.bind(wizardsController));

router.post(
  '/:type/reset',
  wizardsController.resetWizard.bind(wizardsController)
);

export default router;
