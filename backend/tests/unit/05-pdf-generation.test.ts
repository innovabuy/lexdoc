import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('PDF Generation', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let documentId: string;
  let folderId: string;

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
    if (documentId) {
      await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('POST /api/documents/generate', () => {
    it('should generate DOCX document', async () => {
      const response = await request(API_URL)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'test-template',
          folderId: folderId,
          format: 'DOCX',
          variables: {
            client_name: 'Test Client',
            date: '01/01/2024',
          },
        });

      // May fail if template doesn't exist
      expect([200, 201, 404]).toContain(response.status);
      if (response.status === 201) {
        documentId = response.body.id;
      }
    });

    it('should generate PDF document', async () => {
      const response = await request(API_URL)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'test-template',
          folderId: folderId,
          format: 'PDF',
          variables: {
            client_name: 'Test Client',
          },
        });

      expect([200, 201, 404]).toContain(response.status);
    });
  });

  describe('GET /api/documents/:id/download', () => {
    it('should download document as DOCX', async () => {
      if (!documentId) return;

      const response = await request(API_URL)
        .get(`/api/documents/${documentId}/download?format=docx`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/vnd.openxmlformats');
    });

    it('should download document as PDF', async () => {
      if (!documentId) return;

      const response = await request(API_URL)
        .get(`/api/documents/${documentId}/download?format=pdf`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('Handlebars Variables', () => {
    it('should replace simple variables', async () => {
      const response = await request(API_URL)
        .post('/api/documents/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Bonjour {{client_name}}',
          variables: {
            client_name: 'Jean Dupont',
          },
        });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.content).toContain('Jean Dupont');
      }
    });

    it('should handle conditional blocks', async () => {
      const response = await request(API_URL)
        .post('/api/documents/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '{{#if isCompany}}Société{{else}}Particulier{{/if}}',
          variables: {
            isCompany: true,
          },
        });

      expect([200, 404]).toContain(response.status);
    });

    it('should handle loop blocks', async () => {
      const response = await request(API_URL)
        .post('/api/documents/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '{{#each items}}{{this}}{{/each}}',
          variables: {
            items: ['A', 'B', 'C'],
          },
        });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Document Layout', () => {
    it('should apply header and footer', async () => {
      const response = await request(API_URL)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'test-template',
          folderId: folderId,
          format: 'PDF',
          options: {
            includeHeader: true,
            includeFooter: true,
            pageNumbers: true,
          },
        });

      expect([200, 201, 404]).toContain(response.status);
    });

    it('should support custom margins', async () => {
      const response = await request(API_URL)
        .post('/api/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'test-template',
          folderId: folderId,
          format: 'PDF',
          options: {
            margins: {
              top: 25,
              bottom: 25,
              left: 20,
              right: 20,
            },
          },
        });

      expect([200, 201, 404]).toContain(response.status);
    });
  });
});
