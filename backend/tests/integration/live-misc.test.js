/**
 * Live Integration Tests — Documents, Notifications, Search, Deadlines
 */
const request = require('supertest');
const { API, getAuthToken } = require('./live-helpers');

describe('Miscellaneous Endpoints (live)', () => {
  let token;

  beforeAll(() => {
    token = getAuthToken();
  });

  // ─── Notifications ──────────────────────────────

  describe('Notifications', () => {
    it('GET /api/notifications/unread-count should return count', async () => {
      const res = await request(API)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('unreadCount');
      expect(typeof res.body.data.unreadCount).toBe('number');
    });
  });

  // ─── Search ──────────────────────────────

  describe('Search', () => {
    it('GET /api/search?q=test should return grouped results', async () => {
      const res = await request(API)
        .get('/api/search')
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('documents');
      expect(res.body.data).toHaveProperty('folders');
      expect(res.body.data).toHaveProperty('clients');
      expect(Array.isArray(res.body.data.documents)).toBe(true);
      expect(Array.isArray(res.body.data.folders)).toBe(true);
      expect(Array.isArray(res.body.data.clients)).toBe(true);
    });

    it('GET /api/search with empty query should still work', async () => {
      const res = await request(API)
        .get('/api/search')
        .query({ q: '' })
        .set('Authorization', `Bearer ${token}`);

      // Should return 200 with empty results or 400 for validation
      expect([200, 400]).toContain(res.status);
    });
  });

  // ─── Deadlines ──────────────────────────────

  describe('Deadlines', () => {
    it('GET /api/deadlines should return paginated list', async () => {
      const res = await request(API)
        .get('/api/deadlines')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('GET /api/deadlines/upcoming should return list', async () => {
      const res = await request(API)
        .get('/api/deadlines/upcoming')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Health ──────────────────────────────

  describe('Health', () => {
    it('GET /health should return OK', async () => {
      const res = await request(API)
        .get('/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ─── Auth Guard ──────────────────────────────

  describe('Auth Guard', () => {
    it('should reject requests without token', async () => {
      const res = await request(API)
        .get('/api/clients');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(API)
        .get('/api/clients')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
