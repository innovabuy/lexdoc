import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';
import { generateAccessToken } from '@/utils/jwt';
import {
  UserRole,
  CabinetStatus,
  BlockCategory,
  BuilderDocumentType,
  Civilite,
} from '@prisma/client';

describe('Document Generation API', () => {
  let cabinetId: string;
  let userId: string;
  let accessToken: string;
  let folderId: string;
  let templateId: string;
  let blockId: string;
  let block2Id: string;
  let legalInfoId: string;

  beforeAll(async () => {
    // Create test cabinet
    const cabinet = await prisma.cabinet.create({
      data: {
        name: 'Test Cabinet for Document Generation',
        email: 'test-docgen@cabinet.fr',
        status: CabinetStatus.ACTIVE,
      },
    });
    cabinetId = cabinet.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'docgen-test@test.fr',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'Generator',
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

    // Create test folder
    const folder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        cabinetId: cabinet.id,
      },
    });
    folderId = folder.id;

    // Create legal info for user
    const legalInfo = await prisma.avocatLegalInfo.create({
      data: {
        userId: user.id,
        cabinetId: cabinet.id,
        civilite: Civilite.MAITRE,
        nom: 'Dupont',
        prenom: 'Jean',
        barreau: 'Barreau de Paris',
        numeroToque: 'P0001',
        adresseCabinet: '10 rue de la Justice',
        codePostal: '75001',
        ville: 'Paris',
        telephone: '0612345678',
        email: 'jean.dupont@avocat.fr',
      },
    });
    legalInfoId = legalInfo.id;

    // Create test blocks
    const block1 = await prisma.documentBlock.create({
      data: {
        title: 'Introduction Block',
        category: BlockCategory.INTRO,
        content: `<p>Paris, le {{date_jour}}</p>
<p><strong>Affaire:</strong> {{affaire_nom}}</p>
<p><strong>Client:</strong> {{client_nom}} {{client_prenom}}</p>
<p>Objet: {{objet}}</p>`,
        variables: [
          { name: 'affaire_nom', type: 'string', required: true },
          { name: 'client_nom', type: 'string', required: true },
          { name: 'client_prenom', type: 'string', required: false },
          { name: 'objet', type: 'string', required: true },
        ],
        tags: ['introduction'],
        isSystemBlock: false,
        cabinetId: cabinet.id,
        createdById: user.id,
      },
    });
    blockId = block1.id;

    const block2 = await prisma.documentBlock.create({
      data: {
        title: 'Body Block',
        category: BlockCategory.FAITS,
        content: `<p>{{#if faits}}Les faits sont les suivants:</p>
<p>{{faits}}</p>{{/if}}
<p>Le montant réclamé est de {{currency montant}} ({{montant_lettres montant}}).</p>`,
        variables: [
          { name: 'faits', type: 'text', required: false },
          { name: 'montant', type: 'number', required: true },
        ],
        tags: ['faits'],
        isSystemBlock: false,
        cabinetId: cabinet.id,
        createdById: user.id,
      },
    });
    block2Id = block2.id;

    // Create test template
    const template = await prisma.builderTemplate.create({
      data: {
        name: 'Test Document Template',
        documentType: BuilderDocumentType.ASSIGNATION_FOND,
        blocksStructure: [
          { blockId: blockId, order: 0, isOptional: false },
          { blockId: block2Id, order: 1, isOptional: false },
        ],
        requiredVariables: [
          { name: 'affaire_nom', type: 'string', required: true },
          { name: 'client_nom', type: 'string', required: true },
          { name: 'objet', type: 'string', required: true },
          { name: 'montant', type: 'number', required: true },
        ],
        legalMentions: {
          footer: '<p>{{avocat.civilite}} {{avocat.prenom}} {{avocat.nom}}</p>',
          confidentiality: true,
        },
        isSystemTemplate: false,
        cabinetId: cabinet.id,
        createdById: user.id,
      },
    });
    templateId = template.id;
  });

  afterAll(async () => {
    // Cleanup in order
    await prisma.generatedDocument.deleteMany({ where: { cabinetId } });
    await prisma.builderTemplate.deleteMany({ where: { cabinetId } });
    await prisma.documentBlock.deleteMany({ where: { cabinetId } });
    await prisma.avocatLegalInfo.deleteMany({ where: { cabinetId } });
    await prisma.folder.deleteMany({ where: { cabinetId } });
    await prisma.user.deleteMany({ where: { cabinetId } });
    await prisma.cabinet.delete({ where: { id: cabinetId } });
  });

  describe('POST /api/document-generation/preview', () => {
    it('should generate HTML preview', async () => {
      const response = await request(app)
        .post('/api/document-generation/preview')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          templateId,
          filledVariables: {
            affaire_nom: 'Dupont c/ Martin',
            client_nom: 'DUPONT',
            client_prenom: 'Pierre',
            objet: 'Demande de dommages et intérêts',
            montant: 5000,
            faits: 'Le défendeur a causé un préjudice...',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.html).toBeDefined();
      expect(response.body.data.html).toContain('Dupont c/ Martin');
      expect(response.body.data.html).toContain('DUPONT');
      expect(response.body.data.html).toContain('Pierre');
      expect(response.body.data.template.id).toBe(templateId);
    });

    it('should return missing variables', async () => {
      const response = await request(app)
        .post('/api/document-generation/preview')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          templateId,
          filledVariables: {
            affaire_nom: 'Test',
            // Missing required variables
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.missingVariables).toBeDefined();
      expect(response.body.data.missingVariables.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/document-generation/preview')
        .send({
          templateId,
          filledVariables: {},
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .post('/api/document-generation/preview')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          templateId: '00000000-0000-0000-0000-000000000000',
          filledVariables: {},
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/document-generation/generate', () => {
    let generatedDocId: string;

    it('should generate DOCX document', async () => {
      const response = await request(app)
        .post('/api/document-generation/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          templateId,
          folderId,
          title: 'Test Generated Document',
          filledVariables: {
            affaire_nom: 'Dupont c/ Martin',
            client_nom: 'DUPONT',
            client_prenom: 'Pierre',
            objet: 'Demande de dommages et intérêts',
            montant: 5000,
          },
          outputFormat: 'DOCX',
          includeLegalMentions: true,
        });

      // May fail due to MinIO not being available in test environment
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.document).toBeDefined();
        expect(response.body.data.document.title).toBe('Test Generated Document');
        expect(response.body.data.downloadUrl).toBeDefined();
        generatedDocId = response.body.data.document.id;
      } else {
        // MinIO not available
        expect(response.status).toBe(500);
      }
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/document-generation/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing templateId and folderId
        });

      expect(response.status).toBe(422);
    });

    it('should return 404 for non-existent folder', async () => {
      const response = await request(app)
        .post('/api/document-generation/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          templateId,
          folderId: '00000000-0000-0000-0000-000000000000',
          filledVariables: {},
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/document-generation/:id/download', () => {
    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .get('/api/document-generation/00000000-0000-0000-0000-000000000000/download')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/document-generation/:id/send-signature', () => {
    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .post('/api/document-generation/00000000-0000-0000-0000-000000000000/send-signature')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          signataires: [
            { email: 'test@test.fr', nom: 'Test', prenom: 'User' },
          ],
        });

      expect(response.status).toBe(404);
    });

    it('should validate signataires', async () => {
      const response = await request(app)
        .post('/api/document-generation/00000000-0000-0000-0000-000000000000/send-signature')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          signataires: [], // Empty array not allowed
        });

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/document-generation/:id/send-lrar', () => {
    it('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .post('/api/document-generation/00000000-0000-0000-0000-000000000000/send-lrar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          destinataire: {
            nom: 'Martin',
            adresse: '15 rue des Lilas',
            codePostal: '75002',
            ville: 'Paris',
          },
        });

      expect(response.status).toBe(404);
    });

    it('should validate postal code format', async () => {
      const response = await request(app)
        .post('/api/document-generation/00000000-0000-0000-0000-000000000000/send-lrar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          destinataire: {
            nom: 'Martin',
            adresse: '15 rue des Lilas',
            codePostal: '123', // Invalid
            ville: 'Paris',
          },
        });

      expect(response.status).toBe(422);
    });
  });
});

describe('Handlebars Engine', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { renderTemplate, validateTemplateSyntax, extractVariables } = require('./engines/handlebars.engine');

  describe('renderTemplate', () => {
    it('should render simple variables', () => {
      const result = renderTemplate('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should render nested variables', () => {
      const result = renderTemplate('{{person.name}} is {{person.age}} years old', {
        person: { name: 'John', age: 30 },
      });
      expect(result).toBe('John is 30 years old');
    });

    it('should handle conditionals', () => {
      const template = '{{#if active}}Active{{else}}Inactive{{/if}}';
      expect(renderTemplate(template, { active: true })).toBe('Active');
      expect(renderTemplate(template, { active: false })).toBe('Inactive');
    });

    it('should handle each loops', () => {
      const template = '{{#each items}}{{this}},{{/each}}';
      expect(renderTemplate(template, { items: ['a', 'b', 'c'] })).toBe('a,b,c,');
    });
  });

  describe('custom helpers', () => {
    it('should format currency', () => {
      const result = renderTemplate('{{currency amount}}', { amount: 1234.56 });
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('should format numbers', () => {
      const result = renderTemplate('{{number_format value 2}}', { value: 1234.5 });
      expect(result).toContain('1');
    });

    it('should add numbers', () => {
      const result = renderTemplate('{{add a b}}', { a: 5, b: 3 });
      expect(result).toBe('8');
    });

    it('should subtract numbers', () => {
      const result = renderTemplate('{{subtract a b}}', { a: 10, b: 3 });
      expect(result).toBe('7');
    });

    it('should convert amount to words', () => {
      const result = renderTemplate('{{montant_lettres amount}}', { amount: 100 });
      expect(result).toContain('cent');
      expect(result).toContain('euro');
    });

    it('should get current date', () => {
      const result = renderTemplate('{{date_jour}}', {});
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should uppercase text', () => {
      const result = renderTemplate('{{uppercase text}}', { text: 'hello' });
      expect(result).toBe('HELLO');
    });

    it('should lowercase text', () => {
      const result = renderTemplate('{{lowercase text}}', { text: 'HELLO' });
      expect(result).toBe('hello');
    });
  });

  describe('validateTemplateSyntax', () => {
    it('should validate correct syntax', () => {
      const result = validateTemplateSyntax('Hello {{name}}!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unbalanced braces', () => {
      const result = validateTemplateSyntax('Hello {{name}!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Unbalanced'))).toBe(true);
    });

    it('should detect unclosed blocks', () => {
      const result = validateTemplateSyntax('{{#if active}}Hello');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Unclosed'))).toBe(true);
    });
  });

  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const vars = extractVariables('{{name}} {{age}}');
      expect(vars).toContain('name');
      expect(vars).toContain('age');
    });

    it('should extract variables from each blocks', () => {
      const vars = extractVariables('{{#each items}}{{this}}{{/each}}');
      expect(vars).toContain('items');
    });

    it('should extract variables from if blocks', () => {
      const vars = extractVariables('{{#if condition}}yes{{/if}}');
      expect(vars).toContain('condition');
    });
  });
});

describe('DocumentGenerationService', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { documentGenerationService } = require('./document-generation.service');

  describe('service methods', () => {
    it('should have generatePreview method', () => {
      expect(typeof documentGenerationService.generatePreview).toBe('function');
    });

    it('should have generateDocument method', () => {
      expect(typeof documentGenerationService.generateDocument).toBe('function');
    });

    it('should have downloadDocument method', () => {
      expect(typeof documentGenerationService.downloadDocument).toBe('function');
    });

    it('should have sendToSignature method', () => {
      expect(typeof documentGenerationService.sendToSignature).toBe('function');
    });

    it('should have sendToLrar method', () => {
      expect(typeof documentGenerationService.sendToLrar).toBe('function');
    });
  });
});
