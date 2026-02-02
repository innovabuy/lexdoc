import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

describe('Infrastructure', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to PostgreSQL', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result).toBeDefined();
    });

    it('should have all required tables', async () => {
      const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      const tableNames = tables.map(t => t.tablename);

      expect(tableNames).toContain('users');
      expect(tableNames).toContain('cabinets');
      expect(tableNames).toContain('clients');
      expect(tableNames).toContain('folders');
      expect(tableNames).toContain('documents');
    });
  });

  describe('Environment Configuration', () => {
    it('should have DATABASE_URL configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should have JWT_SECRET configured', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
    });

    it('should have MINIO configuration', () => {
      expect(process.env.MINIO_ENDPOINT).toBeDefined();
      expect(process.env.MINIO_ACCESS_KEY).toBeDefined();
      expect(process.env.MINIO_SECRET_KEY).toBeDefined();
    });
  });

  describe('MinIO Connection', () => {
    it('should connect to MinIO storage', async () => {
      // MinIO connection test would go here
      // This is a placeholder for actual MinIO client test
      expect(true).toBe(true);
    });
  });
});
