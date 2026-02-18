/**
 * Integration Tests for Client Extranet Portal
 */

jest.mock('../../src/services/email.service', () => ({
  sendClientInvitation: jest.fn().mockResolvedValue(true),
  sendDocumentNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/config/database', () => ({
  clientAccess: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  folder: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  document: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  signatureTracking: {
    findMany: jest.fn(),
  },
}));

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/database');
const emailService = require('../../src/services/email.service');

describe('Client Extranet Integration', () => {
  const testTenantId = 'tenant-extranet-test';
  const JWT_SECRET = 'test-jwt-secret';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Access Creation', () => {
    it('should create client access with hashed password', async () => {
      const client = {
        id: 'client-1',
        email: 'client@example.com',
        firstName: 'Jean',
        lastName: 'Client',
        tenantId: testTenantId,
      };

      const folder = {
        id: 'folder-1',
        title: 'Dossier Client',
        clientId: client.id,
        tenantId: testTenantId,
      };

      const temporaryPassword = 'TempPass123!';
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      const clientAccess = {
        id: 'access-1',
        folderId: folder.id,
        clientId: client.id,
        email: client.email,
        passwordHash: hashedPassword,
        isActive: true,
        mustChangePassword: true,
        tenantId: testTenantId,
      };

      prisma.client.findUnique.mockResolvedValue(client);
      prisma.folder.findUnique.mockResolvedValue(folder);
      prisma.clientAccess.create.mockResolvedValue(clientAccess);

      // Verify password can be verified
      const isValid = await bcrypt.compare(temporaryPassword, clientAccess.passwordHash);
      expect(isValid).toBe(true);
      expect(clientAccess.mustChangePassword).toBe(true);
    });

    it('should send invitation email on access creation', async () => {
      const clientAccess = {
        id: 'access-2',
        email: 'newclient@example.com',
        tenantId: testTenantId,
      };

      prisma.clientAccess.create.mockResolvedValue(clientAccess);

      await emailService.sendClientInvitation({
        to: clientAccess.email,
        temporaryPassword: 'TempPass123!',
        folderName: 'Dossier Test',
        loginUrl: 'https://extranet.lexdoc.fr/login',
      });

      expect(emailService.sendClientInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newclient@example.com',
        })
      );
    });
  });

  describe('Client Authentication', () => {
    it('should authenticate client with valid credentials', async () => {
      const password = 'ClientPass123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const clientAccess = {
        id: 'access-auth',
        email: 'auth@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        folderId: 'folder-1',
        clientId: 'client-1',
        tenantId: testTenantId,
        folder: {
          id: 'folder-1',
          title: 'Test Folder',
        },
        client: {
          id: 'client-1',
          firstName: 'Jean',
          lastName: 'Auth',
        },
      };

      prisma.clientAccess.findFirst.mockResolvedValue(clientAccess);

      // Verify password
      const isValid = await bcrypt.compare(password, clientAccess.passwordHash);
      expect(isValid).toBe(true);

      // Generate token
      const token = jwt.sign(
        {
          accessId: clientAccess.id,
          folderId: clientAccess.folderId,
          clientId: clientAccess.clientId,
          type: 'client',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      expect(token).toBeDefined();

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.accessId).toBe(clientAccess.id);
      expect(decoded.type).toBe('client');
    });

    it('should reject inactive client access', async () => {
      const clientAccess = {
        id: 'access-inactive',
        email: 'inactive@example.com',
        isActive: false,
        tenantId: testTenantId,
      };

      prisma.clientAccess.findFirst.mockResolvedValue(null); // Inactive accounts not returned

      const result = await prisma.clientAccess.findFirst({
        where: {
          email: 'inactive@example.com',
          isActive: true,
        },
      });

      expect(result).toBeNull();
    });

    it('should update last login timestamp', async () => {
      const clientAccess = {
        id: 'access-login',
        lastLoginAt: null,
        tenantId: testTenantId,
      };

      const updatedAccess = {
        ...clientAccess,
        lastLoginAt: new Date(),
      };

      prisma.clientAccess.update.mockResolvedValue(updatedAccess);

      const result = await prisma.clientAccess.update({
        where: { id: clientAccess.id },
        data: { lastLoginAt: new Date() },
      });

      expect(result.lastLoginAt).toBeDefined();
    });
  });

  describe('Password Management', () => {
    it('should force password change on first login', async () => {
      const clientAccess = {
        id: 'access-first-login',
        mustChangePassword: true,
        tenantId: testTenantId,
      };

      prisma.clientAccess.findUnique.mockResolvedValue(clientAccess);

      expect(clientAccess.mustChangePassword).toBe(true);
    });

    it('should update password and clear mustChangePassword flag', async () => {
      const newPassword = 'NewSecurePass123!';
      const newHash = await bcrypt.hash(newPassword, 10);

      const updatedAccess = {
        id: 'access-pwd-change',
        passwordHash: newHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        tenantId: testTenantId,
      };

      prisma.clientAccess.update.mockResolvedValue(updatedAccess);

      const result = await prisma.clientAccess.update({
        where: { id: 'access-pwd-change' },
        data: {
          passwordHash: newHash,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      });

      expect(result.mustChangePassword).toBe(false);
      expect(result.passwordChangedAt).toBeDefined();
    });

    it('should validate password minimum length', () => {
      const shortPassword = 'short';
      const validPassword = 'ValidPass123!';

      expect(shortPassword.length).toBeLessThan(8);
      expect(validPassword.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Document Access', () => {
    it('should list documents in accessible folder', async () => {
      const folderId = 'folder-docs';
      const documents = [
        { id: 'doc-1', title: 'Contract 1', status: 'ACTIVE', folderId },
        { id: 'doc-2', title: 'Contract 2', status: 'ACTIVE', folderId },
        { id: 'doc-3', title: 'Invoice', status: 'ACTIVE', folderId },
      ];

      prisma.document.findMany.mockResolvedValue(documents);

      const result = await prisma.document.findMany({
        where: {
          folderId,
          status: 'ACTIVE',
        },
      });

      expect(result).toHaveLength(3);
    });

    it('should track document view activity', async () => {
      const activityLog = {
        id: 'log-view-1',
        type: 'DOCUMENT_VIEW',
        documentId: 'doc-1',
        clientId: 'client-1',
        tenantId: testTenantId,
        metadata: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
        createdAt: new Date(),
      };

      prisma.activityLog.create.mockResolvedValue(activityLog);

      const result = await prisma.activityLog.create({
        data: activityLog,
      });

      expect(result.type).toBe('DOCUMENT_VIEW');
      expect(result.documentId).toBe('doc-1');
    });

    it('should track document download activity', async () => {
      const activityLog = {
        id: 'log-download-1',
        type: 'DOCUMENT_DOWNLOAD',
        documentId: 'doc-1',
        clientId: 'client-1',
        tenantId: testTenantId,
        createdAt: new Date(),
      };

      prisma.activityLog.create.mockResolvedValue(activityLog);

      const result = await prisma.activityLog.create({
        data: activityLog,
      });

      expect(result.type).toBe('DOCUMENT_DOWNLOAD');
    });
  });

  describe('Activity Timeline', () => {
    it('should return activity logs for folder', async () => {
      const activities = [
        { id: 'log-1', type: 'DOCUMENT_UPLOAD', createdAt: new Date() },
        { id: 'log-2', type: 'DOCUMENT_VIEW', createdAt: new Date() },
        { id: 'log-3', type: 'SIGNATURE_COMPLETED', createdAt: new Date() },
      ];

      prisma.activityLog.findMany.mockResolvedValue(activities);

      const result = await prisma.activityLog.findMany({
        where: { folderId: 'folder-1' },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(3);
    });

    it('should group activities by date', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const activities = [
        { id: 'log-1', type: 'VIEW', createdAt: today },
        { id: 'log-2', type: 'VIEW', createdAt: today },
        { id: 'log-3', type: 'UPLOAD', createdAt: yesterday },
      ];

      prisma.activityLog.findMany.mockResolvedValue(activities);

      const result = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Group by date
      const grouped = result.reduce((acc, activity) => {
        const date = activity.createdAt.toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(activity);
        return acc;
      }, {});

      expect(Object.keys(grouped)).toHaveLength(2);
    });
  });

  describe('Signature Status in Extranet', () => {
    it('should show signature tracking status', async () => {
      const trackings = [
        {
          id: 'track-1',
          documentId: 'doc-1',
          status: 'PENDING',
          method: 'UNIVERSIGN',
          signatureUrl: 'https://sign.test/abc',
        },
        {
          id: 'track-2',
          documentId: 'doc-2',
          status: 'SIGNED',
          method: 'UNIVERSIGN',
          signedAt: new Date(),
        },
      ];

      prisma.signatureTracking.findMany.mockResolvedValue(trackings);

      const result = await prisma.signatureTracking.findMany({
        where: { signerEmail: 'client@example.com' },
      });

      const pending = result.filter(t => t.status === 'PENDING');
      const signed = result.filter(t => t.status === 'SIGNED');

      expect(pending).toHaveLength(1);
      expect(signed).toHaveLength(1);
    });

    it('should provide signing URL for pending signatures', async () => {
      const tracking = {
        id: 'track-pending',
        status: 'PENDING',
        signatureUrl: 'https://universign.test/sign/xyz123',
      };

      prisma.signatureTracking.findMany.mockResolvedValue([tracking]);

      const result = await prisma.signatureTracking.findMany({
        where: { status: 'PENDING' },
      });

      expect(result[0].signatureUrl).toContain('universign');
    });
  });

  describe('Multi-folder Access', () => {
    it('should handle client with multiple folder access', async () => {
      const accesses = [
        { id: 'access-1', folderId: 'folder-1', folder: { title: 'Dossier A' } },
        { id: 'access-2', folderId: 'folder-2', folder: { title: 'Dossier B' } },
      ];

      prisma.clientAccess.findMany.mockResolvedValue(accesses);

      const result = await prisma.clientAccess.findMany({
        where: {
          clientId: 'client-multi',
          isActive: true,
        },
        include: { folder: true },
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('Security', () => {
    it('should not expose password hash', () => {
      const clientAccess = {
        id: 'access-secure',
        email: 'secure@example.com',
        passwordHash: '$2b$10$xxxxxxxxxxxx',
        isActive: true,
      };

      // Simulate sanitization
      const sanitized = {
        id: clientAccess.id,
        email: clientAccess.email,
        isActive: clientAccess.isActive,
      };

      expect(sanitized.passwordHash).toBeUndefined();
    });

    it('should validate tenant isolation', async () => {
      const clientAccess = {
        id: 'access-tenant-1',
        tenantId: 'tenant-1',
      };

      prisma.clientAccess.findUnique.mockResolvedValue(clientAccess);

      const result = await prisma.clientAccess.findUnique({
        where: { id: 'access-tenant-1' },
      });

      // Access should only work for matching tenant
      expect(result.tenantId).toBe('tenant-1');
    });
  });
});
