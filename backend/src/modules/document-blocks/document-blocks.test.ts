import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { generateAccessToken } from '@/utils/jwt';
import { BlockCategory, UserRole, CabinetStatus } from '@prisma/client';

describe('Document Blocks API', () => {
  let cabinetId: string;
  let userId: string;
  let accessToken: string;
  let testBlockId: string;
  let systemBlockId: string;

  beforeAll(async () => {
    // Create test cabinet
    const cabinet = await prisma.cabinet.create({
      data: {
        name: 'Test Cabinet for Blocks',
        email: 'test-blocks@cabinet.fr',
        status: CabinetStatus.ACTIVE,
      },
    });
    cabinetId = cabinet.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-blocks-user@test.fr',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
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

    // Create a system block
    const systemBlock = await prisma.documentBlock.create({
      data: {
        title: 'System Test Block',
        category: BlockCategory.INTRO,
        content: 'This is a system block with {{variable}}',
        variables: [{ name: 'variable', type: 'string' }],
        tags: ['system', 'test'],
        isSystemBlock: true,
        cabinetId: cabinet.id,
        createdById: user.id,
      },
    });
    systemBlockId = systemBlock.id;
  });

  afterAll(async () => {
    // Cleanup in order
    await prisma.documentBlock.deleteMany({ where: { cabinetId } });
    await prisma.user.deleteMany({ where: { cabinetId } });
    await prisma.cabinet.delete({ where: { id: cabinetId } });
  });

  describe('POST /api/document-blocks', () => {
    it('should create a new document block', async () => {
      const response = await request(app)
        .post('/api/document-blocks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Introduction Block',
          category: 'INTRO',
          content: 'Introduction pour l\'affaire {{nomDossier}} concernant {{client}}',
          tags: ['introduction', 'test'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Introduction Block');
      expect(response.body.data.category).toBe('INTRO');
      expect(response.body.data.isSystemBlock).toBe(false);
      expect(response.body.data.variables).toBeDefined();
      expect(response.body.data.variables.length).toBeGreaterThan(0);

      testBlockId = response.body.data.id;
    });

    it('should auto-extract variables from content', async () => {
      const response = await request(app)
        .post('/api/document-blocks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Block with Variables',
          category: 'FAITS',
          content: 'Le {{date_incident}}, {{client_name}} a subi un préjudice de {{montant_dommages}} euros.',
        });

      expect(response.status).toBe(201);
      const variables = response.body.data.variables;
      expect(variables).toContainEqual(expect.objectContaining({ name: 'date_incident', type: 'date' }));
      expect(variables).toContainEqual(expect.objectContaining({ name: 'client_name', type: 'string' }));
      expect(variables).toContainEqual(expect.objectContaining({ name: 'montant_dommages', type: 'number' }));
    });

    it('should reject invalid Handlebars syntax', async () => {
      const response = await request(app)
        .post('/api/document-blocks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Invalid Block',
          category: 'INTRO',
          content: '{{#if condition}} unclosed block',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid template syntax');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/document-blocks')
        .send({
          title: 'Unauthorized Block',
          category: 'INTRO',
          content: 'Test content',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/document-blocks', () => {
    it('should list document blocks', async () => {
      const response = await request(app)
        .get('/api/document-blocks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/document-blocks?category=INTRO')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((block: any) => block.category === 'INTRO')).toBe(true);
    });

    it('should filter by tags', async () => {
      const response = await request(app)
        .get('/api/document-blocks?tags=test')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((block: any) => block.tags.includes('test'))).toBe(true);
    });

    it('should search by title or content', async () => {
      const response = await request(app)
        .get('/api/document-blocks?search=Introduction')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/document-blocks?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/document-blocks/:id', () => {
    it('should get a specific document block', async () => {
      const response = await request(app)
        .get(`/api/document-blocks/${testBlockId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testBlockId);
    });

    it('should return 404 for non-existent block', async () => {
      const response = await request(app)
        .get('/api/document-blocks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/document-blocks/:id', () => {
    it('should update a document block', async () => {
      const response = await request(app)
        .put(`/api/document-blocks/${testBlockId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Introduction Block',
          tags: ['introduction', 'updated'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Introduction Block');
      expect(response.body.data.tags).toContain('updated');
    });

    it('should not allow updating system blocks', async () => {
      const response = await request(app)
        .put(`/api/document-blocks/${systemBlockId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Attempted System Block Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('System blocks cannot be modified');
    });
  });

  describe('POST /api/document-blocks/:id/duplicate', () => {
    it('should duplicate a document block', async () => {
      const response = await request(app)
        .post(`/api/document-blocks/${testBlockId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toContain('(copie)');
      expect(response.body.data.isSystemBlock).toBe(false);
    });

    it('should allow duplicating system blocks', async () => {
      const response = await request(app)
        .post(`/api/document-blocks/${systemBlockId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toContain('(copie)');
      expect(response.body.data.isSystemBlock).toBe(false);
    });
  });

  describe('GET /api/document-blocks/categories', () => {
    it('should return categories with counts', async () => {
      const response = await request(app)
        .get('/api/document-blocks/categories')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('category');
      expect(response.body.data[0]).toHaveProperty('count');
    });
  });

  describe('GET /api/document-blocks/tags', () => {
    it('should return tags with counts', async () => {
      const response = await request(app)
        .get('/api/document-blocks/tags')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('tag');
      expect(response.body.data[0]).toHaveProperty('count');
    });
  });

  describe('POST /api/document-blocks/extract-variables', () => {
    it('should extract variables from content', async () => {
      const response = await request(app)
        .post('/api/document-blocks/extract-variables')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Le {{date_audience}}, {{client_name}} se présente devant le {{juridiction}}.',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.variables).toContainEqual(expect.objectContaining({ name: 'date_audience' }));
      expect(response.body.data.variables).toContainEqual(expect.objectContaining({ name: 'client_name' }));
      expect(response.body.data.variables).toContainEqual(expect.objectContaining({ name: 'juridiction' }));
      expect(response.body.data.validation.valid).toBe(true);
    });

    it('should detect invalid syntax', async () => {
      const response = await request(app)
        .post('/api/document-blocks/extract-variables')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: '{{#each items}} item {{/if}}',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.validation.valid).toBe(false);
      expect(response.body.data.validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/document-blocks/:id', () => {
    it('should not allow deleting system blocks', async () => {
      const response = await request(app)
        .delete(`/api/document-blocks/${systemBlockId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
    });

    it('should soft delete a document block', async () => {
      const response = await request(app)
        .delete(`/api/document-blocks/${testBlockId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify block is not returned in list
      const listResponse = await request(app)
        .get('/api/document-blocks')
        .set('Authorization', `Bearer ${accessToken}`);

      const deletedBlock = listResponse.body.data.find((b: any) => b.id === testBlockId);
      expect(deletedBlock).toBeUndefined();
    });
  });
});

describe('DocumentBlocksService', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { documentBlocksService } = require('./document-blocks.service');

  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const content = '{{name}} is {{age}} years old';
      const variables = documentBlocksService.extractVariables(content);

      expect(variables).toContainEqual(expect.objectContaining({ name: 'name' }));
      expect(variables).toContainEqual(expect.objectContaining({ name: 'age' }));
    });

    it('should extract variables from block helpers', () => {
      const content = '{{#if hasItems}}{{#each items}}{{this.name}}{{/each}}{{/if}}';
      const variables = documentBlocksService.extractVariables(content);

      expect(variables).toContainEqual(expect.objectContaining({ name: 'hasItems' }));
      expect(variables).toContainEqual(expect.objectContaining({ name: 'items', type: 'array' }));
    });

    it('should infer date type', () => {
      const content = 'Event on {{event_date}} at {{created_at}}';
      const variables = documentBlocksService.extractVariables(content);

      expect(variables.find((v: any) => v.name === 'event_date')?.type).toBe('date');
      expect(variables.find((v: any) => v.name === 'created_at')?.type).toBe('date');
    });

    it('should infer number type for amounts', () => {
      const content = 'Total: {{montant_total}} euros, Count: {{nombre_articles}}';
      const variables = documentBlocksService.extractVariables(content);

      expect(variables.find((v: any) => v.name === 'montant_total')?.type).toBe('number');
      expect(variables.find((v: any) => v.name === 'nombre_articles')?.type).toBe('number');
    });

    it('should infer boolean type', () => {
      const content = '{{#if isActive}}Active{{/if}} {{#if hasPermission}}Allowed{{/if}}';
      const variables = documentBlocksService.extractVariables(content);

      expect(variables.find((v: any) => v.name === 'isActive')?.type).toBe('boolean');
      expect(variables.find((v: any) => v.name === 'hasPermission')?.type).toBe('boolean');
    });
  });

  describe('validateHandlebarsSyntax', () => {
    it('should validate correct syntax', () => {
      const content = '{{name}} {{#if condition}}yes{{else}}no{{/if}}';
      const result = documentBlocksService.validateHandlebarsSyntax(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unbalanced braces', () => {
      const content = '{{name} is missing a brace';
      const result = documentBlocksService.validateHandlebarsSyntax(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Unbalanced'))).toBe(true);
    });

    it('should detect unclosed block helpers', () => {
      const content = '{{#if condition}}content without closing';
      const result = documentBlocksService.validateHandlebarsSyntax(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Unclosed'))).toBe(true);
    });

    it('should detect empty variable placeholders', () => {
      const content = 'Hello {{  }} world';
      const result = documentBlocksService.validateHandlebarsSyntax(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Empty variable'))).toBe(true);
    });
  });

  describe('suggestTags', () => {
    it('should suggest category-based tags', () => {
      const tags = documentBlocksService.suggestTags('Introduction', 'content', 'INTRO');
      expect(tags).toContain('intro');
    });

    it('should suggest legal document type tags', () => {
      const tags = documentBlocksService.suggestTags(
        'Assignation en référé',
        'Par ces motifs, il est demandé au tribunal',
        'DISPOSITIF'
      );
      expect(tags).toContain('assignation');
      expect(tags).toContain('refere');
    });

    it('should suggest jurisdiction tags', () => {
      const tags = documentBlocksService.suggestTags(
        'Conclusions',
        'Devant le tribunal de commerce de Paris',
        'MOYENS'
      );
      expect(tags).toContain('tribunal_commerce');
    });
  });
});
