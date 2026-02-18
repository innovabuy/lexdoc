/**
 * Live Integration Tests — Auth & Onboarding
 * Tests against the running server on port 4000
 */
const request = require('supertest');
const { API, getAuthToken } = require('./live-helpers');

describe('Auth & Onboarding (live)', () => {
  let token;

  beforeAll(() => {
    token = getAuthToken();
  });

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      // Token already obtained in globalSetup; verify format
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(API)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return error for missing fields', async () => {
      const res = await request(API)
        .post('/api/auth/login')
        .send({});

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(API)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tenant');
      expect(res.body.data.user.email).toBe('yves-marie.bienaime@pragmavox.fr');
    });

    it('should return 401 without token', async () => {
      await request(API)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('GET /api/onboarding/status', () => {
    it('should return onboarding status', async () => {
      const res = await request(API)
        .get('/api/onboarding/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('completed');
      expect(res.body.data).toHaveProperty('currentStep');
    });
  });
});
