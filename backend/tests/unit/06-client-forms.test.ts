import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Client Forms', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let formId: string;
  let publicToken: string;

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
    if (formId) {
      await prisma.clientForm.delete({ where: { id: formId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('POST /api/client-forms', () => {
    it('should create a public client form', async () => {
      const response = await request(API_URL)
        .post('/api/client-forms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Nouveau Client Particulier',
          type: 'PHYSICAL',
          fields: [
            { name: 'firstName', label: 'Prénom', required: true },
            { name: 'lastName', label: 'Nom', required: true },
            { name: 'email', label: 'Email', required: true, type: 'email' },
            { name: 'phone', label: 'Téléphone', required: false },
          ],
          rgpdConsent: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('publicToken');
      formId = response.body.id;
      publicToken = response.body.publicToken;
    });
  });

  describe('GET /api/client-forms/:token (public)', () => {
    it('should get form configuration by public token', async () => {
      if (!publicToken) return;

      const response = await request(API_URL)
        .get(`/api/public/client-forms/${publicToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fields');
      expect(response.body.fields.length).toBeGreaterThan(0);
    });

    it('should return 404 for invalid token', async () => {
      const response = await request(API_URL)
        .get('/api/public/client-forms/invalid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/public/client-forms/:token/submit', () => {
    it('should submit form data and create client', async () => {
      if (!publicToken) return;

      const response = await request(API_URL)
        .post(`/api/public/client-forms/${publicToken}/submit`)
        .send({
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@test.com',
          phone: '06 12 34 56 78',
          rgpdConsent: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('clientId');
    });

    it('should reject form without RGPD consent', async () => {
      if (!publicToken) return;

      const response = await request(API_URL)
        .post(`/api/public/client-forms/${publicToken}/submit`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          rgpdConsent: false,
        });

      expect(response.status).toBe(400);
    });

    it('should validate required fields', async () => {
      if (!publicToken) return;

      const response = await request(API_URL)
        .post(`/api/public/client-forms/${publicToken}/submit`)
        .send({
          firstName: 'Test',
          // Missing lastName and email
          rgpdConsent: true,
        });

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      if (!publicToken) return;

      const response = await request(API_URL)
        .post(`/api/public/client-forms/${publicToken}/submit`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
          rgpdConsent: true,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/client-forms', () => {
    it('should list all cabinet forms', async () => {
      const response = await request(API_URL)
        .get('/api/client-forms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/client-forms/:id', () => {
    it('should update form configuration', async () => {
      if (!formId) return;

      const response = await request(API_URL)
        .put(`/api/client-forms/${formId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Formulaire Client Modifié',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Formulaire Client Modifié');
    });
  });

  describe('DELETE /api/client-forms/:id', () => {
    it('should deactivate form', async () => {
      if (!formId) return;

      const response = await request(API_URL)
        .delete(`/api/client-forms/${formId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204]).toContain(response.status);
      formId = ''; // Prevent cleanup error
    });
  });
});
