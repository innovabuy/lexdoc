/**
 * Live Integration Tests — Clients CRUD
 */
const request = require('supertest');
const { API, getAuthToken } = require('./live-helpers');

describe('Clients CRUD (live)', () => {
  let token;
  let createdClientId;

  beforeAll(() => {
    token = getAuthToken();
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const res = await request(API)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          lastName: 'TEST-E2E',
          firstName: 'Client',
          type: 'INDIVIDUAL',
          email: `test-e2e-${Date.now()}@test.fr`,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.lastName).toBe('TEST-E2E');
      createdClientId = res.body.data.id;
    });

    it('should reject client without required fields', async () => {
      const res = await request(API)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/clients', () => {
    it('should list clients', async () => {
      const res = await request(API)
        .get('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return a client by id', async () => {
      const res = await request(API)
        .get(`/api/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdClientId);
      expect(res.body.data.lastName).toBe('TEST-E2E');
    });

    it('should return 404 for non-existent client', async () => {
      const res = await request(API)
        .get('/api/clients/nonexistent-id-xyz')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update a client', async () => {
      const res = await request(API)
        .put(`/api/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'ClientModifie' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('ClientModifie');
    });
  });

  // Cleanup
  afterAll(async () => {
    if (createdClientId) {
      await request(API)
        .delete(`/api/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });
});
