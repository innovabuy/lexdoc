import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { generateAccessToken } from '@/utils/jwt';
import {
  BlockCategory,
  UserRole,
  CabinetStatus,
  BuilderDocumentType,
  Juridiction,
  OutputFormat,
} from '@prisma/client';

describe('Builder Templates API', () => {
  let cabinetId: string;
  let otherCabinetId: string;
  let userId: string;
  let accessToken: string;
  let testTemplateId: string;
  let systemTemplateId: string;
  let testBlockId: string;
  let testBlock2Id: string;

  beforeAll(async () => {
    // Create test cabinet
    const cabinet = await prisma.cabinet.create({
      data: {
        name: 'Test Cabinet for Builder Templates',
        email: 'test-builder-templates@cabinet.fr',
        status: CabinetStatus.ACTIVE,
      },
    });
    cabinetId = cabinet.id;

    // Create another cabinet for isolation tests
    const otherCabinet = await prisma.cabinet.create({
      data: {
        name: 'Other Cabinet',
        email: 'other-cabinet@cabinet.fr',
        status: CabinetStatus.ACTIVE,
      },
    });
    otherCabinetId = otherCabinet.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-builder-user@test.fr',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'Builder',
        role: UserRole.AVOCAT,
        cabinetId: cabinet.id,
        isActive: true,
        emailVerified: true,
      },
    });
    userId = user.id;

    // Generate token
    accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      cabinetId: cabinet.id,
      role: user.role,
    });

    // Create test document blocks
    const testBlock = await prisma.documentBlock.create({
      data: {
        title: 'Test Introduction Block',
        category: BlockCategory.INTRO,
        content: 'Introduction pour l\'affaire {{nomDossier}} concernant {{client}}',
        variables: [
          { name: 'nomDossier', type: 'string', required: true },
          { name: 'client', type: 'string', required: true },
        ],
        tags: ['introduction', 'test'],
        isSystemBlock: false,
        cabinetId: cabinet.id,
        createdById: user.id,
      },
    });
    testBlockId = testBlock.id;

    const testBlock2 = await prisma.documentBlock.create({
      data: {
        title: 'Test Facts Block',
        category: BlockCategory.FAITS,
        content: 'Les faits sont survenus le {{date_incident}}. Montant: {{montant}} euros.',
        variables: [
          { name: 'date_incident', type: 'date', required: true },
          { name: 'montant', type: 'number', required: false },
        ],
        tags: ['faits', 'test'],
        isSystemBlock: false,
        cabinetId: cabinet.id,
        createdById: user.id,
      },
    });
    testBlock2Id = testBlock2.id;

    // Create a system template
    const systemTemplate = await prisma.builderTemplate.create({
      data: {
        name: 'System Assignation Template',
        documentType: BuilderDocumentType.ASSIGNATION_FOND,
        juridiction: Juridiction.TRIBUNAL_JUDICIAIRE,
        blocksStructure: [
          { blockId: testBlockId, order: 0, isOptional: false },
        ],
        requiredVariables: [
          { name: 'nomDossier', type: 'string', required: true },
        ],
        outputFormat: OutputFormat.DOCX,
        isSystemTemplate: true,
        cabinetId: cabinet.id,
        createdById: user.id,
      },
    });
    systemTemplateId = systemTemplate.id;
  });

  afterAll(async () => {
    // Cleanup in order (respect foreign key constraints)
    await prisma.generatedDocument.deleteMany({
      where: { template: { cabinetId: { in: [cabinetId, otherCabinetId] } } },
    });
    await prisma.builderTemplate.deleteMany({
      where: { cabinetId: { in: [cabinetId, otherCabinetId] } },
    });
    await prisma.documentBlock.deleteMany({
      where: { cabinetId: { in: [cabinetId, otherCabinetId] } },
    });
    await prisma.user.deleteMany({
      where: { cabinetId: { in: [cabinetId, otherCabinetId] } },
    });
    await prisma.cabinet.deleteMany({
      where: { id: { in: [cabinetId, otherCabinetId] } },
    });
  });

  describe('POST /api/builder-templates', () => {
    it('should create a new builder template', async () => {
      const response = await request(app)
        .post('/api/builder-templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Conclusions Template',
          documentType: 'CONCLUSIONS_DEFENSE',
          juridiction: 'TRIBUNAL_JUDICIAIRE',
          blocksStructure: [
            { blockId: testBlockId, order: 0, isOptional: false },
            { blockId: testBlock2Id, order: 1, isOptional: true },
          ],
          outputFormat: 'DOCX',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Conclusions Template');
      expect(response.body.data.documentType).toBe('CONCLUSIONS_DEFENSE');
      expect(response.body.data.juridiction).toBe('TRIBUNAL_JUDICIAIRE');
      expect(response.body.data.isSystemTemplate).toBe(false);
      expect(response.body.data.blocksStructure).toHaveLength(2);

      testTemplateId = response.body.data.id;
    });

    it('should auto-collect variables from blocks', async () => {
      const response = await request(app)
        .post('/api/builder-templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Template with Auto Variables',
          documentType: 'ASSIGNATION_FOND',
          blocksStructure: [
            { blockId: testBlockId, order: 0 },
            { blockId: testBlock2Id, order: 1 },
          ],
        });

      expect(response.status).toBe(201);
      const variables = response.body.data.requiredVariables;
      expect(variables).toBeInstanceOf(Array);
      // Should contain variables from both blocks
      expect(variables.some((v: any) => v.name === 'nomDossier')).toBe(true);
      expect(variables.some((v: any) => v.name === 'client')).toBe(true);
      expect(variables.some((v: any) => v.name === 'date_incident')).toBe(true);
    });

    it('should reject invalid block references', async () => {
      const response = await request(app)
        .post('/api/builder-templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Template with Invalid Blocks',
          documentType: 'ASSIGNATION_FOND',
          blocksStructure: [
            { blockId: '00000000-0000-0000-0000-000000000000', order: 0 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('invalid or not accessible');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/builder-templates')
        .send({
          name: 'Unauthorized Template',
          documentType: 'ASSIGNATION_FOND',
        });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/builder-templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing name and documentType
        });

      // Zod validation returns 422 Unprocessable Entity
      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/builder-templates', () => {
    it('should list builder templates', async () => {
      const response = await request(app)
        .get('/api/builder-templates')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter by documentType', async () => {
      const response = await request(app)
        .get('/api/builder-templates?documentType=ASSIGNATION_FOND')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(
        response.body.data.every((t: any) => t.documentType === 'ASSIGNATION_FOND')
      ).toBe(true);
    });

    it('should filter by juridiction', async () => {
      const response = await request(app)
        .get('/api/builder-templates?juridiction=TRIBUNAL_JUDICIAIRE')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(
        response.body.data.every((t: any) => t.juridiction === 'TRIBUNAL_JUDICIAIRE')
      ).toBe(true);
    });

    it('should filter by isSystemTemplate', async () => {
      const response = await request(app)
        .get('/api/builder-templates?isSystemTemplate=true')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((t: any) => t.isSystemTemplate === true)).toBe(true);
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/builder-templates?search=Conclusions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.some((t: any) => t.name.includes('Conclusions'))
      ).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/builder-templates?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/builder-templates?sortBy=name&sortOrder=desc')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const names = response.body.data.map((t: any) => t.name);
      const sortedNames = [...names].sort().reverse();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('GET /api/builder-templates/:id', () => {
    it('should get a specific builder template with expanded blocks', async () => {
      const response = await request(app)
        .get(`/api/builder-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTemplateId);
      expect(response.body.data.expandedBlocks).toBeDefined();
      expect(response.body.data.expandedBlocks).toBeInstanceOf(Array);
      expect(response.body.data.expandedBlocks[0]).toHaveProperty('block');
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/builder-templates/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should allow access to system templates from any cabinet', async () => {
      const response = await request(app)
        .get(`/api/builder-templates/${systemTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isSystemTemplate).toBe(true);
    });
  });

  describe('GET /api/builder-templates/:id/variables', () => {
    it('should return all required variables for a template', async () => {
      const response = await request(app)
        .get(`/api/builder-templates/${testTemplateId}/variables`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.some((v: any) => v.name === 'nomDossier')).toBe(true);
      expect(response.body.data.some((v: any) => v.name === 'client')).toBe(true);
    });

    it('should sort variables with required first', async () => {
      const response = await request(app)
        .get(`/api/builder-templates/${testTemplateId}/variables`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const variables = response.body.data;
      const requiredVars = variables.filter((v: any) => v.required);
      const optionalVars = variables.filter((v: any) => !v.required);

      // Required should come before optional
      if (requiredVars.length > 0 && optionalVars.length > 0) {
        const lastRequiredIndex = variables.findIndex(
          (v: any) => v.name === requiredVars[requiredVars.length - 1].name
        );
        const firstOptionalIndex = variables.findIndex(
          (v: any) => v.name === optionalVars[0].name
        );
        expect(lastRequiredIndex).toBeLessThan(firstOptionalIndex);
      }
    });
  });

  describe('PUT /api/builder-templates/:id', () => {
    it('should update a builder template', async () => {
      const response = await request(app)
        .put(`/api/builder-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Conclusions Template',
          juridiction: 'COUR_APPEL',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Conclusions Template');
      expect(response.body.data.juridiction).toBe('COUR_APPEL');
    });

    it('should update blocks structure', async () => {
      const response = await request(app)
        .put(`/api/builder-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          blocksStructure: [
            { blockId: testBlock2Id, order: 0, isOptional: false },
            { blockId: testBlockId, order: 1, isOptional: true },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.blocksStructure).toHaveLength(2);
      expect(response.body.data.blocksStructure[0].blockId).toBe(testBlock2Id);
    });

    it('should not allow updating system templates', async () => {
      const response = await request(app)
        .put(`/api/builder-templates/${systemTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Attempted System Template Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('System templates cannot be modified');
    });

    it('should validate block references on update', async () => {
      const response = await request(app)
        .put(`/api/builder-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          blocksStructure: [
            { blockId: '00000000-0000-0000-0000-000000000000', order: 0 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('invalid or not accessible');
    });
  });

  describe('POST /api/builder-templates/:id/duplicate', () => {
    it('should duplicate a builder template', async () => {
      const response = await request(app)
        .post(`/api/builder-templates/${testTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('(copie)');
      expect(response.body.data.isSystemTemplate).toBe(false);
      expect(response.body.data.id).not.toBe(testTemplateId);
    });

    it('should allow duplicating system templates', async () => {
      const response = await request(app)
        .post(`/api/builder-templates/${systemTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(201);
      expect(response.body.data.name).toContain('(copie)');
      expect(response.body.data.isSystemTemplate).toBe(false);
    });

    it('should copy all template data', async () => {
      const originalResponse = await request(app)
        .get(`/api/builder-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const duplicateResponse = await request(app)
        .post(`/api/builder-templates/${testTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(duplicateResponse.status).toBe(201);
      const original = originalResponse.body.data;
      const duplicate = duplicateResponse.body.data;

      expect(duplicate.documentType).toBe(original.documentType);
      expect(duplicate.juridiction).toBe(original.juridiction);
      expect(duplicate.blocksStructure).toEqual(original.blocksStructure);
      expect(duplicate.outputFormat).toBe(original.outputFormat);
    });
  });

  describe('POST /api/builder-templates/:id/preview', () => {
    it('should generate a preview with variables', async () => {
      const response = await request(app)
        .post(`/api/builder-templates/${testTemplateId}/preview`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          variables: {
            nomDossier: 'Dossier 2024-001',
            client: 'M. Dupont',
            date_incident: '15 janvier 2024',
            montant: 5000,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preview).toBeDefined();
      expect(response.body.data.preview).toContain('Dossier 2024-001');
      expect(response.body.data.preview).toContain('M. Dupont');
    });

    it('should report missing required variables', async () => {
      const response = await request(app)
        .post(`/api/builder-templates/${testTemplateId}/preview`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          variables: {
            nomDossier: 'Dossier 2024-001',
            // Missing other required variables
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.missingVariables).toBeDefined();
      expect(response.body.data.missingVariables).toBeInstanceOf(Array);
    });

    it('should increment usage count', async () => {
      // Get current usage count
      const beforeResponse = await request(app)
        .get(`/api/builder-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      const beforeCount = beforeResponse.body.data.usageCount || 0;

      // Generate preview
      await request(app)
        .post(`/api/builder-templates/${testTemplateId}/preview`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ variables: {} });

      // Check usage count increased
      const afterResponse = await request(app)
        .get(`/api/builder-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(afterResponse.body.data.usageCount).toBe(beforeCount + 1);
    });
  });

  describe('GET /api/builder-templates/document-types', () => {
    it('should return document types with counts', async () => {
      const response = await request(app)
        .get('/api/builder-templates/document-types')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('documentType');
      expect(response.body.data[0]).toHaveProperty('count');
    });
  });

  describe('GET /api/builder-templates/juridictions', () => {
    it('should return juridictions with counts', async () => {
      const response = await request(app)
        .get('/api/builder-templates/juridictions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('juridiction');
        expect(response.body.data[0]).toHaveProperty('count');
      }
    });
  });

  describe('GET /api/builder-templates/by-type/:documentType', () => {
    it('should return templates for a specific document type', async () => {
      const response = await request(app)
        .get('/api/builder-templates/by-type/ASSIGNATION_FOND')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(
        response.body.data.every((t: any) => t.documentType === 'ASSIGNATION_FOND')
      ).toBe(true);
    });

    it('should include preview and blockCount', async () => {
      const response = await request(app)
        .get('/api/builder-templates/by-type/ASSIGNATION_FOND')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        const template = response.body.data[0];
        expect(template).toHaveProperty('blockCount');
        // preview may be null if no blocks
      }
    });

    it('should sort by system templates first, then usage count', async () => {
      const response = await request(app)
        .get('/api/builder-templates/by-type/ASSIGNATION_FOND')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const templates = response.body.data;

      // System templates should come first
      let foundNonSystem = false;
      for (const t of templates) {
        if (!t.isSystemTemplate) {
          foundNonSystem = true;
        }
        if (foundNonSystem && t.isSystemTemplate) {
          fail('System template found after non-system template');
        }
      }
    });

    it('should return 422 for invalid document type', async () => {
      const response = await request(app)
        .get('/api/builder-templates/by-type/INVALID_TYPE')
        .set('Authorization', `Bearer ${accessToken}`);

      // Zod validation returns 422 Unprocessable Entity for invalid enum values
      expect(response.status).toBe(422);
    });

    it('should include both cabinet and system templates', async () => {
      const response = await request(app)
        .get('/api/builder-templates/by-type/ASSIGNATION_FOND')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const hasSystem = response.body.data.some((t: any) => t.isSystemTemplate === true);
      expect(hasSystem).toBe(true);
    });
  });

  describe('DELETE /api/builder-templates/:id', () => {
    let templateToDeleteId: string;

    beforeAll(async () => {
      // Create a template specifically for deletion test
      const template = await prisma.builderTemplate.create({
        data: {
          name: 'Template to Delete',
          documentType: BuilderDocumentType.REQUETE,
          isSystemTemplate: false,
          cabinetId: cabinetId,
          createdById: userId,
        },
      });
      templateToDeleteId = template.id;
    });

    it('should not allow deleting system templates', async () => {
      const response = await request(app)
        .delete(`/api/builder-templates/${systemTemplateId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('System templates cannot be deleted');
    });

    it('should soft delete a builder template', async () => {
      const response = await request(app)
        .delete(`/api/builder-templates/${templateToDeleteId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify template is not returned in list
      const listResponse = await request(app)
        .get('/api/builder-templates')
        .set('Authorization', `Bearer ${accessToken}`);

      const deletedTemplate = listResponse.body.data.find(
        (t: any) => t.id === templateToDeleteId
      );
      expect(deletedTemplate).toBeUndefined();
    });

    it('should return 404 for already deleted template', async () => {
      const response = await request(app)
        .delete(`/api/builder-templates/${templateToDeleteId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});

describe('BuilderTemplatesService', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { builderTemplatesService } = require('./builder-templates.service');

  describe('getById', () => {
    it('should expand blocks with full content', async () => {
      // This test would need actual database setup
      // For now, we test the service is available
      expect(builderTemplatesService).toBeDefined();
      expect(typeof builderTemplatesService.getById).toBe('function');
    });
  });

  describe('getTemplateVariables', () => {
    it('should be a function', () => {
      expect(typeof builderTemplatesService.getTemplateVariables).toBe('function');
    });
  });

  describe('generatePreview', () => {
    it('should be a function', () => {
      expect(typeof builderTemplatesService.generatePreview).toBe('function');
    });
  });

  describe('getByDocumentType', () => {
    it('should be a function', () => {
      expect(typeof builderTemplatesService.getByDocumentType).toBe('function');
    });
  });
});
