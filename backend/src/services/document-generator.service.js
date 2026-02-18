const handlebars = require('handlebars');
const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// ── Handlebars helpers ──
const MOIS_FR = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

handlebars.registerHelper('formatDate', function (date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return date;
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
});

handlebars.registerHelper('formatMoney', function (amount) {
  if (amount == null || amount === '') return '';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.,-]/g, '').replace(',', '.')) : amount;
  if (isNaN(num)) return amount;
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
});

handlebars.registerHelper('uppercase', function (str) {
  return typeof str === 'string' ? str.toUpperCase() : '';
});

handlebars.registerHelper('lowercase', function (str) {
  return typeof str === 'string' ? str.toLowerCase() : '';
});

class DocumentGeneratorService {
  /**
   * Parse and replace Handlebars variables in content
   * @param {string} content - Content with {{variable}} placeholders
   * @param {Object} variables - Key-value pairs for variable replacement
   * @returns {string} - Content with variables replaced
   */
  parseVariables(content, variables) {
    if (!content) return '';
    if (!variables || typeof variables !== 'object') return content;

    try {
      const template = handlebars.compile(content, { strict: false });
      return template(variables);
    } catch (error) {
      throw new BadRequestError(`Variable parsing error: ${error.message}`);
    }
  }

  /**
   * Extract variable names from content
   * @param {string} content - Content with {{variable}} placeholders
   * @returns {string[]} - Array of variable names found
   */
  extractVariables(content) {
    if (!content) return [];
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Clean up the variable name (remove helpers like #if, #each, etc.)
      const varName = match[1].trim();
      if (!varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('else')) {
        // Handle dot notation (e.g., client.name) - get the root variable
        const rootVar = varName.split('.')[0].split(' ')[0];
        variables.add(rootVar);
      }
    }

    return Array.from(variables);
  }

  /**
   * Extract variable names from content, keeping full dot-notation paths
   * e.g. "{{cabinet.nom}}" → "cabinet.nom" (not just "cabinet")
   * @param {string} content - Content with {{variable}} placeholders
   * @returns {string[]} - Array of full variable paths found
   */
  extractVariablesFull(content) {
    if (!content) return [];
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
      const varName = match[1].trim();
      if (!varName.startsWith('#') && !varName.startsWith('/') && varName !== 'else') {
        const cleanName = varName.split(' ')[0];
        if (!cleanName.startsWith('@') && cleanName !== 'this') {
          variables.add(cleanName);
        }
      }
    }
    return Array.from(variables);
  }

  /**
   * Validate that all required variables are provided
   * @param {Object} template - Template object with requiredVariables
   * @param {Object} variables - Provided variables
   * @returns {{ valid: boolean, missing: string[] }}
   */
  validateRequiredVariables(template, variables) {
    const requiredVariables = template.requiredVariables || [];
    const providedKeys = Object.keys(variables || {});

    const missing = requiredVariables.filter(
      (varName) => !providedKeys.includes(varName) ||
                   variables[varName] === null ||
                   variables[varName] === undefined ||
                   variables[varName] === ''
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Fetch blocks by their IDs from the database
   * @param {string[]} blockIds - Array of block IDs
   * @param {string} tenantId - Tenant ID for access control
   * @returns {Promise<Object>} - Map of blockId to block object
   */
  async fetchBlocks(blockIds, tenantId) {
    if (!blockIds || blockIds.length === 0) return {};

    const blocks = await prisma.builderBlock.findMany({
      where: {
        id: { in: blockIds },
        OR: [{ tenantId }, { isSystem: true }],
      },
    });

    // Create a map for quick lookup
    const blockMap = {};
    blocks.forEach((block) => {
      blockMap[block.id] = block;
    });

    return blockMap;
  }

  /**
   * Generate document content from a template and variables
   * @param {string} templateId - Template ID
   * @param {Object} variables - Variables to replace in the document
   * @param {string} tenantId - Tenant ID for access control
   * @returns {Promise<Object>} - Generated document content and metadata
   */
  async generateDocument(templateId, variables, tenantId) {
    // Fetch the template
    const template = await prisma.builderTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ tenantId }, { isSystem: true }],
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Validate required variables
    const validation = this.validateRequiredVariables(template, variables);
    if (!validation.valid) {
      throw new BadRequestError(
        `Missing required variables: ${validation.missing.join(', ')}`
      );
    }

    // Get block IDs from the template structure
    const blocksStructure = template.blocksStructure || [];
    const blockIds = blocksStructure
      .filter((item) => item.blockId)
      .map((item) => item.blockId);

    // Fetch all blocks
    const blockMap = await this.fetchBlocks(blockIds, tenantId);

    // Build the document content
    const contentParts = [];
    const missingBlocks = [];

    for (const structureItem of blocksStructure) {
      if (structureItem.blockId) {
        const block = blockMap[structureItem.blockId];
        if (block) {
          // Parse variables in block content
          const parsedContent = this.parseVariables(block.content, variables);
          contentParts.push({
            type: 'block',
            blockId: block.id,
            title: block.title,
            category: block.category,
            content: parsedContent,
            isMandatory: block.isMandatory,
          });
        } else {
          missingBlocks.push(structureItem.blockId);
        }
      } else if (structureItem.customContent) {
        // Handle custom/inline content in the structure
        const parsedContent = this.parseVariables(structureItem.customContent, variables);
        contentParts.push({
          type: 'custom',
          content: parsedContent,
        });
      }
    }

    // Combine all content into a single document
    const fullContent = contentParts
      .map((part) => part.content)
      .join('\n\n');

    // Parse any legal mentions if present
    let parsedLegalMentions = null;
    if (template.legalMentions) {
      try {
        parsedLegalMentions = this.parseVariables(
          JSON.stringify(template.legalMentions),
          variables
        );
        parsedLegalMentions = JSON.parse(parsedLegalMentions);
      } catch {
        parsedLegalMentions = template.legalMentions;
      }
    }

    // Increment usage count
    await prisma.builderTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return {
      templateId: template.id,
      templateName: template.name,
      documentType: template.documentType,
      outputFormat: template.outputFormat,
      content: fullContent,
      contentParts,
      legalMentions: parsedLegalMentions,
      variables: variables,
      generatedAt: new Date().toISOString(),
      warnings: missingBlocks.length > 0
        ? { missingBlocks }
        : undefined,
    };
  }

  /**
   * Preview document generation without incrementing usage
   * @param {string} templateId - Template ID
   * @param {Object} variables - Variables to replace
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} - Preview of generated content
   */
  async previewDocument(templateId, variables, tenantId) {
    const template = await prisma.builderTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ tenantId }, { isSystem: true }],
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Get block IDs from the template structure
    const blocksStructure = template.blocksStructure || [];
    const blockIds = blocksStructure
      .filter((item) => item.blockId)
      .map((item) => item.blockId);

    // Fetch all blocks
    const blockMap = await this.fetchBlocks(blockIds, tenantId);

    // Build preview content
    const contentParts = [];

    for (const structureItem of blocksStructure) {
      if (structureItem.blockId) {
        const block = blockMap[structureItem.blockId];
        if (block) {
          const parsedContent = this.parseVariables(block.content, variables || {});
          contentParts.push({
            type: 'block',
            blockId: block.id,
            title: block.title,
            category: block.category,
            content: parsedContent,
          });
        }
      } else if (structureItem.customContent) {
        const parsedContent = this.parseVariables(structureItem.customContent, variables || {});
        contentParts.push({
          type: 'custom',
          content: parsedContent,
        });
      }
    }

    const fullContent = contentParts
      .map((part) => part.content)
      .join('\n\n');

    return {
      templateId: template.id,
      templateName: template.name,
      content: fullContent,
      contentParts,
      isPreview: true,
    };
  }

  /**
   * Get all variables used in a template (from blocks and requiredVariables)
   * @param {string} templateId - Template ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} - Variables info
   */
  async getTemplateVariables(templateId, tenantId) {
    const template = await prisma.builderTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ tenantId }, { isSystem: true }],
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Get block IDs
    const blocksStructure = template.blocksStructure || [];
    const blockIds = blocksStructure
      .filter((item) => item.blockId)
      .map((item) => item.blockId);

    // Fetch blocks
    const blockMap = await this.fetchBlocks(blockIds, tenantId);

    // Extract variables from all blocks
    const allVariables = new Set();

    for (const block of Object.values(blockMap)) {
      const vars = this.extractVariables(block.content);
      vars.forEach((v) => allVariables.add(v));

      // Also add variables defined in block's variables field
      if (block.variables && Array.isArray(block.variables)) {
        block.variables.forEach((v) => {
          if (typeof v === 'string') allVariables.add(v);
          else if (v.name) allVariables.add(v.name);
        });
      }
    }

    // Extract from custom content
    for (const item of blocksStructure) {
      if (item.customContent) {
        const vars = this.extractVariables(item.customContent);
        vars.forEach((v) => allVariables.add(v));
      }
    }

    const requiredVariables = template.requiredVariables || [];

    return {
      templateId: template.id,
      templateName: template.name,
      requiredVariables,
      allVariables: Array.from(allVariables),
      variablesInBlocks: Array.from(allVariables).filter(
        (v) => !requiredVariables.includes(v)
      ),
    };
  }
}

module.exports = new DocumentGeneratorService();
