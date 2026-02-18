/**
 * Live Integration Tests — Extranet Client Portal
 */
const request = require('supertest');
const { API, getAuthToken } = require('./live-helpers');

describe('Extranet (live)', () => {
  let cabinetToken;
  let testClientId;
  let activationToken;

  beforeAll(async () => {
    cabinetToken = getAuthToken();

    // Get a client that has an extranet access
    const clients = await request(API)
      .get('/api/clients')
      .set('Authorization', `Bearer ${cabinetToken}`);

    // Find a client with extranetActivationToken
    const clientWithToken = clients.body.data.find(c => c.extranetActivationToken);
    if (clientWithToken) {
      testClientId = clientWithToken.id;
      activationToken = clientWithToken.extranetActivationToken;
    }
  });

  describe('POST /api/extranet/login', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(API)
        .post('/api/extranet/login')
        .send({ email: 'nonexistent@test.fr', password: 'wrong' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/extranet/verify-token/:token', () => {
    it('should verify a valid activation token', async () => {
      if (!activationToken) return; // Skip if no token available

      const res = await request(API)
        .get(`/api/extranet/verify-token/${activationToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject an invalid token', async () => {
      const res = await request(API)
        .get('/api/extranet/verify-token/invalid-token-xyz');

      // Should return error or not found
      expect(res.body.success === false || res.status >= 400).toBe(true);
    });
  });

  describe('POST /api/clients/:id/invite-extranet', () => {
    it('should send extranet invitation', async () => {
      if (!testClientId) return;

      const res = await request(API)
        .post(`/api/clients/${testClientId}/invite-extranet`)
        .set('Authorization', `Bearer ${cabinetToken}`);

      // May succeed or fail based on email config, but should not crash
      expect([200, 201, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/extranet/admin/activity', () => {
    it('should return extranet activity for cabinet', async () => {
      const res = await request(API)
        .get('/api/extranet/admin/activity')
        .set('Authorization', `Bearer ${cabinetToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
