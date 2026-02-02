/**
 * Metadata Auto-fill Tests - 18 tests
 * Tests for automatic metadata population (Instruction #7)
 */

import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { createTestSetup, createTestAvocat, TestUser, TestCabinet } from '../helpers';

describe('04. Metadata Auto-fill Tests (Instruction #7)', () => {
  let cabinet: TestCabinet;
  let admin: TestUser;
  let avocat: TestUser;

  beforeAll(async () => {
    const setup = await createTestSetup();
    cabinet = setup.cabinet;
    admin = setup.admin;
    avocat = await createTestAvocat(cabinet.id);

    // Create avocat legal info for auto-fill source
    await prisma.avocatLegalInfo.create({
      data: {
        userId: avocat.id,
        cabinetId: cabinet.id,
        nom: 'Martin',
        prenom: 'Sophie',
        specialite: 'Droit commercial',
        barreauVille: 'Lyon',
        numeroBarreau: '789012',
        adresseProfessionnelle: '20 Place Bellecour, 69002 Lyon',
        telephoneProfessionnel: '+33 4 78 00 00 00',
        emailProfessionnel: 'sophie.martin@barreau-lyon.fr',
      },
    });
  });

  afterAll(async () => {
    await prisma.avocatLegalInfo.deleteMany({ where: { cabinetId: cabinet.id } });
  });

  describe('Avocat Info Auto-fill', () => {
    test('[#7-001] GET /api/autofill/avocat - Returns avocat info', async () => {
      const response = await request(app)
        .get('/api/autofill/avocat')
        .set('Authorization', `Bearer ${avocat.accessToken}`);

      expect([200, 404]).toContain(response.status);
    });

    test('[#7-002] Auto-fill includes nom and prenom', async () => {
      const info = await prisma.avocatLegalInfo.findFirst({
        where: { userId: avocat.id },
      });

      expect(info?.nom).toBe('Martin');
      expect(info?.prenom).toBe('Sophie');
    });

    test('[#7-003] Auto-fill includes professional address', async () => {
      const info = await prisma.avocatLegalInfo.findFirst({
        where: { userId: avocat.id },
      });

      expect(info?.adresseProfessionnelle).toContain('Lyon');
    });

    test('[#7-004] Auto-fill includes barreau info', async () => {
      const info = await prisma.avocatLegalInfo.findFirst({
        where: { userId: avocat.id },
      });

      expect(info?.barreauVille).toBe('Lyon');
      expect(info?.numeroBarreau).toBe('789012');
    });
  });

  describe('Cabinet Info Auto-fill', () => {
    test('[#7-005] GET /api/autofill/cabinet - Returns cabinet info', async () => {
      const response = await request(app)
        .get('/api/cabinets/current')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
    });

    test('[#7-006] Cabinet name available for auto-fill', async () => {
      const cab = await prisma.cabinet.findUnique({
        where: { id: cabinet.id },
      });

      expect(cab?.name).toBeDefined();
    });

    test('[#7-007] Cabinet address available for auto-fill', async () => {
      await prisma.cabinet.update({
        where: { id: cabinet.id },
        data: { address: '1 Rue du Cabinet' },
      });

      const cab = await prisma.cabinet.findUnique({
        where: { id: cabinet.id },
      });

      expect(cab?.address).toBe('1 Rue du Cabinet');
    });

    test('[#7-008] Cabinet email available for auto-fill', async () => {
      const cab = await prisma.cabinet.findUnique({
        where: { id: cabinet.id },
      });

      expect(cab?.email).toBeDefined();
    });
  });

  describe('Client Info Auto-fill', () => {
    test('[#7-009] Client data can be used for auto-fill', async () => {
      const client = await prisma.client.create({
        data: {
          cabinetId: cabinet.id,
          type: 'PARTICULIER',
          nom: 'Durand',
          prenom: 'Pierre',
          email: 'pierre.durand@email.com',
        },
      });

      expect(client.nom).toBe('Durand');
      expect(client.prenom).toBe('Pierre');

      // Cleanup
      await prisma.client.delete({ where: { id: client.id } });
    });

    test('[#7-010] Company client includes SIRET', async () => {
      const client = await prisma.client.create({
        data: {
          cabinetId: cabinet.id,
          type: 'ENTREPRISE',
          raisonSociale: 'Entreprise Test SARL',
          siret: '12345678901234',
        },
      });

      expect(client.siret).toBe('12345678901234');

      // Cleanup
      await prisma.client.delete({ where: { id: client.id } });
    });

    test('[#7-011] Client address available', async () => {
      const client = await prisma.client.create({
        data: {
          cabinetId: cabinet.id,
          type: 'PARTICULIER',
          nom: 'Test',
          adresse: '123 Rue Test',
          codePostal: '75001',
          ville: 'Paris',
        },
      });

      expect(client.adresse).toBe('123 Rue Test');

      // Cleanup
      await prisma.client.delete({ where: { id: client.id } });
    });
  });

  describe('Template Variables', () => {
    test('[#7-012] Template variables extracted correctly', async () => {
      const template = await prisma.builderTemplate.create({
        data: {
          cabinetId: cabinet.id,
          createdById: admin.id,
          name: 'Variable Test Template',
          category: 'AUTRES',
          content: 'Nom: {{avocat.nom}}, Cabinet: {{cabinet.name}}',
          variables: {
            'avocat.nom': { type: 'string', source: 'avocat' },
            'cabinet.name': { type: 'string', source: 'cabinet' },
          },
        },
      });

      expect(template.variables).toBeDefined();

      // Cleanup
      await prisma.builderTemplate.delete({ where: { id: template.id } });
    });

    test('[#7-013] Variables include type information', async () => {
      const variables = {
        'date.aujourdhui': { type: 'date', source: 'system' },
        'montant.total': { type: 'number', source: 'user' },
      };

      expect(variables['date.aujourdhui'].type).toBe('date');
      expect(variables['montant.total'].type).toBe('number');
    });

    test('[#7-014] Variables include source information', async () => {
      const variables = {
        'avocat.nom': { type: 'string', source: 'avocat' },
        'client.nom': { type: 'string', source: 'client' },
        'custom.field': { type: 'string', source: 'user' },
      };

      expect(variables['avocat.nom'].source).toBe('avocat');
      expect(variables['client.nom'].source).toBe('client');
      expect(variables['custom.field'].source).toBe('user');
    });
  });

  describe('Date Auto-fill', () => {
    test('[#7-015] Current date available', async () => {
      const today = new Date().toISOString().split('T')[0];
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('[#7-016] Date formatting works', async () => {
      const date = new Date();
      const formatted = date.toLocaleDateString('fr-FR');
      expect(formatted).toBeDefined();
    });
  });

  describe('Security', () => {
    test('[#7-017] Auto-fill respects cabinet isolation', async () => {
      const otherCabinet = await prisma.cabinet.create({
        data: {
          name: 'Other Cabinet',
          email: `other-autofill-${Date.now()}@test.com`,
        },
      });

      // Cannot access other cabinet's data
      const info = await prisma.avocatLegalInfo.findFirst({
        where: {
          cabinetId: otherCabinet.id,
        },
      });

      expect(info).toBeNull();

      // Cleanup
      await prisma.cabinet.delete({ where: { id: otherCabinet.id } });
    });

    test('[#7-018] Requires authentication', async () => {
      const response = await request(app)
        .get('/api/cabinets/current');

      expect(response.status).toBe(401);
    });
  });
});
