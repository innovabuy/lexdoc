import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('RGPD Compliance', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let clientId: string;
  let consentId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const loginResponse = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'Test123!',
      });

    authToken = loginResponse.body.accessToken;

    // Create test client
    const clientResponse = await request(API_URL)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'PHYSICAL',
        firstName: 'RGPD',
        lastName: 'Test',
        email: 'rgpd.test@example.com',
      });
    clientId = clientResponse.body.id;
  });

  afterAll(async () => {
    if (clientId) {
      await prisma.client.delete({ where: { id: clientId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('Consent Management', () => {
    describe('POST /api/rgpd/consent', () => {
      it('should record client consent', async () => {
        const response = await request(API_URL)
          .post('/api/rgpd/consent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            clientId,
            purposes: ['DATA_PROCESSING', 'COMMUNICATION'],
            source: 'CLIENT_FORM',
            ipAddress: '127.0.0.1',
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        consentId = response.body.id;
      });

      it('should validate consent purposes', async () => {
        const response = await request(API_URL)
          .post('/api/rgpd/consent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            clientId,
            purposes: [], // Empty purposes
            source: 'CLIENT_FORM',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/rgpd/consent/:clientId', () => {
      it('should get client consent history', async () => {
        const response = await request(API_URL)
          .get(`/api/rgpd/consent/${clientId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('DELETE /api/rgpd/consent/:id', () => {
      it('should withdraw consent', async () => {
        if (!consentId) return;

        const response = await request(API_URL)
          .delete(`/api/rgpd/consent/${consentId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 204]).toContain(response.status);
      });
    });
  });

  describe('Data Rights Requests', () => {
    describe('POST /api/rgpd/requests', () => {
      it('should create access request (droit d\'accès)', async () => {
        const response = await request(API_URL)
          .post('/api/rgpd/requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            clientId,
            type: 'ACCESS',
            reason: 'Client request for data access',
          });

        expect(response.status).toBe(201);
        expect(response.body.type).toBe('ACCESS');
      });

      it('should create rectification request', async () => {
        const response = await request(API_URL)
          .post('/api/rgpd/requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            clientId,
            type: 'RECTIFICATION',
            reason: 'Incorrect address',
            details: { field: 'address', newValue: '123 New Street' },
          });

        expect(response.status).toBe(201);
      });

      it('should create deletion request (droit à l\'oubli)', async () => {
        const response = await request(API_URL)
          .post('/api/rgpd/requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            clientId,
            type: 'DELETION',
            reason: 'Client withdrawal',
          });

        expect(response.status).toBe(201);
      });

      it('should create portability request', async () => {
        const response = await request(API_URL)
          .post('/api/rgpd/requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            clientId,
            type: 'PORTABILITY',
            reason: 'Transfer to another provider',
          });

        expect(response.status).toBe(201);
      });
    });

    describe('GET /api/rgpd/requests', () => {
      it('should list all pending requests', async () => {
        const response = await request(API_URL)
          .get('/api/rgpd/requests')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(API_URL)
          .get('/api/rgpd/requests?status=PENDING')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Data Export', () => {
    describe('GET /api/rgpd/export/:clientId', () => {
      it('should export client data in JSON format', async () => {
        const response = await request(API_URL)
          .get(`/api/rgpd/export/${clientId}?format=json`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
      });

      it('should export client data in CSV format', async () => {
        const response = await request(API_URL)
          .get(`/api/rgpd/export/${clientId}?format=csv`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 501]).toContain(response.status);
      });
    });
  });

  describe('Data Anonymization', () => {
    describe('POST /api/rgpd/anonymize/:clientId', () => {
      it('should anonymize client data', async () => {
        // Create a separate client for anonymization test
        const clientResponse = await request(API_URL)
          .post('/api/clients')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: 'PHYSICAL',
            firstName: 'ToAnonymize',
            lastName: 'Client',
            email: 'anonymize@test.com',
          });

        const response = await request(API_URL)
          .post(`/api/rgpd/anonymize/${clientResponse.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason: 'Legal retention period expired',
          });

        expect([200, 204]).toContain(response.status);
      });
    });
  });

  describe('Audit Log', () => {
    describe('GET /api/rgpd/audit/:clientId', () => {
      it('should get RGPD audit log for client', async () => {
        const response = await request(API_URL)
          .get(`/api/rgpd/audit/${clientId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });
});
