/**
 * Infrastructure Tests - 10 tests
 * Validates database, connections, and basic setup
 */

import { prisma } from '@/config/database';
import { config } from '@/config';
import app from '@/app';
import request from 'supertest';

describe('00. Infrastructure Tests', () => {
  describe('Database Connection', () => {
    test('[INF-001] Database is connected', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result).toBeDefined();
    });

    test('[INF-002] Can perform basic CRUD operations', async () => {
      // Create
      const cabinet = await prisma.cabinet.create({
        data: {
          name: 'Infrastructure Test Cabinet',
          email: `infra-test-${Date.now()}@test.com`,
        },
      });
      expect(cabinet.id).toBeDefined();

      // Read
      const found = await prisma.cabinet.findUnique({
        where: { id: cabinet.id },
      });
      expect(found).toBeDefined();
      expect(found?.name).toBe('Infrastructure Test Cabinet');

      // Update
      const updated = await prisma.cabinet.update({
        where: { id: cabinet.id },
        data: { name: 'Updated Cabinet' },
      });
      expect(updated.name).toBe('Updated Cabinet');

      // Delete
      await prisma.cabinet.delete({ where: { id: cabinet.id } });
      const deleted = await prisma.cabinet.findUnique({
        where: { id: cabinet.id },
      });
      expect(deleted).toBeNull();
    });

    test('[INF-003] Database supports transactions', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const cabinet = await tx.cabinet.create({
          data: {
            name: 'Transaction Test',
            email: `tx-test-${Date.now()}@test.com`,
          },
        });

        // Clean up within transaction
        await tx.cabinet.delete({ where: { id: cabinet.id } });

        return { success: true };
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Application Configuration', () => {
    test('[INF-004] Environment is test', () => {
      expect(config.env).toBe('test');
    });

    test('[INF-005] JWT secrets are configured', () => {
      expect(config.jwt.accessSecret).toBeDefined();
      expect(config.jwt.refreshSecret).toBeDefined();
    });

    test('[INF-006] Database URL is configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
    });
  });

  describe('API Server', () => {
    test('[INF-007] Health endpoint responds', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    test('[INF-008] API info endpoint responds', async () => {
      const response = await request(app).get('/api');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'LexDoc API');
    });

    test('[INF-009] 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route-xyz');
      expect(response.status).toBe(404);
    });

    test('[INF-010] CORS headers present', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
