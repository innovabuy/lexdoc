/**
 * Live Integration Tests — Folders
 */
const request = require('supertest');
const { API, getAuthToken } = require('./live-helpers');

describe('Folders (live)', () => {
  let token;
  let testClientId;
  let createdFolderId;

  beforeAll(async () => {
    token = getAuthToken();

    // Get first client for folder creation
    const clients = await request(API)
      .get('/api/clients')
      .set('Authorization', `Bearer ${token}`);
    testClientId = clients.body.data[0]?.id;
  });

  describe('GET /api/folders', () => {
    it('should list folders with pagination', async () => {
      const res = await request(API)
        .get('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('POST /api/folders', () => {
    it('should create a juridique folder', async () => {
      if (!testClientId) return;

      const res = await request(API)
        .post('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test E2E Folder 2026',
          type: 'LITIGATION',
          clientId: testClientId,
        });

      // Accept 200 or 201
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdFolderId = res.body.data.id;
    });
  });

  describe('GET /api/folders/:id', () => {
    it('should return folder details', async () => {
      if (!createdFolderId) return;

      const res = await request(API)
        .get(`/api/folders/${createdFolderId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title');
    });
  });

  // Cleanup
  afterAll(async () => {
    if (createdFolderId) {
      await request(API)
        .delete(`/api/folders/${createdFolderId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });
});
