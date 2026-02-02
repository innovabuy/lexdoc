import { Request, Response, NextFunction } from 'express';
import { wizardsService } from './wizards.service';
import { ApiResponse } from '@/types';
import { WizardType } from '@prisma/client';

class WizardsController {
  /**
   * GET /api/wizards/onboarding/status
   * Check if user needs onboarding
   */
  async getOnboardingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await wizardsService.getOnboardingStatus(req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: status,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/wizards/:type/progress
   * Get wizard progress
   */
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const wizardType = req.params.type.toUpperCase() as WizardType;
      const progress = await wizardsService.getOrCreateProgress(
        req.user!.id,
        wizardType
      );

      const response: ApiResponse = {
        success: true,
        data: progress,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/wizards/:type/progress
   * Update wizard progress
   */
  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const wizardType = req.params.type.toUpperCase() as WizardType;
      const { currentStep, data } = req.body;

      const progress = await wizardsService.updateProgress(
        req.user!.id,
        wizardType,
        { currentStep, data }
      );

      const response: ApiResponse = {
        success: true,
        data: progress,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wizards/:type/complete
   * Complete wizard
   */
  async completeWizard(req: Request, res: Response, next: NextFunction) {
    try {
      const wizardType = req.params.type.toUpperCase() as WizardType;
      const progress = await wizardsService.completeWizard(
        req.user!.id,
        wizardType
      );

      const response: ApiResponse = {
        success: true,
        data: progress,
        message: 'Wizard complete',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wizards/:type/skip
   * Skip wizard
   */
  async skipWizard(req: Request, res: Response, next: NextFunction) {
    try {
      const wizardType = req.params.type.toUpperCase() as WizardType;
      const progress = await wizardsService.skipWizard(req.user!.id, wizardType);

      const response: ApiResponse = {
        success: true,
        data: progress,
        message: 'Wizard skipped',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wizards/:type/reset
   * Reset wizard progress
   */
  async resetWizard(req: Request, res: Response, next: NextFunction) {
    try {
      const wizardType = req.params.type.toUpperCase() as WizardType;
      const progress = await wizardsService.resetWizard(req.user!.id, wizardType);

      const response: ApiResponse = {
        success: true,
        data: progress,
        message: 'Wizard reset',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/wizards/all
   * Get all wizard progress for user
   */
  async getAllProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await wizardsService.getUserWizardProgress(req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: progress,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/wizards/preferences
   * Update wizard preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const { showWizards } = req.body;
      await wizardsService.updateOnboardingPreferences(req.user!.id, {
        showWizards,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Preferences updated',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const wizardsController = new WizardsController();
