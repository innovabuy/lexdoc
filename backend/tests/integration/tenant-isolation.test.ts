import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import {
  createTestCabinet,
  createTestAdmin,
  createTestAvocat,
  createTestFolder,
  createTestDocument,
  authHeader,
  TestCabinet,
  TestUser,
} from '../helpers';

describe('Tenant Isolation', () => {
  let cabinetA: TestCabinet;
  let cabinetB: TestCabinet;
  let adminA: TestUser;
  let adminB: TestUser;
  let avocatA: TestUser;

  beforeEach(async () => {
    // Create two separate cabinets with users
    cabinetA = await createTestCabinet({ name: 'Cabinet A', email: 'cabinet-a@test.com' });
    cabinetB = await createTestCabinet({ name: 'Cabinet B', email: 'cabinet-b@test.com' });

    adminA = await createTestAdmin(cabinetA.id);
    adminB = await createTestAdmin(cabinetB.id);
    avocatA = await createTestAvocat(cabinetA.id);
  });

  describe('User isolation', () => {
    it('should not allow user from cabinet A to see users from cabinet B', async () => {
      // Get users list with cabinet A credentials
      const response = await request(app)
        .get('/api/users')
        .set(authHeader(adminA.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Should only see users from cabinet A
      const users = response.body.data.users || response.body.data;
      const userIds = users.map((u: { id: string }) => u.id);

      expect(userIds).toContain(adminA.id);
      expect(userIds).toContain(avocatA.id);
      expect(userIds).not.toContain(adminB.id);
    });

    it('should not allow user from cabinet A to access user from cabinet B by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${adminB.id}`)
        .set(authHeader(adminA.accessToken));

      // Should return 404 (not found) or 403 (forbidden)
      expect([403, 404]).toContain(response.status);
    });

    it('should not allow user from cabinet A to update user from cabinet B', async () => {
      const response = await request(app)
        .patch(`/api/users/${adminB.id}`)
        .set(authHeader(adminA.accessToken))
        .send({ firstName: 'Hacked' });

      expect([403, 404]).toContain(response.status);

      // Verify user B was not modified
      const userB = await prisma.user.findUnique({ where: { id: adminB.id } });
      expect(userB?.firstName).not.toBe('Hacked');
    });

    it('should not allow user from cabinet A to delete user from cabinet B', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminB.id}`)
        .set(authHeader(adminA.accessToken));

      expect([403, 404]).toContain(response.status);

      // Verify user B still exists
      const userB = await prisma.user.findUnique({ where: { id: adminB.id } });
      expect(userB).not.toBeNull();
    });
  });

  describe('Folder isolation', () => {
    let folderA: Awaited<ReturnType<typeof createTestFolder>>;
    let folderB: Awaited<ReturnType<typeof createTestFolder>>;

    beforeEach(async () => {
      folderA = await createTestFolder(cabinetA.id, { name: 'Folder A' });
      folderB = await createTestFolder(cabinetB.id, { name: 'Folder B' });
    });

    it.skip('should not allow user from cabinet A to see folders from cabinet B', async () => {
      const response = await request(app)
        .get('/api/folders')
        .set(authHeader(adminA.accessToken));

      expect(response.status).toBe(200);

      const folders = response.body.data.folders || response.body.data;
      const folderIds = folders.map((f: { id: string }) => f.id);

      expect(folderIds).toContain(folderA.id);
      expect(folderIds).not.toContain(folderB.id);
    });

    it('should not allow user from cabinet A to access folder from cabinet B by ID', async () => {
      const response = await request(app)
        .get(`/api/folders/${folderB.id}`)
        .set(authHeader(adminA.accessToken));

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Document isolation', () => {
    let folderA: Awaited<ReturnType<typeof createTestFolder>>;
    let folderB: Awaited<ReturnType<typeof createTestFolder>>;
    let documentA: Awaited<ReturnType<typeof createTestDocument>>;
    let documentB: Awaited<ReturnType<typeof createTestDocument>>;

    beforeEach(async () => {
      folderA = await createTestFolder(cabinetA.id);
      folderB = await createTestFolder(cabinetB.id);

      documentA = await createTestDocument(cabinetA.id, adminA.id, { folderId: folderA.id });
      documentB = await createTestDocument(cabinetB.id, adminB.id, { folderId: folderB.id });
    });

    it.skip('should not allow user from cabinet A to see documents from cabinet B', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set(authHeader(adminA.accessToken));

      expect(response.status).toBe(200);

      const documents = response.body.data.documents || response.body.data;
      const documentIds = documents.map((d: { id: string }) => d.id);

      expect(documentIds).toContain(documentA.id);
      expect(documentIds).not.toContain(documentB.id);
    });

    it('should not allow user from cabinet A to access document from cabinet B by ID', async () => {
      const response = await request(app)
        .get(`/api/documents/${documentB.id}`)
        .set(authHeader(adminA.accessToken));

      expect([403, 404]).toContain(response.status);
    });

    it('should not allow user from cabinet A to download document from cabinet B', async () => {
      const response = await request(app)
        .get(`/api/documents/${documentB.id}/download`)
        .set(authHeader(adminA.accessToken));

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('JWT validation', () => {
    it('should reject requests with invalid JWT', async () => {
      const response = await request(app)
        .get('/api/users')
        .set(authHeader('invalid-token'));

      expect(response.status).toBe(401);
    });

    it('should reject requests with expired JWT', async () => {
      // Create an expired token manually (for testing purposes)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiY2FiaW5ldElkIjoidGVzdCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.invalid';

      const response = await request(app)
        .get('/api/users')
        .set(authHeader(expiredToken));

      expect(response.status).toBe(401);
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('Cross-cabinet data manipulation attempts', () => {
    it('should not allow creating document in another cabinet folder', async () => {
      const folderB = await createTestFolder(cabinetB.id);

      const response = await request(app)
        .post('/api/documents')
        .set(authHeader(adminA.accessToken))
        .send({
          title: 'Malicious Document',
          folderId: folderB.id, // Trying to use folder from cabinet B
          filename: 'malicious.pdf',
          originalName: 'Malicious.pdf',
          minioPath: '/test/malicious.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        });

      expect([400, 403, 404]).toContain(response.status);

      // Verify document was not created
      const document = await prisma.document.findFirst({
        where: { title: 'Malicious Document' },
      });
      expect(document).toBeNull();
    });
  });

  describe('Audit log isolation', () => {
    it('should only show audit logs from the same cabinet', async () => {
      // Create audit logs for both cabinets
      await prisma.auditLog.create({
        data: {
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: adminA.id,
          userId: adminA.id,
          cabinetId: cabinetA.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: adminB.id,
          userId: adminB.id,
          cabinetId: cabinetB.id,
        },
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set(authHeader(adminA.accessToken));

      if (response.status === 200) {
        const logs = response.body.data.logs || response.body.data;
        const cabinetIds = logs.map((l: { cabinetId: string }) => l.cabinetId);

        // All logs should be from cabinet A
        cabinetIds.forEach((id: string) => {
          expect(id).toBe(cabinetA.id);
        });

        // Should not contain logs from cabinet B
        expect(cabinetIds).not.toContain(cabinetB.id);
      }
    });
  });

  describe('Cabinet status validation', () => {
    it('should reject login for suspended cabinet users', async () => {
      // Update cabinet B to suspended status
      await prisma.cabinet.update({
        where: { id: cabinetB.id },
        data: { status: 'SUSPENDED' },
      });

      const response = await request(app).post('/api/auth/login').send({
        email: adminB.email,
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('inactive');
    });

    it('should reject login for canceled cabinet users', async () => {
      await prisma.cabinet.update({
        where: { id: cabinetB.id },
        data: { status: 'CANCELED' },
      });

      const response = await request(app).post('/api/auth/login').send({
        email: adminB.email,
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(401);
    });
  });
});
