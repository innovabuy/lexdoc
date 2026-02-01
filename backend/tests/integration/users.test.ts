import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import {
  createTestSetup,
  createTestUser,
  createTestAvocat,
  authHeader,
} from '../helpers';
import { UserRole } from '@prisma/client';

describe('Users Module', () => {
  describe('GET /api/users/me', () => {
    it('should get current user profile', async () => {
      const { cabinet, admin } = await createTestSetup();

      const response = await request(app)
        .get('/api/users/me')
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(admin.id);
      expect(response.body.data.email).toBe(admin.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/users/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should update current user profile', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .patch('/api/users/me')
        .set(authHeader(admin.accessToken))
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should not allow changing own role', async () => {
      const { cabinet } = await createTestSetup();
      const user = await createTestUser(cabinet.id, {
        role: UserRole.SECRETAIRE,
      });

      const response = await request(app)
        .patch('/api/users/me')
        .set(authHeader(user.accessToken))
        .send({
          firstName: 'Test',
          role: UserRole.ADMIN, // Should be ignored
        });

      // Request should succeed but role shouldn't change
      expect(response.status).toBe(200);

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.role).toBe(UserRole.SECRETAIRE);
    });
  });

  describe('PATCH /api/users/me/password', () => {
    it('should change password with correct current password', async () => {
      const { cabinet } = await createTestSetup();
      const user = await createTestUser(cabinet.id, {
        password: 'OldPassword123!',
      });

      const response = await request(app)
        .patch('/api/users/me/password')
        .set(authHeader(user.accessToken))
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'NewPassword456!',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject with wrong current password', async () => {
      const { cabinet } = await createTestSetup();
      const user = await createTestUser(cabinet.id, {
        password: 'OldPassword123!',
      });

      const response = await request(app)
        .patch('/api/users/me/password')
        .set(authHeader(user.accessToken))
        .send({
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/users', () => {
    it('should list users as admin', async () => {
      const { cabinet, admin } = await createTestSetup();
      await createTestUser(cabinet.id);
      await createTestUser(cabinet.id);

      const response = await request(app)
        .get('/api/users')
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('should list users as avocat', async () => {
      const { cabinet } = await createTestSetup();
      const avocat = await createTestAvocat(cabinet.id);

      const response = await request(app)
        .get('/api/users')
        .set(authHeader(avocat.accessToken));

      expect(response.status).toBe(200);
    });

    it('should not allow secretaire to list users', async () => {
      const { cabinet } = await createTestSetup();
      const secretaire = await createTestUser(cabinet.id, {
        role: UserRole.SECRETAIRE,
      });

      const response = await request(app)
        .get('/api/users')
        .set(authHeader(secretaire.accessToken));

      expect(response.status).toBe(403);
    });

    it('should support pagination', async () => {
      const { cabinet, admin } = await createTestSetup();

      // Create multiple users
      for (let i = 0; i < 5; i++) {
        await createTestUser(cabinet.id);
      }

      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should filter by role', async () => {
      const { cabinet, admin } = await createTestSetup();
      await createTestAvocat(cabinet.id);
      await createTestUser(cabinet.id, { role: UserRole.SECRETAIRE });

      const response = await request(app)
        .get('/api/users?role=AVOCAT')
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      response.body.data.forEach((user: { role: UserRole }) => {
        expect(user.role).toBe(UserRole.AVOCAT);
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create user as admin', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .post('/api/users')
        .set(authHeader(admin.accessToken))
        .send({
          email: 'newuser@test.com',
          password: 'SecurePassword123!',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.AVOCAT,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@test.com');
      expect(response.body.data.role).toBe(UserRole.AVOCAT);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should not allow avocat to create users', async () => {
      const { cabinet } = await createTestSetup();
      const avocat = await createTestAvocat(cabinet.id);

      const response = await request(app)
        .post('/api/users')
        .set(authHeader(avocat.accessToken))
        .send({
          email: 'newuser@test.com',
          password: 'SecurePassword123!',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.SECRETAIRE,
        });

      expect(response.status).toBe(403);
    });

    it('should reject duplicate email in same cabinet', async () => {
      const { cabinet, admin } = await createTestSetup();
      await createTestUser(cabinet.id, { email: 'existing@test.com' });

      const response = await request(app)
        .post('/api/users')
        .set(authHeader(admin.accessToken))
        .send({
          email: 'existing@test.com',
          password: 'SecurePassword123!',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.SECRETAIRE,
        });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id as admin', async () => {
      const { cabinet, admin } = await createTestSetup();
      const user = await createTestUser(cabinet.id);

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
    });

    it('should return 422 for invalid user id format', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .get('/api/users/non-existent-uuid')
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(422); // UUID validation fails
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should update user role as admin', async () => {
      const { cabinet, admin } = await createTestSetup();
      const user = await createTestUser(cabinet.id, {
        role: UserRole.SECRETAIRE,
      });

      const response = await request(app)
        .patch(`/api/users/${user.id}/role`)
        .set(authHeader(admin.accessToken))
        .send({ role: UserRole.AVOCAT });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(UserRole.AVOCAT);
    });

    it('should not allow changing own role', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .patch(`/api/users/${admin.id}/role`)
        .set(authHeader(admin.accessToken))
        .send({ role: UserRole.SECRETAIRE });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('should update user status as admin', async () => {
      const { cabinet, admin } = await createTestSetup();
      const user = await createTestUser(cabinet.id);

      const response = await request(app)
        .patch(`/api/users/${user.id}/status`)
        .set(authHeader(admin.accessToken))
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete user as admin', async () => {
      const { cabinet, admin } = await createTestSetup();
      const user = await createTestUser(cabinet.id);

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is soft deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser?.deletedAt).not.toBeNull();
    });

    it('should not allow deleting self', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .delete(`/api/users/${admin.id}`)
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(403);
    });
  });
});
