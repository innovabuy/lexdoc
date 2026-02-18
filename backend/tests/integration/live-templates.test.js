/**
 * Live Integration Tests — Templates & Blocks
 */
const request = require('supertest');
const { API, getAuthToken } = require('./live-helpers');

describe('Templates & Blocks (live)', () => {
  let token;

  beforeAll(() => {
    token = getAuthToken();
  });

  describe('GET /api/templates/tree', () => {
    it('should return template tree with categories', async () => {
      const res = await request(API)
        .get('/api/templates/tree')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('categories');
      expect(Array.isArray(res.body.data.categories)).toBe(true);
    });
  });

  describe('GET /api/blocks', () => {
    it('should return builder blocks', async () => {
      const res = await request(API)
        .get('/api/blocks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('blocks');
      expect(Array.isArray(res.body.data.blocks)).toBe(true);
      expect(res.body.data.blocks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/template-categories', () => {
    it('should return template categories', async () => {
      const res = await request(API)
        .get('/api/template-categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
