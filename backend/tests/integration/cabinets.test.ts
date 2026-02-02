import request from 'supertest';
import app from '@/app';
import { createTestSetup, createTestCabinet, authHeader } from '../helpers';
import { CabinetStatus, UserRole } from '@prisma/client';

describe('Cabinets Module', () => {
  describe('GET /api/cabinets/me', () => {
    it('should get current cabinet details', async () => {
      const { cabinet, admin } = await createTestSetup();

      const response = await request(app)
        .get('/api/cabinets/me')
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(cabinet.id);
      expect(response.body.data.name).toBe(cabinet.name);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/cabinets/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/cabinets/me', () => {
    it('should update cabinet as admin', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .patch('/api/cabinets/me')
        .set(authHeader(admin.accessToken))
        .send({
          name: 'Updated Cabinet Name',
          phone: '+33123456789',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Cabinet Name');
      expect(response.body.data.phone).toBe('+33123456789');
    });

    it('should reject update from non-admin', async () => {
      const { cabinet } = await createTestSetup();
      const { createTestUser } = await import('../helpers');
      const secretaire = await createTestUser(cabinet.id, {
        role: UserRole.SECRETAIRE,
      });

      const response = await request(app)
        .patch('/api/cabinets/me')
        .set(authHeader(secretaire.accessToken))
        .send({ name: 'Should Not Update' });

      expect(response.status).toBe(403);
    });

    it('should validate update data', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .patch('/api/cabinets/me')
        .set(authHeader(admin.accessToken))
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/cabinets/me/stats', () => {
    it('should get cabinet statistics as admin', async () => {
      const { admin } = await createTestSetup();

      const response = await request(app)
        .get('/api/cabinets/me/stats')
        .set(authHeader(admin.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalFolders');
      expect(response.body.data).toHaveProperty('totalDocuments');
      expect(response.body.data).toHaveProperty('storageUsed');
      expect(response.body.data).toHaveProperty('storageLimit');
    });

    it('should reject stats request from secretaire', async () => {
      const { cabinet } = await createTestSetup();
      const { createTestUser } = await import('../helpers');
      const secretaire = await createTestUser(cabinet.id, {
        role: UserRole.SECRETAIRE,
      });

      const response = await request(app)
        .get('/api/cabinets/me/stats')
        .set(authHeader(secretaire.accessToken));

      expect(response.status).toBe(403);
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should not allow access to other cabinet data', async () => {
      // Create two separate cabinets
      const { admin: admin1 } = await createTestSetup();
      const cabinet2 = await createTestCabinet({ name: 'Other Cabinet' });

      // Try to access cabinet2's data with admin1's token
      const response = await request(app)
        .get('/api/cabinets/me')
        .set(authHeader(admin1.accessToken));

      // Should only see own cabinet
      expect(response.status).toBe(200);
      expect(response.body.data.id).not.toBe(cabinet2.id);
    });
  });
});
