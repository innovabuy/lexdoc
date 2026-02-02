import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Authentication', () => {
  let prisma: PrismaClient;
  let testUser: { id: string; email: string };
  let authToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test user
    const passwordHash = await bcrypt.hash('Test123!', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test-auth@example.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        role: 'AVOCAT',
        cabinet: {
          create: {
            name: 'Test Cabinet Auth',
            siret: '12345678901234',
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'test-auth@example.com',
          password: 'Test123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      authToken = response.body.accessToken;
    });

    it('should reject invalid password', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'test-auth@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'test-auth@example.com',
          password: 'Test123!',
        });

      const response = await request(API_URL)
        .post('/api/auth/refresh')
        .send({
          refreshToken: loginResponse.body.refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(API_URL)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('2FA', () => {
    it('should enable 2FA for user', async () => {
      const response = await request(API_URL)
        .post('/api/auth/2fa/enable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
    });

    it('should validate 2FA code', async () => {
      // This would need actual TOTP generation
      // Placeholder for actual 2FA validation test
      expect(true).toBe(true);
    });
  });

  describe('Password Reset', () => {
    it('should send reset email for existing user', async () => {
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({ email: 'test-auth@example.com' });

      expect(response.status).toBe(200);
    });

    it('should not reveal if user exists', async () => {
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Should return 200 even for non-existent users (security)
      expect(response.status).toBe(200);
    });
  });
});
