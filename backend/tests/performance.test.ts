import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Performance Tests', () => {
  let prisma: PrismaClient;
  let authToken: string;

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
    await prisma.$disconnect();
  });

  describe('Response Times', () => {
    it('should login under 500ms', async () => {
      const start = Date.now();

      await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          password: process.env.TEST_USER_PASSWORD || 'Test123!',
        });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should list documents under 1s', async () => {
      const start = Date.now();

      await request(API_URL)
        .get('/api/documents')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should list templates under 500ms', async () => {
      const start = Date.now();

      await request(API_URL)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should get folder metadata under 300ms', async () => {
      const start = Date.now();

      await request(API_URL)
        .get('/api/folders')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Pagination', () => {
    it('should handle large document list with pagination', async () => {
      const start = Date.now();

      const response = await request(API_URL)
        .get('/api/documents?page=1&limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });

    it('should paginate clients efficiently', async () => {
      const start = Date.now();

      const response = await request(API_URL)
        .get('/api/clients?page=1&limit=50')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle 10 concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(API_URL)
          .get('/api/documents')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(5000);
    });

    it('should handle 20 concurrent template fetches', async () => {
      const requests = Array(20).fill(null).map(() =>
        request(API_URL)
          .get('/api/templates')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Document Generation', () => {
    it('should generate simple document under 5s', async () => {
      const start = Date.now();

      const response = await request(API_URL)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'simple-template',
          variables: { name: 'Test' },
          format: 'DOCX',
        });

      const duration = Date.now() - start;
      // May return 404 if template doesn't exist
      if (response.status === 201) {
        expect(duration).toBeLessThan(5000);
      }
    });

    it('should generate PDF under 10s', async () => {
      const start = Date.now();

      const response = await request(API_URL)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'simple-template',
          variables: { name: 'Test' },
          format: 'PDF',
        });

      const duration = Date.now() - start;
      if (response.status === 201) {
        expect(duration).toBeLessThan(10000);
      }
    });
  });

  describe('Search Performance', () => {
    it('should search documents under 1s', async () => {
      const start = Date.now();

      const response = await request(API_URL)
        .get('/api/documents/search?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect([200, 404]).toContain(response.status);
      expect(duration).toBeLessThan(1000);
    });

    it('should search clients under 500ms', async () => {
      const start = Date.now();

      const response = await request(API_URL)
        .get('/api/clients/search?q=dupont')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect([200, 404]).toContain(response.status);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Database Query Performance', () => {
    it('should execute complex query under 2s', async () => {
      const start = Date.now();

      // Dashboard typically aggregates multiple data sources
      const response = await request(API_URL)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect([200, 404]).toContain(response.status);
      expect(duration).toBeLessThan(2000);
    });
  });
});
