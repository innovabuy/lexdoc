/**
 * Live Integration Tests — Settings (Tree Templates, Users, Cabinet)
 */
const request = require('supertest');
const { API, getAuthToken } = require('./live-helpers');
const prisma = require('../../src/config/database');

describe('Settings (live)', () => {
  let token;

  beforeAll(() => {
    token = getAuthToken();
  });

  // ─── Tree Templates ──────────────────────────────

  describe('Tree Templates', () => {
    let createdId;

    it('GET /api/tree-templates should list templates', async () => {
      const res = await request(API)
        .get('/api/tree-templates')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/tree-templates should create a template', async () => {
      const res = await request(API)
        .post('/api/tree-templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Template E2E',
          folderType: 'juridique',
          categories: [{ name: 'Cat Test', ordre: 0 }],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdId = res.body.data.id;
    });

    it('PUT /api/tree-templates/:id should update', async () => {
      if (!createdId) return;

      const res = await request(API)
        .put(`/api/tree-templates/${createdId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Template E2E Updated' })
        .expect(200);

      expect(res.body.data.name).toBe('Test Template E2E Updated');
    });

    it('PUT /api/tree-templates/:id/categories should reorder', async () => {
      if (!createdId) return;

      const res = await request(API)
        .put(`/api/tree-templates/${createdId}/categories`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          categories: [
            { name: 'Cat A', ordre: 0 },
            { name: 'Cat B', ordre: 1 },
            { name: 'Cat C', ordre: 2 },
          ],
        })
        .expect(200);

      expect(res.body.data.categories).toHaveLength(3);
    });

    it('POST /api/tree-templates/:id/set-default should work', async () => {
      if (!createdId) return;

      const res = await request(API)
        .post(`/api/tree-templates/${createdId}/set-default`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.isDefault).toBe(true);
    });

    it('DELETE /api/tree-templates/:id should delete', async () => {
      if (!createdId) return;

      const res = await request(API)
        .delete(`/api/tree-templates/${createdId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ─── Users ──────────────────────────────

  describe('Users', () => {
    let createdUserId;

    it('GET /api/users should list users', async () => {
      const res = await request(API)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify user shape
      const user = res.body.data[0];
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
    });

    it('POST /api/users should create a user with temp password', async () => {
      const res = await request(API)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: `test-e2e-user-${Date.now()}@test.fr`,
          firstName: 'E2E',
          lastName: 'TestUser',
          role: 'ASSISTANT',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('temporaryPassword');
      expect(res.body.data.temporaryPassword.length).toBeGreaterThanOrEqual(8);
      createdUserId = res.body.data.id;
    });

    it('POST /api/users/:id/reset-password should generate new password', async () => {
      if (!createdUserId) return;

      const res = await request(API)
        .post(`/api/users/${createdUserId}/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('temporaryPassword');
    });

    it('POST /api/users/:id/deactivate should deactivate', async () => {
      if (!createdUserId) return;

      const res = await request(API)
        .post(`/api/users/${createdUserId}/deactivate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.isActive).toBe(false);
    });

    it('POST /api/users/:id/activate should reactivate', async () => {
      if (!createdUserId) return;

      const res = await request(API)
        .post(`/api/users/${createdUserId}/activate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.isActive).toBe(true);
    });
  });

  // ─── Cabinet Settings ──────────────────────────────

  describe('Cabinet Settings', () => {
    it('GET /api/settings should return tenant + settings', async () => {
      const res = await request(API)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('tenant');
      expect(res.body.data).toHaveProperty('settings');

      // Verify tenant shape
      expect(res.body.data.tenant).toHaveProperty('name');
      expect(res.body.data.tenant).toHaveProperty('email');

      // Verify settings shape
      expect(res.body.data.settings).toHaveProperty('enableReminders');
      expect(res.body.data.settings).toHaveProperty('reminderDelay1');
      expect(res.body.data.settings).toHaveProperty('reminderDelay2');
      expect(res.body.data.settings).toHaveProperty('reminderDelay3');
      expect(res.body.data.settings).toHaveProperty('reminderNotify');
    });

    it('PUT /api/settings/preferences should update settings', async () => {
      const res = await request(API)
        .put('/api/settings/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reminderDelay1: 5,
          reminderDelay2: 10,
          reminderDelay3: 20,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.reminderDelay1).toBe(5);
      expect(res.body.data.reminderDelay2).toBe(10);
      expect(res.body.data.reminderDelay3).toBe(20);
    });

    it('should restore default settings', async () => {
      const res = await request(API)
        .put('/api/settings/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reminderDelay1: 3,
          reminderDelay2: 7,
          reminderDelay3: 14,
        })
        .expect(200);

      expect(res.body.data.reminderDelay1).toBe(3);
    });
  });

  // Cleanup test users to avoid hitting user limit
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test-e2e' } } });
    await prisma.$disconnect();
  });
});
