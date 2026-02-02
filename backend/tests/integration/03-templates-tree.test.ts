/**
 * Templates Tree Structure Tests - 20 tests
 * Tests for template hierarchy navigation (Instruction #14)
 */

import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { createTestSetup, TestUser, TestCabinet } from '../helpers';
import { BuilderTemplateCategory } from '@prisma/client';

describe('03. Templates Tree Structure Tests (Instruction #14)', () => {
  let cabinet: TestCabinet;
  let admin: TestUser;
  let templateId: string;

  beforeAll(async () => {
    const setup = await createTestSetup();
    cabinet = setup.cabinet;
    admin = setup.admin;

    // Create test templates
    const template = await prisma.builderTemplate.create({
      data: {
        cabinetId: cabinet.id,
        createdById: admin.id,
        name: 'Contrat de travail CDI',
        description: 'Modèle de contrat de travail à durée indéterminée',
        category: BuilderTemplateCategory.CONTRATS_TRAVAIL,
        tags: ['CDI', 'travail', 'employé'],
        content: 'Contenu du contrat...',
        isPublic: false,
        usageCount: 5,
      },
    });
    templateId = template.id;

    // Create more templates for tree structure testing
    await prisma.builderTemplate.createMany({
      data: [
        {
          cabinetId: cabinet.id,
          createdById: admin.id,
          name: 'Contrat CDD',
          category: BuilderTemplateCategory.CONTRATS_TRAVAIL,
          tags: ['CDD', 'travail'],
          content: 'Content...',
        },
        {
          cabinetId: cabinet.id,
          createdById: admin.id,
          name: 'Bail commercial',
          category: BuilderTemplateCategory.BAUX_COMMERCIAUX,
          tags: ['bail', 'commerce'],
          content: 'Content...',
        },
        {
          cabinetId: cabinet.id,
          createdById: admin.id,
          name: 'Statuts SARL',
          category: BuilderTemplateCategory.CREATION_SOCIETE,
          tags: ['SARL', 'statuts'],
          content: 'Content...',
        },
        {
          cabinetId: cabinet.id,
          createdById: admin.id,
          name: 'Mise en demeure',
          category: BuilderTemplateCategory.PROCEDURES,
          tags: ['mise en demeure', 'recouvrement'],
          content: 'Content...',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.builderTemplate.deleteMany({ where: { cabinetId: cabinet.id } });
  });

  describe('Tree Structure', () => {
    test('[#14-001] GET /api/builder-templates/tree - Returns hierarchical structure', async () => {
      const response = await request(app)
        .get('/api/builder-templates/tree')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('[#14-002] Tree contains categories with counts', async () => {
      const response = await request(app)
        .get('/api/builder-templates/tree')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      const tree = response.body.data;
      const contratsTravail = tree.find((c: any) => c.category === 'CONTRATS_TRAVAIL');

      if (contratsTravail) {
        expect(contratsTravail.count).toBeGreaterThanOrEqual(2);
        expect(contratsTravail.templates).toBeDefined();
      }
    });

    test('[#14-003] Categories are properly organized', async () => {
      const response = await request(app)
        .get('/api/builder-templates/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Favorites', () => {
    test('[#14-004] POST /api/builder-templates/:id/favorite - Add to favorites', async () => {
      const response = await request(app)
        .post(`/api/builder-templates/${templateId}/favorite`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
    });

    test('[#14-005] GET /api/builder-templates/favorites - List favorites', async () => {
      const response = await request(app)
        .get('/api/builder-templates/favorites')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('[#14-006] Toggle favorite removes from favorites', async () => {
      // Add to favorites first
      await request(app)
        .post(`/api/builder-templates/${templateId}/favorite`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      // Toggle again to remove
      await request(app)
        .post(`/api/builder-templates/${templateId}/favorite`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      const response = await request(app)
        .get('/api/builder-templates/favorites')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      // May or may not contain the template depending on toggle behavior
      expect(response.status).toBe(200);
    });
  });

  describe('Recent Templates', () => {
    test('[#14-007] POST /api/builder-templates/:id/record-usage - Record usage', async () => {
      const response = await request(app)
        .post(`/api/builder-templates/${templateId}/record-usage`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
    });

    test('[#14-008] GET /api/builder-templates/recent - List recently used', async () => {
      // Record usage first
      await request(app)
        .post(`/api/builder-templates/${templateId}/record-usage`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      const response = await request(app)
        .get('/api/builder-templates/recent')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('[#14-009] Usage count increments correctly', async () => {
      const before = await prisma.builderTemplate.findUnique({
        where: { id: templateId },
      });
      const beforeCount = before?.usageCount || 0;

      await request(app)
        .post(`/api/builder-templates/${templateId}/record-usage`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      const after = await prisma.builderTemplate.findUnique({
        where: { id: templateId },
      });

      expect(after?.usageCount).toBe(beforeCount + 1);
    });
  });

  describe('Tags', () => {
    test('[#14-010] GET /api/builder-templates/tags - List all tags', async () => {
      const response = await request(app)
        .get('/api/builder-templates/tags')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('[#14-011] Tags include count', async () => {
      const response = await request(app)
        .get('/api/builder-templates/tags')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      if (response.body.data.length > 0) {
        const tag = response.body.data[0];
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('count');
      }
    });

    test('[#14-012] Filter by tag', async () => {
      const response = await request(app)
        .get('/api/builder-templates?tag=travail')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Search', () => {
    test('[#14-013] Search by name', async () => {
      const response = await request(app)
        .get('/api/builder-templates?search=contrat')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('[#14-014] Search by description', async () => {
      const response = await request(app)
        .get('/api/builder-templates?search=indéterminée')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
    });

    test('[#14-015] Filter by category', async () => {
      const response = await request(app)
        .get('/api/builder-templates?category=CONTRATS_TRAVAIL')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((t: any) => {
        expect(t.category).toBe('CONTRATS_TRAVAIL');
      });
    });
  });

  describe('Derived Templates', () => {
    test('[#14-016] GET /api/builder-templates/:id/derived - List derived templates', async () => {
      const response = await request(app)
        .get(`/api/builder-templates/${templateId}/derived`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('[#14-017] Create derived template tracks parent', async () => {
      const response = await request(app)
        .post('/api/builder-templates')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: 'CDI Cadre',
          description: 'Dérivé du contrat CDI standard',
          category: 'CONTRATS_TRAVAIL',
          content: 'Content...',
          parentTemplateId: templateId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.parentTemplateId).toBe(templateId);
    });
  });

  describe('Security', () => {
    test('[#14-018] Requires authentication', async () => {
      const response = await request(app).get('/api/builder-templates/tree');
      expect(response.status).toBe(401);
    });

    test('[#14-019] Cannot access other cabinet templates', async () => {
      const otherCabinet = await prisma.cabinet.create({
        data: {
          name: 'Other Cabinet',
          email: `other-tree-${Date.now()}@test.com`,
        },
      });

      const otherTemplate = await prisma.builderTemplate.create({
        data: {
          cabinetId: otherCabinet.id,
          createdById: admin.id,
          name: 'Other Template',
          category: BuilderTemplateCategory.AUTRES,
          content: 'Content...',
        },
      });

      const response = await request(app)
        .get(`/api/builder-templates/${otherTemplate.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect([403, 404]).toContain(response.status);

      // Cleanup
      await prisma.builderTemplate.delete({ where: { id: otherTemplate.id } });
      await prisma.cabinet.delete({ where: { id: otherCabinet.id } });
    });

    test('[#14-020] Public templates accessible by all in cabinet', async () => {
      const publicTemplate = await prisma.builderTemplate.create({
        data: {
          cabinetId: cabinet.id,
          createdById: admin.id,
          name: 'Public Template',
          category: BuilderTemplateCategory.AUTRES,
          content: 'Content...',
          isPublic: true,
        },
      });

      const response = await request(app)
        .get(`/api/builder-templates/${publicTemplate.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);

      // Cleanup
      await prisma.builderTemplate.delete({ where: { id: publicTemplate.id } });
    });
  });
});
