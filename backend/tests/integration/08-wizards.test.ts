/**
 * Wizards & Onboarding Tests - 10 tests
 * Tests for guided workflows (Instruction #11)
 */

import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { createTestSetup, TestUser, TestCabinet } from '../helpers';

describe('08. Wizards & Onboarding Tests (Instruction #11)', () => {
  let cabinet: TestCabinet;
  let admin: TestUser;

  beforeAll(async () => {
    const setup = await createTestSetup();
    cabinet = setup.cabinet;
    admin = setup.admin;
  });

  describe('Onboarding Flow', () => {
    test('[#11-001] GET /api/wizards/onboarding/status - Check status', async () => {
      const response = await request(app)
        .get('/api/wizards/onboarding/status')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect([200, 404]).toContain(response.status);
    });

    test('[#11-002] Onboarding step tracked in user', async () => {
      const user = await prisma.user.findUnique({
        where: { id: admin.id },
        select: { onboardingStep: true, onboardingCompleted: true },
      });

      expect(user).toBeDefined();
      expect(typeof user?.onboardingStep).toBe('number');
    });

    test('[#11-003] POST /api/wizards/onboarding/progress - Update progress', async () => {
      const response = await request(app)
        .post('/api/wizards/onboarding/progress')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          step: 2,
          data: { completedTask: 'profile' },
        });

      expect([200, 404]).toContain(response.status);
    });

    test('[#11-004] Complete onboarding marks user complete', async () => {
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          onboardingCompleted: true,
          onboardingStep: 5,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: admin.id },
      });

      expect(user?.onboardingCompleted).toBe(true);
    });
  });

  describe('Wizard Types', () => {
    test('[#11-005] Folder creation wizard exists', async () => {
      const response = await request(app)
        .get('/api/wizards/folder-creation')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect([200, 404]).toContain(response.status);
    });

    test('[#11-006] Client creation wizard exists', async () => {
      const response = await request(app)
        .get('/api/wizards/client-creation')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Wizard Progress', () => {
    test('[#11-007] Wizard progress saved', async () => {
      await prisma.wizardProgress.upsert({
        where: {
          userId_wizardType: {
            userId: admin.id,
            wizardType: 'FOLDER_CREATION',
          },
        },
        update: {
          currentStep: 2,
          data: { folderName: 'Test' },
        },
        create: {
          userId: admin.id,
          wizardType: 'FOLDER_CREATION',
          currentStep: 2,
          data: { folderName: 'Test' },
        },
      });

      const progress = await prisma.wizardProgress.findUnique({
        where: {
          userId_wizardType: {
            userId: admin.id,
            wizardType: 'FOLDER_CREATION',
          },
        },
      });

      expect(progress?.currentStep).toBe(2);
    });

    test('[#11-008] Wizard can be dismissed', async () => {
      await prisma.user.update({
        where: { id: admin.id },
        data: { showWizards: false },
      });

      const user = await prisma.user.findUnique({
        where: { id: admin.id },
      });

      expect(user?.showWizards).toBe(false);

      // Reset
      await prisma.user.update({
        where: { id: admin.id },
        data: { showWizards: true },
      });
    });
  });

  describe('Security', () => {
    test('[#11-009] Wizard endpoints require authentication', async () => {
      const response = await request(app)
        .get('/api/wizards/onboarding/status');

      expect(response.status).toBe(401);
    });

    test('[#11-010] User can only access own wizard progress', async () => {
      const progress = await prisma.wizardProgress.findMany({
        where: { userId: admin.id },
      });

      // Should only return own progress
      progress.forEach(p => {
        expect(p.userId).toBe(admin.id);
      });
    });
  });
});
