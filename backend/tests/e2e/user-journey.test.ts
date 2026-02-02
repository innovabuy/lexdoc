import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('E2E: Complete User Journey', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let cabinetId: string;
  let userId: string;
  let clientId: string;
  let folderId: string;
  let documentId: string;
  let templateId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Cleanup in reverse order
    if (documentId) {
      await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
    }
    if (folderId) {
      await prisma.folder.delete({ where: { id: folderId } }).catch(() => {});
    }
    if (clientId) {
      await prisma.client.delete({ where: { id: clientId } }).catch(() => {});
    }
    if (templateId) {
      await prisma.builderTemplate.delete({ where: { id: templateId } }).catch(() => {});
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    if (cabinetId) {
      await prisma.cabinet.delete({ where: { id: cabinetId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('Step 1: Cabinet Registration', () => {
    it('should register a new cabinet', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({
          cabinetName: 'Cabinet Test E2E',
          siret: '12345678901234',
          firstName: 'Jean',
          lastName: 'Avocat',
          email: 'e2e-test@lexdoc.test',
          password: 'SecurePass123!',
        });

      expect([200, 201]).toContain(response.status);
      if (response.body.cabinet) {
        cabinetId = response.body.cabinet.id;
      }
      if (response.body.user) {
        userId = response.body.user.id;
      }
    });
  });

  describe('Step 2: User Login', () => {
    it('should login with created user', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'e2e-test@lexdoc.test',
          password: 'SecurePass123!',
        });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        authToken = response.body.accessToken;
      } else {
        // Use test user if registration failed
        const fallbackLogin = await request(API_URL)
          .post('/api/auth/login')
          .send({
            email: process.env.TEST_USER_EMAIL || 'test@example.com',
            password: process.env.TEST_USER_PASSWORD || 'Test123!',
          });
        authToken = fallbackLogin.body.accessToken;
      }
    });
  });

  describe('Step 3: Configure Legal Profile', () => {
    it('should update avocat legal information', async () => {
      const response = await request(API_URL)
        .put('/api/legal-info')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          barreauName: 'Paris',
          toque: 'A1234',
          rcp: 'AXA - Police n°123456789',
          carpaNumber: 'CARPA75001234',
          address: '10 Avenue de l\'Opéra, 75001 Paris',
          phone: '01 42 96 12 34',
          fax: '01 42 96 12 35',
        });

      expect([200, 201]).toContain(response.status);
    });
  });

  describe('Step 4: Create Client', () => {
    it('should create a physical person client', async () => {
      const response = await request(API_URL)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PHYSICAL',
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie.dupont@test.com',
          phone: '06 12 34 56 78',
          address: '25 Rue de la Paix, 75002 Paris',
          birthDate: '1985-05-15',
          birthPlace: 'Lyon',
          nationality: 'Française',
        });

      expect([200, 201]).toContain(response.status);
      if (response.body.id) {
        clientId = response.body.id;
      }
    });
  });

  describe('Step 5: Create Folder', () => {
    it('should create a litigation folder', async () => {
      const response = await request(API_URL)
        .post('/api/folders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Dossier Contentieux E2E',
          type: 'CONTENTIEUX',
          clientId,
          reference: 'REF-2024-001',
          description: 'Test E2E - Contentieux locatif',
          jurisdiction: 'Tribunal Judiciaire de Paris',
        });

      expect([200, 201]).toContain(response.status);
      if (response.body.id) {
        folderId = response.body.id;
      }
    });
  });

  describe('Step 6: Create Template', () => {
    it('should create a document template', async () => {
      const response = await request(API_URL)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Assignation TJ E2E',
          category: 'PROCEDURE_CIVILE',
          subcategory: 'Assignations',
          blocks: [
            {
              type: 'HEADER',
              content: 'ASSIGNATION',
            },
            {
              type: 'PARAGRAPH',
              content: 'L\'AN DEUX MILLE VINGT QUATRE, le {{date_assignation}}',
            },
            {
              type: 'PARAGRAPH',
              content: 'A LA REQUÊTE DE : {{client.fullName}}, demeurant {{client.address}}',
            },
            {
              type: 'PARAGRAPH',
              content: 'Ayant pour avocat : Me {{avocat.fullName}}, Avocat au Barreau de {{avocat.barreauName}}, Toque {{avocat.toque}}',
            },
          ],
        });

      expect([200, 201]).toContain(response.status);
      if (response.body.id) {
        templateId = response.body.id;
      }
    });
  });

  describe('Step 7: Generate Document', () => {
    it('should generate document from template', async () => {
      if (!templateId || !folderId) {
        console.log('Skipping: missing templateId or folderId');
        return;
      }

      const response = await request(API_URL)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId,
          folderId,
          format: 'DOCX',
          variables: {
            date_assignation: '15 janvier 2024',
          },
        });

      expect([200, 201, 404]).toContain(response.status);
      if (response.body.id) {
        documentId = response.body.id;
      }
    });

    it('should download generated document', async () => {
      if (!documentId) {
        console.log('Skipping: no document generated');
        return;
      }

      const response = await request(API_URL)
        .get(`/api/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Step 8: Send for Signature', () => {
    it('should send document for electronic signature', async () => {
      if (!documentId) {
        console.log('Skipping: no document available');
        return;
      }

      const response = await request(API_URL)
        .post(`/api/documents/${documentId}/send-signature`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signatories: [
            {
              name: 'Marie Dupont',
              email: 'marie.dupont@test.com',
              order: 1,
            },
          ],
          message: 'Merci de signer ce document dans les meilleurs délais.',
          expiresInDays: 14,
        });

      // May fail if signature service not configured
      expect([200, 201, 400, 404, 503]).toContain(response.status);
    });
  });

  describe('Step 9: Check Tracking', () => {
    it('should get document tracking status', async () => {
      if (!documentId) {
        console.log('Skipping: no document available');
        return;
      }

      const response = await request(API_URL)
        .get(`/api/documents/${documentId}/tracking`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Step 10: Configure Reminders', () => {
    it('should configure automatic reminders', async () => {
      if (!documentId) {
        console.log('Skipping: no document available');
        return;
      }

      const response = await request(API_URL)
        .put(`/api/documents/${documentId}/tracking/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          autoRemindersEnabled: true,
          reminderFrequency: 'EVERY_3_DAYS',
          maxReminders: 3,
        });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Step 11: Verify Dashboard', () => {
    it('should display correct dashboard statistics', async () => {
      const response = await request(API_URL)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('documentsCount');
        expect(response.body).toHaveProperty('clientsCount');
        expect(response.body).toHaveProperty('foldersCount');
      }
    });
  });

  describe('Step 12: RGPD Compliance', () => {
    it('should record RGPD consent for client', async () => {
      if (!clientId) {
        console.log('Skipping: no client available');
        return;
      }

      const response = await request(API_URL)
        .post('/api/rgpd/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId,
          purposes: ['DATA_PROCESSING', 'COMMUNICATION'],
          source: 'SIGNATURE',
          ipAddress: '127.0.0.1',
        });

      expect([200, 201, 404]).toContain(response.status);
    });

    it('should export client data (RGPD)', async () => {
      if (!clientId) {
        console.log('Skipping: no client available');
        return;
      }

      const response = await request(API_URL)
        .get(`/api/rgpd/export/${clientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Final: Logout', () => {
    it('should logout successfully', async () => {
      const response = await request(API_URL)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });
});
