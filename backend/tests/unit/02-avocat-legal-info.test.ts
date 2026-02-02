import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Avocat Legal Info', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Login to get auth token
    const loginResponse = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'Test123!',
      });

    authToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user?.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/legal-info', () => {
    it('should get user legal information', async () => {
      const response = await request(API_URL)
        .get('/api/legal-info')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('barreauName');
      expect(response.body).toHaveProperty('toque');
    });
  });

  describe('PUT /api/legal-info', () => {
    it('should update legal information', async () => {
      const response = await request(API_URL)
        .put('/api/legal-info')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          barreauName: 'Paris',
          toque: 'A0123',
          rcp: 'AXA - Police n°123456',
          carpaNumber: 'CARPA123',
          address: '10 rue de la Paix, 75001 Paris',
          phone: '01 23 45 67 89',
          fax: '01 23 45 67 90',
        });

      expect(response.status).toBe(200);
      expect(response.body.barreauName).toBe('Paris');
      expect(response.body.toque).toBe('A0123');
    });

    it('should validate required fields', async () => {
      const response = await request(API_URL)
        .put('/api/legal-info')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          barreauName: '', // Empty required field
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/legal-info/signature', () => {
    it('should upload signature image', async () => {
      const response = await request(API_URL)
        .post('/api/legal-info/signature')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('signature', Buffer.from('fake-image'), 'signature.png');

      expect([200, 201]).toContain(response.status);
    });

    it('should reject non-image files', async () => {
      const response = await request(API_URL)
        .post('/api/legal-info/signature')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('signature', Buffer.from('not an image'), 'test.txt');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/legal-info/stamp', () => {
    it('should upload stamp image', async () => {
      const response = await request(API_URL)
        .post('/api/legal-info/stamp')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('stamp', Buffer.from('fake-image'), 'stamp.png');

      expect([200, 201]).toContain(response.status);
    });
  });

  describe('DELETE /api/legal-info/signature', () => {
    it('should delete signature', async () => {
      const response = await request(API_URL)
        .delete('/api/legal-info/signature')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });
});
