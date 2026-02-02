import { prisma } from '@/config/database';
import { WizardType } from '@prisma/client';
import { AppError } from '@/utils/errors';

interface WizardStepData {
  currentStep: number;
  data: Record<string, any>;
}

const WIZARD_TOTAL_STEPS: Record<WizardType, number> = {
  ONBOARDING: 7,
  FOLDER_CREATION: 5,
  DOCUMENT_GENERATION: 5,
  CLIENT_CREATION: 3,
};

class WizardsService {
  /**
   * Get or create wizard progress
   */
  async getOrCreateProgress(userId: string, wizardType: WizardType) {
    let progress = await prisma.wizardProgress.findUnique({
      where: {
        userId_wizardType: { userId, wizardType },
      },
    });

    if (!progress) {
      progress = await prisma.wizardProgress.create({
        data: {
          userId,
          wizardType,
          currentStep: 0,
          totalSteps: WIZARD_TOTAL_STEPS[wizardType],
          data: {},
        },
      });
    }

    return progress;
  }

  /**
   * Update wizard progress
   */
  async updateProgress(
    userId: string,
    wizardType: WizardType,
    stepData: WizardStepData
  ) {
    const progress = await this.getOrCreateProgress(userId, wizardType);

    const isCompleted = stepData.currentStep >= progress.totalSteps - 1;

    return prisma.wizardProgress.update({
      where: { id: progress.id },
      data: {
        currentStep: stepData.currentStep,
        data: {
          ...(progress.data as object),
          ...stepData.data,
        },
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
  }

  /**
   * Complete wizard
   */
  async completeWizard(userId: string, wizardType: WizardType) {
    const progress = await this.getOrCreateProgress(userId, wizardType);

    const updated = await prisma.wizardProgress.update({
      where: { id: progress.id },
      data: {
        completed: true,
        completedAt: new Date(),
        currentStep: progress.totalSteps,
      },
    });

    // If onboarding wizard, also update user
    if (wizardType === 'ONBOARDING') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          onboardingData: progress.data as object,
        },
      });
    }

    return updated;
  }

  /**
   * Skip wizard
   */
  async skipWizard(userId: string, wizardType: WizardType) {
    const progress = await this.getOrCreateProgress(userId, wizardType);

    const updated = await prisma.wizardProgress.update({
      where: { id: progress.id },
      data: {
        abandonedAt: new Date(),
      },
    });

    // If onboarding wizard, mark as completed (skipped)
    if (wizardType === 'ONBOARDING') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
        },
      });
    }

    return updated;
  }

  /**
   * Reset wizard progress
   */
  async resetWizard(userId: string, wizardType: WizardType) {
    return prisma.wizardProgress.upsert({
      where: {
        userId_wizardType: { userId, wizardType },
      },
      create: {
        userId,
        wizardType,
        currentStep: 0,
        totalSteps: WIZARD_TOTAL_STEPS[wizardType],
        data: {},
      },
      update: {
        currentStep: 0,
        data: {},
        completed: false,
        completedAt: null,
        abandonedAt: null,
      },
    });
  }

  /**
   * Get all wizard progress for a user
   */
  async getUserWizardProgress(userId: string) {
    const progresses = await prisma.wizardProgress.findMany({
      where: { userId },
    });

    // Create a map with all wizard types
    const result: Record<string, any> = {};
    for (const type of Object.keys(WIZARD_TOTAL_STEPS) as WizardType[]) {
      const progress = progresses.find((p) => p.wizardType === type);
      result[type] = progress || {
        wizardType: type,
        currentStep: 0,
        totalSteps: WIZARD_TOTAL_STEPS[type],
        completed: false,
        data: {},
      };
    }

    return result;
  }

  /**
   * Check if user needs onboarding
   */
  async needsOnboarding(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    });

    return !user?.onboardingCompleted;
  }

  /**
   * Update user onboarding preferences
   */
  async updateOnboardingPreferences(
    userId: string,
    preferences: { showWizards?: boolean }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        showWizards: preferences.showWizards,
      },
    });
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingData: true,
        showWizards: true,
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouve', 404);
    }

    return user;
  }
}

export const wizardsService = new WizardsService();
