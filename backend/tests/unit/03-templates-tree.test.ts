import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Templates Tree', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let templateId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const loginResponse = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'Test123!',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (templateId) {
      await prisma.builderTemplate.delete({ where: { id: templateId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('GET /api/templates', () => {
    it('should list all templates', async () => {
      const response = await request(API_URL)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter templates by category', async () => {
      const response = await request(API_URL)
        .get('/api/templates?category=PROCEDURE_CIVILE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.forEach((template: any) => {
        expect(template.category).toBe('PROCEDURE_CIVILE');
      });
    });

    it('should filter templates by subcategory', async () => {
      const response = await request(API_URL)
        .get('/api/templates?subcategory=Assignations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/templates', () => {
    it('should create a new template', async () => {
      const response = await request(API_URL)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Template',
          category: 'PROCEDURE_CIVILE',
          subcategory: 'Assignations',
          blocks: [
            { type: 'HEADER', content: 'Test Header' },
            { type: 'PARAGRAPH', content: 'Test content' },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      templateId = response.body.id;
    });

    it('should validate required fields', async () => {
      const response = await request(API_URL)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing name and category
          blocks: [],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should get template by id', async () => {
      const response = await request(API_URL)
        .get(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(templateId);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(API_URL)
        .get('/api/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/templates/:id', () => {
    it('should update template', async () => {
      const response = await request(API_URL)
        .put(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Template',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Test Template');
    });
  });

  describe('POST /api/templates/:id/favorite', () => {
    it('should mark template as favorite', async () => {
      const response = await request(API_URL)
        .post(`/api/templates/${templateId}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isFavorite).toBe(true);
    });
  });

  describe('DELETE /api/templates/:id/favorite', () => {
    it('should remove template from favorites', async () => {
      const response = await request(API_URL)
        .delete(`/api/templates/${templateId}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isFavorite).toBe(false);
    });
  });

  describe('GET /api/templates/categories', () => {
    it('should list all categories with counts', async () => {
      const response = await request(API_URL)
        .get('/api/templates/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    it('should delete template', async () => {
      const response = await request(API_URL)
        .delete(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204]).toContain(response.status);
      templateId = ''; // Reset to prevent cleanup error
    });
  });
});
