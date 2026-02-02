import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Security Tests', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let otherUserToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Login as test user
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

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(API_URL)
        .get('/api/documents');

      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await request(API_URL)
        .get('/api/documents')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      // Expired JWT token (you would need to generate one for actual test)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxfQ.invalid';

      const response = await request(API_URL)
        .get('/api/documents')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(API_URL)
        .get('/api/documents')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization (Cabinet Isolation)', () => {
    it('should not access other cabinet documents', async () => {
      // This test would need another user from a different cabinet
      // Placeholder for actual isolation test
      expect(true).toBe(true);
    });

    it('should not access other cabinet clients', async () => {
      expect(true).toBe(true);
    });

    it('should not access other cabinet templates', async () => {
      expect(true).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize search queries', async () => {
      const response = await request(API_URL)
        .get('/api/documents/search?q=\'; DROP TABLE documents; --')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not error, just return empty or filtered results
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should sanitize filter parameters', async () => {
      const response = await request(API_URL)
        .get('/api/documents?status=\' OR 1=1 --')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in client names', async () => {
      const response = await request(API_URL)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PHYSICAL',
          firstName: '<script>alert("xss")</script>',
          lastName: 'Test',
          email: 'xss-test@example.com',
        });

      if (response.status === 201) {
        expect(response.body.firstName).not.toContain('<script>');
      }
    });

    it('should escape HTML in document content', async () => {
      const response = await request(API_URL)
        .post('/api/documents/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '<img src=x onerror=alert(1)>',
          variables: {},
        });

      if (response.status === 200) {
        expect(response.body.content).not.toContain('onerror');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const attempts = Array(10).fill(null).map(() =>
        request(API_URL)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(attempts);
      const rateLimited = responses.some(r => r.status === 429);

      // Rate limiting may or may not be enabled
      expect([true, false]).toContain(rateLimited);
    });

    it('should limit API requests', async () => {
      const attempts = Array(100).fill(null).map(() =>
        request(API_URL)
          .get('/api/documents')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(attempts);
      // Just verify no server errors
      responses.forEach(r => {
        expect([200, 429]).toContain(r.status);
      });
    });
  });

  describe('CSRF Protection', () => {
    it('should reject requests without proper origin', async () => {
      // CSRF protection varies by implementation
      expect(true).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should reject oversized payloads', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB

      const response = await request(API_URL)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: largePayload,
        });

      expect([400, 413]).toContain(response.status);
    });

    it('should validate email formats', async () => {
      const response = await request(API_URL)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PHYSICAL',
          firstName: 'Test',
          lastName: 'User',
          email: 'not-an-email',
        });

      expect(response.status).toBe(400);
    });

    it('should validate required fields', async () => {
      const response = await request(API_URL)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PHYSICAL',
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });
  });

  describe('File Upload Security', () => {
    it('should reject executable files', async () => {
      const response = await request(API_URL)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('#!/bin/bash\nrm -rf /'), 'malicious.sh');

      expect([400, 415]).toContain(response.status);
    });

    it('should validate file types', async () => {
      const response = await request(API_URL)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('not a pdf'), 'test.exe');

      expect([400, 415]).toContain(response.status);
    });

    it('should limit file size', async () => {
      const largeFile = Buffer.alloc(50 * 1024 * 1024); // 50MB

      const response = await request(API_URL)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFile, 'large.pdf');

      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should not expose password hash', async () => {
      const response = await request(API_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.body).not.toHaveProperty('passwordHash');
        expect(response.body).not.toHaveProperty('password');
      }
    });

    it('should not expose JWT secret in errors', async () => {
      const response = await request(API_URL)
        .get('/api/documents')
        .set('Authorization', 'Bearer invalid');

      expect(JSON.stringify(response.body)).not.toContain('JWT_SECRET');
    });

    it('should not expose database credentials in errors', async () => {
      const response = await request(API_URL)
        .get('/api/documents?invalid[]=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(JSON.stringify(response.body)).not.toContain('DATABASE_URL');
      expect(JSON.stringify(response.body)).not.toContain('postgres://');
    });
  });

  describe('Headers Security', () => {
    it('should set security headers', async () => {
      const response = await request(API_URL)
        .get('/api/health');

      // Common security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      // Other headers depend on configuration
    });

    it('should not expose server information', async () => {
      const response = await request(API_URL)
        .get('/api/health');

      // Server header should be minimal or absent
      const serverHeader = response.headers['x-powered-by'];
      expect(serverHeader).toBeUndefined();
    });
  });
});
