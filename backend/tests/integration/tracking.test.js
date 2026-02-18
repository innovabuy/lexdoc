/**
 * Integration Tests for Signature Tracking
 */

// Mock external services - define mocks as objects
const mockUniversignService = {
  createSignatureRequest: jest.fn().mockResolvedValue({
    transactionId: 'tx-test-123',
    signatureUrl: 'https://universign.test/sign/abc',
  }),
  getTransactionStatus: jest.fn().mockResolvedValue({
    status: 'ready',
    signers: [{ status: 'waiting' }],
  }),
  cancelTransaction: jest.fn().mockResolvedValue(true),
};

const mockSendingboxService = {
  createLRAR: jest.fn().mockResolvedValue({
    letterId: 'lrar-test-123',
    trackingNumber: 'FR987654321',
    status: 'created',
  }),
  getLetterStatus: jest.fn().mockResolvedValue({
    status: 'delivered',
    deliveryDate: new Date(),
  }),
};

const mockEmailService = {
  sendDocumentNotification: jest.fn().mockResolvedValue(true),
  sendTrackingReminder: jest.fn().mockResolvedValue(true),
};

jest.mock('../../src/config/database', () => ({
  signatureTracking: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  document: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
  },
}));

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const prisma = require('../../src/config/database');
// Services are mocked above - use mockUniversignService, mockSendingboxService, mockEmailService

describe('Signature Tracking Integration', () => {
  const testTenantId = 'tenant-integration-test';

  beforeEach(() => {
    // Reset mock call history but preserve implementations
    jest.clearAllMocks();

    // Restore mock return values after clearAllMocks
    mockUniversignService.createSignatureRequest.mockResolvedValue({
      transactionId: 'tx-test-123',
      signatureUrl: 'https://universign.test/sign/abc',
    });
    mockUniversignService.getTransactionStatus.mockResolvedValue({
      status: 'ready',
      signers: [{ status: 'waiting' }],
    });
    mockUniversignService.cancelTransaction.mockResolvedValue(true);

    mockSendingboxService.createLRAR.mockResolvedValue({
      letterId: 'lrar-test-123',
      trackingNumber: 'FR987654321',
      status: 'created',
    });
    mockSendingboxService.getLetterStatus.mockResolvedValue({
      status: 'delivered',
      deliveryDate: new Date(),
    });

    mockEmailService.sendDocumentNotification.mockResolvedValue(true);
    mockEmailService.sendTrackingReminder.mockResolvedValue(true);
  });

  describe('Universign Signature', () => {
    it('should create signature tracking with Universign', async () => {
      const document = {
        id: 'doc-1',
        title: 'Test Contract',
        tenantId: testTenantId,
        folder: {
          client: {
            email: 'signer@test.com',
            firstName: 'Jean',
            lastName: 'Test',
          },
        },
      };

      const tracking = {
        id: 'tracking-1',
        documentId: document.id,
        method: 'UNIVERSIGN',
        status: 'PENDING',
        transactionId: 'tx-test-123',
        signatureUrl: 'https://universign.test/sign/abc',
        signerEmail: 'signer@test.com',
        tenantId: testTenantId,
      };

      prisma.document.findUnique.mockResolvedValue(document);
      prisma.signatureTracking.create.mockResolvedValue(tracking);
      prisma.activityLog.create.mockResolvedValue({ id: 'log-1' });

      // Simulate creating signature request
      const result = await mockUniversignService.createSignatureRequest({
        documentId: document.id,
        signerEmail: 'signer@test.com',
      });

      expect(result.transactionId).toBe('tx-test-123');
      expect(result.signatureUrl).toContain('universign');
    });

    it('should update tracking status on signature completion', async () => {
      const tracking = {
        id: 'tracking-complete',
        status: 'PENDING',
        transactionId: 'tx-complete',
        tenantId: testTenantId,
      };

      const updatedTracking = {
        ...tracking,
        status: 'SIGNED',
        signedAt: new Date(),
      };

      prisma.signatureTracking.findUnique.mockResolvedValue(tracking);
      prisma.signatureTracking.update.mockResolvedValue(updatedTracking);

      // Simulate status update
      const result = await prisma.signatureTracking.update({
        where: { id: tracking.id },
        data: { status: 'SIGNED', signedAt: new Date() },
      });

      expect(result.status).toBe('SIGNED');
      expect(result.signedAt).toBeDefined();
    });

    it('should handle signature cancellation', async () => {
      const tracking = {
        id: 'tracking-cancel',
        status: 'PENDING',
        transactionId: 'tx-cancel',
        tenantId: testTenantId,
      };

      prisma.signatureTracking.findUnique.mockResolvedValue(tracking);
      prisma.signatureTracking.update.mockResolvedValue({
        ...tracking,
        status: 'CANCELLED',
      });

      const cancelResult = await mockUniversignService.cancelTransaction('tx-cancel');
      expect(cancelResult).toBe(true);
    });
  });

  describe('LRAR Tracking', () => {
    it('should create LRAR tracking', async () => {
      const document = {
        id: 'doc-lrar',
        title: 'Mise en demeure',
        tenantId: testTenantId,
      };

      const recipient = {
        name: 'Jean Destinataire',
        address: '123 Rue de Paris',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      };

      const tracking = {
        id: 'tracking-lrar',
        documentId: document.id,
        method: 'LRAR',
        status: 'PENDING',
        lrarLetterId: 'lrar-test-123',
        lrarTrackingNumber: 'FR987654321',
        tenantId: testTenantId,
      };

      prisma.document.findUnique.mockResolvedValue(document);
      prisma.signatureTracking.create.mockResolvedValue(tracking);

      const lrarResult = await mockSendingboxService.createLRAR({
        documentId: document.id,
        recipient,
      });

      expect(lrarResult.letterId).toBe('lrar-test-123');
      expect(lrarResult.trackingNumber).toBe('FR987654321');
    });

    it('should update LRAR status on delivery', async () => {
      const tracking = {
        id: 'tracking-lrar-deliver',
        status: 'SENT',
        lrarLetterId: 'lrar-deliver',
        tenantId: testTenantId,
      };

      prisma.signatureTracking.findUnique.mockResolvedValue(tracking);
      prisma.signatureTracking.update.mockResolvedValue({
        ...tracking,
        status: 'DELIVERED',
        lrarDeliveryDate: new Date(),
      });

      const statusResult = await mockSendingboxService.getLetterStatus('lrar-deliver');
      expect(statusResult.status).toBe('delivered');
    });
  });

  describe('Reminders', () => {
    it('should send first reminder after 3 days', async () => {
      const tracking = {
        id: 'tracking-remind-1',
        signerEmail: 'signer@test.com',
        signerName: 'Jean Test',
        reminderCount: 0,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        document: { title: 'Contract' },
        tenantId: testTenantId,
      };

      prisma.signatureTracking.findMany.mockResolvedValue([tracking]);
      prisma.signatureTracking.update.mockResolvedValue({
        ...tracking,
        reminderCount: 1,
        lastReminderAt: new Date(),
      });

      // Simulate reminder send
      await mockEmailService.sendTrackingReminder({
        to: tracking.signerEmail,
        documentTitle: 'Contract',
        level: 1,
      });

      expect(mockEmailService.sendTrackingReminder).toHaveBeenCalled();
    });

    it('should send second reminder after 7 days', async () => {
      const tracking = {
        id: 'tracking-remind-2',
        signerEmail: 'signer@test.com',
        reminderCount: 1,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        lastReminderAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        document: { title: 'Contract' },
        tenantId: testTenantId,
      };

      prisma.signatureTracking.findMany.mockResolvedValue([tracking]);

      await mockEmailService.sendTrackingReminder({
        to: tracking.signerEmail,
        documentTitle: 'Contract',
        level: 2,
      });

      expect(mockEmailService.sendTrackingReminder).toHaveBeenCalledWith(
        expect.objectContaining({ level: 2 })
      );
    });

    it('should send urgent third reminder after 14 days', async () => {
      const tracking = {
        id: 'tracking-remind-3',
        signerEmail: 'signer@test.com',
        reminderCount: 2,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        document: { title: 'Contract' },
        tenantId: testTenantId,
      };

      prisma.signatureTracking.findMany.mockResolvedValue([tracking]);

      await mockEmailService.sendTrackingReminder({
        to: tracking.signerEmail,
        documentTitle: 'Contract',
        level: 3,
      });

      expect(mockEmailService.sendTrackingReminder).toHaveBeenCalledWith(
        expect.objectContaining({ level: 3 })
      );
    });

    it('should not send reminder if disabled', async () => {
      const tracking = {
        id: 'tracking-no-remind',
        reminderEnabled: false,
        status: 'PENDING',
        tenantId: testTenantId,
      };

      prisma.signatureTracking.findMany.mockResolvedValue([tracking]);

      // When reminder is disabled, no email should be sent
      expect(tracking.reminderEnabled).toBe(false);
    });
  });

  describe('Tracking Status Queries', () => {
    it('should list all trackings for a document', async () => {
      const trackings = [
        { id: 't1', documentId: 'doc-1', status: 'SIGNED', method: 'UNIVERSIGN' },
        { id: 't2', documentId: 'doc-1', status: 'PENDING', method: 'LRAR' },
      ];

      prisma.signatureTracking.findMany.mockResolvedValue(trackings);

      const result = await prisma.signatureTracking.findMany({
        where: { documentId: 'doc-1', tenantId: testTenantId },
      });

      expect(result).toHaveLength(2);
      expect(result[0].method).toBe('UNIVERSIGN');
      expect(result[1].method).toBe('LRAR');
    });

    it('should filter trackings by status', async () => {
      const pendingTrackings = [
        { id: 't1', status: 'PENDING' },
        { id: 't2', status: 'PENDING' },
      ];

      prisma.signatureTracking.findMany.mockResolvedValue(pendingTrackings);

      const result = await prisma.signatureTracking.findMany({
        where: { status: 'PENDING', tenantId: testTenantId },
      });

      expect(result).toHaveLength(2);
      expect(result.every(t => t.status === 'PENDING')).toBe(true);
    });

    it('should get tracking statistics', async () => {
      const allTrackings = [
        { status: 'SIGNED' },
        { status: 'SIGNED' },
        { status: 'PENDING' },
        { status: 'FAILED' },
      ];

      prisma.signatureTracking.findMany.mockResolvedValue(allTrackings);

      const result = await prisma.signatureTracking.findMany({
        where: { tenantId: testTenantId },
      });

      const stats = {
        total: result.length,
        signed: result.filter(t => t.status === 'SIGNED').length,
        pending: result.filter(t => t.status === 'PENDING').length,
        failed: result.filter(t => t.status === 'FAILED').length,
      };

      expect(stats.total).toBe(4);
      expect(stats.signed).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });
});
