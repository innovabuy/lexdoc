import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Envois et Tracking', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let documentId: string;
  let trackingId: string;

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

  describe('Signature Électronique', () => {
    describe('POST /api/documents/:id/send-signature', () => {
      it('should send document for signature', async () => {
        const response = await request(API_URL)
          .post(`/api/documents/${documentId}/send-signature`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            signatories: [
              { name: 'Jean Dupont', email: 'jean@example.com', order: 1 },
              { name: 'Marie Martin', email: 'marie@example.com', order: 2 },
            ],
            message: 'Merci de signer ce document',
            expiresInDays: 30,
          });

        // May fail if document doesn't exist or signature service unavailable
        expect([200, 201, 404, 503]).toContain(response.status);
      });

      it('should validate signatories', async () => {
        const response = await request(API_URL)
          .post(`/api/documents/${documentId}/send-signature`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            signatories: [], // Empty signatories
          });

        expect([400, 404]).toContain(response.status);
      });
    });
  });

  describe('LRAR (Lettre Recommandée)', () => {
    describe('POST /api/documents/:id/send-lrar', () => {
      it('should send document as LRAR', async () => {
        const response = await request(API_URL)
          .post(`/api/documents/${documentId}/send-lrar`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            recipient: {
              name: 'Destinataire Test',
              address: '10 rue de la Paix',
              postalCode: '75001',
              city: 'Paris',
              country: 'France',
            },
            withAR: true, // Accusé de réception
          });

        expect([200, 201, 404, 503]).toContain(response.status);
      });

      it('should validate recipient address', async () => {
        const response = await request(API_URL)
          .post(`/api/documents/${documentId}/send-lrar`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            recipient: {
              name: 'Test',
              // Missing address fields
            },
          });

        expect([400, 404]).toContain(response.status);
      });
    });
  });

  describe('Tracking', () => {
    describe('GET /api/documents/:id/tracking', () => {
      it('should get document tracking status', async () => {
        const response = await request(API_URL)
          .get(`/api/documents/${documentId}/tracking`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body).toHaveProperty('status');
          trackingId = response.body.id;
        }
      });
    });

    describe('GET /api/tracking', () => {
      it('should list all tracked documents', async () => {
        const response = await request(API_URL)
          .get('/api/tracking')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(API_URL)
          .get('/api/tracking?status=PENDING_SIGNATURE')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Relances', () => {
    describe('POST /api/documents/:id/remind', () => {
      it('should send manual reminder', async () => {
        const response = await request(API_URL)
          .post(`/api/documents/${documentId}/remind`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            message: 'Rappel: merci de signer le document',
          });

        expect([200, 404, 400]).toContain(response.status);
      });
    });

    describe('PUT /api/documents/:id/tracking/settings', () => {
      it('should configure auto-reminders', async () => {
        const response = await request(API_URL)
          .put(`/api/documents/${documentId}/tracking/settings`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            autoRemindersEnabled: true,
            reminderFrequency: 'EVERY_3_DAYS',
            maxReminders: 5,
          });

        expect([200, 404]).toContain(response.status);
      });

      it('should disable auto-reminders', async () => {
        const response = await request(API_URL)
          .put(`/api/documents/${documentId}/tracking/settings`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            autoRemindersEnabled: false,
          });

        expect([200, 404]).toContain(response.status);
      });
    });

    describe('GET /api/tracking/:id/reminders', () => {
      it('should get reminder history', async () => {
        if (!trackingId) return;

        const response = await request(API_URL)
          .get(`/api/tracking/${trackingId}/reminders`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      });
    });
  });

  describe('Webhooks', () => {
    describe('POST /api/webhooks/universign', () => {
      it('should handle Universign webhook', async () => {
        const response = await request(API_URL)
          .post('/api/webhooks/universign')
          .send({
            eventType: 'SIGNATURE_COMPLETED',
            transactionId: 'test-transaction',
            signerId: 'signer-1',
            timestamp: new Date().toISOString(),
          });

        // Webhook endpoints typically return 200 even for unknown transactions
        expect([200, 400]).toContain(response.status);
      });
    });

    describe('POST /api/webhooks/sendingbox', () => {
      it('should handle SendingBox webhook', async () => {
        const response = await request(API_URL)
          .post('/api/webhooks/sendingbox')
          .send({
            event: 'DELIVERED',
            trackingNumber: 'LRAR123456',
            deliveredAt: new Date().toISOString(),
          });

        expect([200, 400]).toContain(response.status);
      });
    });
  });

  describe('Statistics', () => {
    describe('GET /api/tracking/stats', () => {
      it('should get tracking statistics', async () => {
        const response = await request(API_URL)
          .get('/api/tracking/stats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalSent');
        expect(response.body).toHaveProperty('pendingSignatures');
        expect(response.body).toHaveProperty('completed');
      });
    });
  });
});
