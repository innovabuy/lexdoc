import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { createTestCabinet, createTestUser, authHeader } from '../helpers';
import { CabinetStatus, UserRole } from '@prisma/client';

describe('Auth Module', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new cabinet with admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          cabinetName: 'Test Law Firm',
          cabinetEmail: 'firm@test.com',
          email: 'admin@test.com',
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cabinet');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.cabinet).toHaveProperty('id');
      expect(response.body.data.cabinet.name).toBe('Test Law Firm');
      expect(response.body.data.user).toHaveProperty('email', 'admin@test.com');
    });

    it('should reject duplicate cabinet email', async () => {
      await createTestCabinet({ email: 'duplicate@test.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          cabinetName: 'Another Firm',
          cabinetEmail: 'duplicate@test.com',
          email: 'admin2@test.com',
          password: 'SecurePassword123!',
          firstName: 'Jane',
          lastName: 'Doe',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          cabinetName: 'Test Firm',
          cabinetEmail: 'invalid-email',
          email: 'admin@test.com',
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          cabinetName: 'Test Firm',
          cabinetEmail: 'firm@test.com',
          email: 'admin@test.com',
          password: '123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const cabinet = await createTestCabinet();
      await createTestUser(cabinet.id, {
        email: 'login@test.com',
        password: 'TestPassword123!',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject invalid password', async () => {
      const cabinet = await createTestCabinet();
      await createTestUser(cabinet.id, {
        email: 'wrongpass@test.com',
        password: 'TestPassword123!',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@test.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject inactive cabinet user', async () => {
      const cabinet = await createTestCabinet({ status: CabinetStatus.SUSPENDED });
      await createTestUser(cabinet.id, {
        email: 'suspended@test.com',
        password: 'TestPassword123!',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'suspended@test.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const cabinet = await createTestCabinet();
      const user = await createTestUser(cabinet.id);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      const cabinet = await createTestCabinet();
      const user = await createTestUser(cabinet.id);

      const response = await request(app)
        .post('/api/auth/logout')
        .set(authHeader(user.accessToken))
        .send({ refreshToken: user.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify refresh token was removed
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.refreshTokens).toEqual([]);
    });

    it('should reject unauthenticated logout', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('2FA Endpoints', () => {
    it('should setup 2FA for user', async () => {
      const cabinet = await createTestCabinet();
      const user = await createTestUser(cabinet.id);

      const response = await request(app)
        .post('/api/auth/2fa/setup')
        .set(authHeader(user.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('qrCode');
    });

    it('should reject 2FA setup without auth', async () => {
      const response = await request(app).post('/api/auth/2fa/setup');

      expect(response.status).toBe(401);
    });
  });
});
