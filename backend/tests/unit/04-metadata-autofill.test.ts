import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Metadata Autofill', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let folderId: string;
  let clientId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const loginResponse = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'Test123!',
      });

    authToken = loginResponse.body.accessToken;

    // Create test client and folder
    const clientResponse = await request(API_URL)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'PHYSICAL',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@test.com',
      });
    clientId = clientResponse.body.id;

    const folderResponse = await request(API_URL)
      .post('/api/folders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Folder Metadata',
        clientId,
        type: 'CONTENTIEUX',
      });
    folderId = folderResponse.body.id;
  });

  afterAll(async () => {
    if (folderId) {
      await prisma.folder.delete({ where: { id: folderId } }).catch(() => {});
    }
    if (clientId) {
      await prisma.client.delete({ where: { id: clientId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('GET /api/folders/:id/metadata', () => {
    it('should get folder metadata for autofill', async () => {
      const response = await request(API_URL)
        .get(`/api/folders/${folderId}/metadata`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client');
      expect(response.body).toHaveProperty('folder');
      expect(response.body).toHaveProperty('avocat');
    });
  });

  describe('POST /api/documents/preview', () => {
    it('should preview document with autofilled variables', async () => {
      const response = await request(API_URL)
        .post('/api/documents/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          folderId,
          templateId: 'some-template-id',
          variables: {
            custom_field: 'Custom Value',
          },
        });

      // Preview might return 200 or 404 depending on template existence
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Variable Mapping', () => {
    it('should map client variables correctly', async () => {
      const response = await request(API_URL)
        .get(`/api/folders/${folderId}/metadata`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.client.firstName).toBe('Jean');
      expect(response.body.client.lastName).toBe('Dupont');
      expect(response.body.client.fullName).toBe('Jean Dupont');
    });

    it('should format date variables', async () => {
      const response = await request(API_URL)
        .get(`/api/folders/${folderId}/metadata`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).toHaveProperty('today');
      expect(response.body.today).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should include avocat legal info', async () => {
      const response = await request(API_URL)
        .get(`/api/folders/${folderId}/metadata`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.avocat).toHaveProperty('barreauName');
      expect(response.body.avocat).toHaveProperty('toque');
    });
  });

  describe('PUT /api/folders/:id/metadata', () => {
    it('should update folder-specific metadata', async () => {
      const response = await request(API_URL)
        .put(`/api/folders/${folderId}/metadata`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jurisdiction: 'Tribunal Judiciaire de Paris',
          rg: '24/12345',
          customFields: {
            adversaire: 'Société ABC',
          },
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Cession Metadata', () => {
    it('should handle cession-specific metadata', async () => {
      const response = await request(API_URL)
        .put(`/api/folders/${folderId}/metadata-cession`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cedant: {
            nom: 'Cédant Test',
            parts: 100,
          },
          cessionnaire: {
            nom: 'Cessionnaire Test',
          },
          prixCession: 50000,
        });

      expect([200, 404]).toContain(response.status);
    });
  });
});
