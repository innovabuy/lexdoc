import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { generateAccessToken } from '@/utils/jwt';
import { UserRole, CabinetStatus, Civilite } from '@prisma/client';

describe('Avocat Legal Info API', () => {
  let cabinetId: string;
  let userId: string;
  let otherUserId: string;
  let accessToken: string;
  let otherUserToken: string;
  let legalInfoId: string;

  const validLegalInfo = {
    civilite: 'MAITRE',
    nom: 'Dupont',
    prenom: 'Jean',
    barreau: 'Barreau de Paris',
    numeroToque: 'P0001',
    adresseCabinet: '10 rue de la Justice',
    codePostal: '75001',
    ville: 'Paris',
    telephone: '0612345678',
    fax: '0112345678',
    email: 'jean.dupont@avocat.fr',
    siteWeb: 'https://www.dupont-avocat.fr',
  };

  beforeAll(async () => {
    // Create test cabinet
    const cabinet = await prisma.cabinet.create({
      data: {
        name: 'Test Cabinet for Legal Info',
        email: 'test-legal-info@cabinet.fr',
        status: CabinetStatus.ACTIVE,
      },
    });
    cabinetId = cabinet.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'avocat-test@test.fr',
        password: 'hashed_password',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: UserRole.AVOCAT,
        cabinetId: cabinet.id,
        isActive: true,
        emailVerified: true,
      },
    });
    userId = user.id;

    // Create another user for access control tests
    const otherUser = await prisma.user.create({
      data: {
        email: 'other-avocat@test.fr',
        password: 'hashed_password',
        firstName: 'Marie',
        lastName: 'Martin',
        role: UserRole.AVOCAT,
        cabinetId: cabinet.id,
        isActive: true,
        emailVerified: true,
      },
    });
    otherUserId = otherUser.id;

    // Generate tokens
    accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      cabinetId: cabinet.id,
      role: user.role,
    });

    otherUserToken = generateAccessToken({
      userId: otherUser.id,
      email: otherUser.email,
      cabinetId: cabinet.id,
      role: otherUser.role,
    });
  });

  afterAll(async () => {
    // Cleanup in order
    await prisma.avocatLegalInfo.deleteMany({ where: { cabinetId } });
    await prisma.user.deleteMany({ where: { cabinetId } });
    await prisma.cabinet.delete({ where: { id: cabinetId } });
  });

  describe('GET /api/avocat-legal-info/me', () => {
    it('should return empty template when no legal info exists', async () => {
      const response = await request(app)
        .get('/api/avocat-legal-info/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(false);
      expect(response.body.data.template).toBeDefined();
      expect(response.body.data.template.civilite).toBe('MAITRE');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/avocat-legal-info/me');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/avocat-legal-info', () => {
    it('should create legal info profile', async () => {
      const response = await request(app)
        .post('/api/avocat-legal-info')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validLegalInfo);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nom).toBe('Dupont');
      expect(response.body.data.prenom).toBe('Jean');
      expect(response.body.data.barreau).toBe('Barreau de Paris');
      expect(response.body.data.email).toBe('jean.dupont@avocat.fr');

      legalInfoId = response.body.data.id;
    });

    it('should not allow duplicate legal info for same user', async () => {
      const response = await request(app)
        .post('/api/avocat-legal-info')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validLegalInfo);

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('existent déjà');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/avocat-legal-info')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          nom: 'Test',
          // Missing required fields
        });

      expect(response.status).toBe(422);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/avocat-legal-info')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          ...validLegalInfo,
          email: 'invalid-email',
        });

      expect(response.status).toBe(422);
    });

    it('should validate phone format', async () => {
      const response = await request(app)
        .post('/api/avocat-legal-info')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          ...validLegalInfo,
          email: 'other@avocat.fr',
          telephone: '123',
        });

      expect(response.status).toBe(422);
    });

    it('should validate postal code format', async () => {
      const response = await request(app)
        .post('/api/avocat-legal-info')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          ...validLegalInfo,
          email: 'other@avocat.fr',
          codePostal: '123',
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/avocat-legal-info/me (after creation)', () => {
    it('should return legal info when it exists', async () => {
      const response = await request(app)
        .get('/api/avocat-legal-info/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(true);
      expect(response.body.data.data.nom).toBe('Dupont');
      expect(response.body.data.data.prenom).toBe('Jean');
    });
  });

  describe('GET /api/avocat-legal-info/:id', () => {
    it('should get legal info by ID', async () => {
      const response = await request(app)
        .get(`/api/avocat-legal-info/${legalInfoId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(legalInfoId);
    });

    it('should not allow access to other user legal info', async () => {
      const response = await request(app)
        .get(`/api/avocat-legal-info/${legalInfoId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/api/avocat-legal-info/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/avocat-legal-info/:id', () => {
    it('should update legal info', async () => {
      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ville: 'Lyon',
          codePostal: '69001',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ville).toBe('Lyon');
      expect(response.body.data.codePostal).toBe('69001');
      // Other fields should remain unchanged
      expect(response.body.data.nom).toBe('Dupont');
    });

    it('should not allow other user to update', async () => {
      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          ville: 'Marseille',
        });

      expect(response.status).toBe(403);
    });

    it('should validate updated fields', async () => {
      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/avocat-legal-info/:id/preview-mentions', () => {
    it('should generate HTML preview', async () => {
      const response = await request(app)
        .get(`/api/avocat-legal-info/${legalInfoId}/preview-mentions`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.html).toBeDefined();
      expect(response.body.data.html).toContain('Dupont');
      expect(response.body.data.html).toContain('Jean');
      expect(response.body.data.html).toContain('Barreau de Paris');
      expect(response.body.data.variables).toBeDefined();
    });

    it('should not allow other user to preview', async () => {
      const response = await request(app)
        .get(`/api/avocat-legal-info/${legalInfoId}/preview-mentions`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/avocat-legal-info/:id/signature', () => {
    it('should require a file', async () => {
      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}/signature`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Aucun fichier');
    });

    // Skip upload test if MinIO is not configured (requires integration environment)
    it.skip('should upload signature image (requires MinIO)', async () => {
      // Create a simple PNG buffer (1x1 pixel transparent PNG)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}/signature`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', pngBuffer, 'signature.png');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.signatureImage).toBeDefined();
      expect(response.body.data.signatureUrl).toBeDefined();
    });

    it('should not allow other user to upload signature', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}/signature`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .attach('file', pngBuffer, 'signature.png');

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/avocat-legal-info/:id/cachet', () => {
    it('should require a file', async () => {
      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}/cachet`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Aucun fichier');
    });

    // Skip upload test if MinIO is not configured (requires integration environment)
    it.skip('should upload cachet image (requires MinIO)', async () => {
      // Create a simple PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}/cachet`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', pngBuffer, 'cachet.png');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cachetCabinet).toBeDefined();
      expect(response.body.data.cachetUrl).toBeDefined();
    });

    it('should not allow other user to upload cachet', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app)
        .put(`/api/avocat-legal-info/${legalInfoId}/cachet`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .attach('file', pngBuffer, 'cachet.png');

      expect(response.status).toBe(403);
    });
  });
});

describe('AvocatLegalInfoService', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { avocatLegalInfoService } = require('./avocat-legal-info.service');

  describe('service methods', () => {
    it('should have getMyLegalInfo method', () => {
      expect(typeof avocatLegalInfoService.getMyLegalInfo).toBe('function');
    });

    it('should have create method', () => {
      expect(typeof avocatLegalInfoService.create).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof avocatLegalInfoService.update).toBe('function');
    });

    it('should have uploadSignature method', () => {
      expect(typeof avocatLegalInfoService.uploadSignature).toBe('function');
    });

    it('should have uploadCachet method', () => {
      expect(typeof avocatLegalInfoService.uploadCachet).toBe('function');
    });

    it('should have previewMentions method', () => {
      expect(typeof avocatLegalInfoService.previewMentions).toBe('function');
    });
  });
});
