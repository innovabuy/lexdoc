const { testBuilderBlock, testBuilderTemplate, testTenant } = require('../fixtures');

// Mock Prisma client
jest.mock('../../src/config/database', () => ({
  builderTemplate: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  builderBlock: {
    findMany: jest.fn(),
  },
}));

const prisma = require('../../src/config/database');
const documentGenerator = require('../../src/services/document-generator.service');

describe('DocumentGeneratorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractVariables', () => {
    it('should extract variables from content', () => {
      const content = 'Hello {{name}}, your order {{order.id}} is ready.';
      const variables = documentGenerator.extractVariables(content);

      expect(variables).toContain('name');
      expect(variables).toContain('order');
    });

    it('should handle content without variables', () => {
      const content = 'Hello World!';
      const variables = documentGenerator.extractVariables(content);

      expect(variables).toEqual([]);
    });

    it('should handle nested variables', () => {
      const content = '{{client.address.city}} - {{client.address.postalCode}}';
      const variables = documentGenerator.extractVariables(content);

      expect(variables).toContain('client');
    });

    it('should ignore Handlebars helpers', () => {
      const content = '{{#each items}}{{this.name}}{{/each}}';
      const variables = documentGenerator.extractVariables(content);

      // Should not include helper keywords
      expect(variables).not.toContain('#each');
      expect(variables).not.toContain('/each');
    });

    it('should handle empty content', () => {
      const variables = documentGenerator.extractVariables('');
      expect(variables).toEqual([]);
    });

    it('should handle null content', () => {
      const variables = documentGenerator.extractVariables(null);
      expect(variables).toEqual([]);
    });
  });

  describe('parseVariables', () => {
    it('should replace simple variables', () => {
      const content = 'Hello {{name}}!';
      const variables = { name: 'John' };

      const result = documentGenerator.parseVariables(content, variables);

      expect(result).toBe('Hello John!');
    });

    it('should replace nested variables', () => {
      const content = 'Address: {{address.city}}, {{address.postalCode}}';
      const variables = {
        address: {
          city: 'Paris',
          postalCode: '75001',
        },
      };

      const result = documentGenerator.parseVariables(content, variables);

      expect(result).toBe('Address: Paris, 75001');
    });

    it('should handle missing variables gracefully', () => {
      const content = 'Hello {{name}}, balance: {{balance}}';
      const variables = { name: 'John' };

      const result = documentGenerator.parseVariables(content, variables);

      expect(result).toContain('John');
      // Missing variables should become empty
      expect(result).not.toContain('{{balance}}');
    });

    it('should handle Handlebars each helper', () => {
      const content = '{{#each items}}Item: {{this.name}}\n{{/each}}';
      const variables = {
        items: [{ name: 'Item 1' }, { name: 'Item 2' }],
      };

      const result = documentGenerator.parseVariables(content, variables);

      expect(result).toContain('Item: Item 1');
      expect(result).toContain('Item: Item 2');
    });

    it('should return empty string for null content', () => {
      const result = documentGenerator.parseVariables(null, {});
      expect(result).toBe('');
    });

    it('should return content with placeholders if no variables provided', () => {
      const content = 'Hello {{name}}!';
      const result = documentGenerator.parseVariables(content, null);
      // When no variables provided, Handlebars keeps the template as-is
      expect(result).toBe('Hello {{name}}!');
    });
  });

  describe('validateRequiredVariables', () => {
    it('should return valid for all required variables provided', () => {
      const template = { requiredVariables: ['name', 'email'] };
      const variables = { name: 'John', email: 'john@test.com' };

      const result = documentGenerator.validateRequiredVariables(template, variables);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should return invalid for missing required variables', () => {
      const template = { requiredVariables: ['name', 'email', 'phone'] };
      const variables = { name: 'John' };

      const result = documentGenerator.validateRequiredVariables(template, variables);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('email');
      expect(result.missing).toContain('phone');
    });

    it('should treat empty strings as missing', () => {
      const template = { requiredVariables: ['name'] };
      const variables = { name: '' };

      const result = documentGenerator.validateRequiredVariables(template, variables);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('name');
    });

    it('should handle template without requiredVariables', () => {
      const template = {};
      const variables = { name: 'John' };

      const result = documentGenerator.validateRequiredVariables(template, variables);

      expect(result.valid).toBe(true);
    });
  });

  describe('getTemplateVariables', () => {
    it('should return all variables from template blocks', async () => {
      const mockTemplate = {
        ...testBuilderTemplate,
        blocksStructure: [
          { blockId: 'block-1', order: 1 },
          { blockId: 'block-2', order: 2 },
        ],
        requiredVariables: ['juridiction'],
      };

      const mockBlocks = [
        {
          id: 'block-1',
          content: 'Client: {{client.nom}}',
        },
        {
          id: 'block-2',
          content: 'Adversaire: {{adversaire.nom}}',
        },
      ];

      prisma.builderTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.builderBlock.findMany.mockResolvedValue(mockBlocks);

      const result = await documentGenerator.getTemplateVariables(
        testBuilderTemplate.id,
        testTenant.id
      );

      expect(result.allVariables).toContain('client');
      expect(result.allVariables).toContain('adversaire');
      expect(result.requiredVariables).toContain('juridiction');
    });

    it('should throw error for non-existent template', async () => {
      prisma.builderTemplate.findFirst.mockResolvedValue(null);

      await expect(
        documentGenerator.getTemplateVariables('non-existent-id', testTenant.id)
      ).rejects.toThrow('Template not found');
    });
  });

  describe('previewDocument', () => {
    it('should generate preview without incrementing usage count', async () => {
      const mockTemplate = {
        ...testBuilderTemplate,
        blocksStructure: [{ blockId: testBuilderBlock.id, order: 1 }],
      };

      const mockBlocks = [testBuilderBlock];

      prisma.builderTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.builderBlock.findMany.mockResolvedValue(mockBlocks);

      const variables = {
        juridiction: 'Tribunal de Commerce de Paris',
        client: { nom: 'Test Client' },
        adversaire: { nom: 'Test Adversaire' },
      };

      const result = await documentGenerator.previewDocument(
        testBuilderTemplate.id,
        variables,
        testTenant.id
      );

      expect(result).toHaveProperty('content');
      expect(result.content).toContain('Tribunal de Commerce de Paris');
      expect(result.content).toContain('Test Client');
      expect(result.isPreview).toBe(true);

      // Should not have called update for usage count
      expect(prisma.builderTemplate.update).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent template', async () => {
      prisma.builderTemplate.findFirst.mockResolvedValue(null);

      await expect(
        documentGenerator.previewDocument('non-existent-id', {}, testTenant.id)
      ).rejects.toThrow('Template not found');
    });
  });

  describe('generateDocument', () => {
    it('should generate document and increment usage count', async () => {
      const mockTemplate = {
        ...testBuilderTemplate,
        blocksStructure: [{ blockId: testBuilderBlock.id, order: 1 }],
        requiredVariables: [],
      };

      const mockBlocks = [testBuilderBlock];

      prisma.builderTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.builderBlock.findMany.mockResolvedValue(mockBlocks);
      prisma.builderTemplate.update.mockResolvedValue({ ...mockTemplate, usageCount: 1 });

      const variables = {
        juridiction: 'Tribunal de Commerce de Paris',
        client: { nom: 'Test Client' },
        adversaire: { nom: 'Test Adversaire' },
      };

      const result = await documentGenerator.generateDocument(
        testBuilderTemplate.id,
        variables,
        testTenant.id
      );

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('templateName', testBuilderTemplate.name);

      // Should have incremented usage count
      expect(prisma.builderTemplate.update).toHaveBeenCalledWith({
        where: { id: testBuilderTemplate.id },
        data: { usageCount: { increment: 1 } },
      });
    });

    it('should throw error for missing required variables', async () => {
      const mockTemplate = {
        ...testBuilderTemplate,
        requiredVariables: ['missingVar'],
      };

      prisma.builderTemplate.findFirst.mockResolvedValue(mockTemplate);

      await expect(
        documentGenerator.generateDocument(testBuilderTemplate.id, {}, testTenant.id)
      ).rejects.toThrow('Missing required variables');
    });
  });
});
