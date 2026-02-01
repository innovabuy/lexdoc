import { prisma } from '@/config/database';
import { BlockCategory, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import type {
  CreateDocumentBlockInput,
  UpdateDocumentBlockInput,
  DocumentBlockQuery,
} from './document-blocks.schemas';

type VariableType = 'string' | 'number' | 'date' | 'boolean' | 'text' | 'array';

interface Variable {
  name: string;
  type: VariableType;
  required: boolean;
  description?: string;
}

export class DocumentBlocksService {
  /**
   * Extract variables from Handlebars template content
   */
  extractVariables(content: string): Variable[] {
    const variables: Variable[] = [];
    const seen = new Set<string>();

    // Match {{variable}} and {{#if variable}} and {{#each variable}}
    const patterns = [
      /\{\{(?!#|\/|else)([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, // Simple variables
      /\{\{#(?:if|unless|each)\s+([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, // Block helpers
      /\{\{this\.([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, // this.property in each loops
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const varName = match[1];
        if (!seen.has(varName)) {
          seen.add(varName);
          const variable: Variable = {
            name: varName,
            type: this.inferVariableType(varName, content),
            required: false,
          };
          variables.push(variable);
        }
      }
    }

    return variables.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Infer variable type from name and context
   */
  private inferVariableType(name: string, content: string): VariableType {
    const lowerName = name.toLowerCase();

    // Date patterns
    if (lowerName.includes('date') || lowerName.includes('_at') || lowerName.endsWith('At')) {
      return 'date';
    }

    // Number patterns
    if (
      lowerName.includes('montant') ||
      lowerName.includes('prix') ||
      lowerName.includes('cout') ||
      lowerName.includes('count') ||
      lowerName.includes('nombre') ||
      lowerName.includes('numero') ||
      lowerName.includes('order')
    ) {
      return 'number';
    }

    // Boolean patterns
    if (
      lowerName.startsWith('is') ||
      lowerName.startsWith('has') ||
      lowerName.includes('enabled') ||
      lowerName.includes('active')
    ) {
      return 'boolean';
    }

    // Array patterns (used in #each)
    const eachPattern = new RegExp(`\\{\\{#each\\s+${name}\\}\\}`, 'i');
    if (eachPattern.test(content)) {
      return 'array';
    }

    // Text for long content fields
    if (
      lowerName.includes('description') ||
      lowerName.includes('content') ||
      lowerName.includes('texte') ||
      lowerName.includes('detail') ||
      lowerName.includes('commentaire') ||
      lowerName.includes('adresse')
    ) {
      return 'text';
    }

    return 'string';
  }

  /**
   * Validate Handlebars syntax
   */
  validateHandlebarsSyntax(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for balanced braces
    const openBraces = (content.match(/\{\{/g) || []).length;
    const closeBraces = (content.match(/\}\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for unclosed block helpers
    const blockHelpers = ['if', 'unless', 'each', 'with'];
    for (const helper of blockHelpers) {
      const openPattern = new RegExp(`\\{\\{#${helper}`, 'g');
      const closePattern = new RegExp(`\\{\\{/${helper}`, 'g');
      const opens = (content.match(openPattern) || []).length;
      const closes = (content.match(closePattern) || []).length;
      if (opens !== closes) {
        errors.push(`Unclosed {{#${helper}}} block: ${opens} opens, ${closes} closes`);
      }
    }

    // Check for empty variable names
    if (/\{\{\s*\}\}/.test(content)) {
      errors.push('Empty variable placeholder found: {{}}');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Suggest tags based on title and content
   */
  suggestTags(title: string, content: string, category: BlockCategory): string[] {
    const suggestions: string[] = [];
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    const combined = `${lowerTitle} ${lowerContent}`;

    // Category-based tags
    suggestions.push(category.toLowerCase());

    // Legal document types
    const legalTerms: Record<string, string[]> = {
      assignation: ['assignation', 'procédure', 'judiciaire'],
      conclusions: ['conclusions', 'procédure'],
      référé: ['refere', 'urgence', 'provision'],
      'mise en demeure': ['mise_en_demeure', 'courrier', 'recouvrement'],
      contrat: ['contrat', 'commercial'],
      bail: ['bail', 'locatif', 'immobilier'],
      licenciement: ['travail', 'licenciement', 'prudhommes'],
      tribunal: ['judiciaire', 'contentieux'],
      condamnation: ['dispositif', 'condamnation'],
      expulsion: ['expulsion', 'locatif'],
      signature: ['signature', 'formalites'],
    };

    for (const [term, tags] of Object.entries(legalTerms)) {
      if (combined.includes(term)) {
        suggestions.push(...tags);
      }
    }

    // Jurisdiction tags
    const jurisdictions = [
      'tribunal_judiciaire',
      'tribunal_commerce',
      'cour_appel',
      'prudhommes',
      'conseil_etat',
    ];
    for (const juris of jurisdictions) {
      if (combined.includes(juris.replace('_', ' '))) {
        suggestions.push(juris);
      }
    }

    // Deduplicate and return
    return [...new Set(suggestions)];
  }

  /**
   * List document blocks with filters
   */
  async list(cabinetId: string, query: DocumentBlockQuery) {
    const { category, tags, search, isSystemBlock, page, limit, sortBy, sortOrder } = query;

    const where: Prisma.DocumentBlockWhereInput = {
      deletedAt: null,
      OR: [{ cabinetId }, { isSystemBlock: true }],
    };

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (typeof isSystemBlock === 'boolean') {
      where.isSystemBlock = isSystemBlock;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: [search.toLowerCase()] } },
          ],
        },
      ];
    }

    const [blocks, total] = await Promise.all([
      prisma.documentBlock.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.documentBlock.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: blocks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get a single document block by ID
   */
  async getById(id: string, cabinetId: string) {
    const block = await prisma.documentBlock.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemBlock: true }],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundError('Document block not found');
    }

    return block;
  }

  /**
   * Create a new document block
   */
  async create(cabinetId: string, userId: string, data: CreateDocumentBlockInput) {
    // Validate Handlebars syntax
    const validation = this.validateHandlebarsSyntax(data.content);
    if (!validation.valid) {
      throw new BadRequestError(`Invalid template syntax: ${validation.errors.join(', ')}`);
    }

    // Extract variables if not provided
    let variables = data.variables;
    if (!variables || variables.length === 0) {
      variables = this.extractVariables(data.content);
    }

    // Suggest tags if not provided
    let tags = data.tags;
    if (!tags || tags.length === 0) {
      tags = this.suggestTags(data.title, data.content, data.category);
    }

    const block = await prisma.documentBlock.create({
      data: {
        cabinetId,
        createdById: userId,
        title: data.title,
        category: data.category,
        content: data.content,
        variables: variables as Prisma.InputJsonValue,
        tags,
        isMandatory: data.isMandatory,
        displayOrder: data.displayOrder,
        isSystemBlock: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return block;
  }

  /**
   * Update a document block
   */
  async update(id: string, cabinetId: string, userId: string, data: UpdateDocumentBlockInput) {
    // Check block exists and is editable
    const existing = await prisma.documentBlock.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Document block not found');
    }

    if (existing.isSystemBlock) {
      throw new ForbiddenError('System blocks cannot be modified');
    }

    if (existing.cabinetId !== cabinetId) {
      throw new ForbiddenError('You can only modify blocks from your own cabinet');
    }

    // Validate Handlebars syntax if content changed
    if (data.content) {
      const validation = this.validateHandlebarsSyntax(data.content);
      if (!validation.valid) {
        throw new BadRequestError(`Invalid template syntax: ${validation.errors.join(', ')}`);
      }
    }

    // Extract variables if content changed and variables not provided
    let variables = data.variables;
    if (data.content && !variables) {
      variables = this.extractVariables(data.content);
    }

    // Determine if this is a major update (content changed)
    const isMajorUpdate = data.content && data.content !== existing.content;

    const block = await prisma.documentBlock.update({
      where: { id },
      data: {
        ...data,
        variables: variables ? (variables as Prisma.InputJsonValue) : undefined,
        usageCount: isMajorUpdate ? { increment: 1 } : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return block;
  }

  /**
   * Soft delete a document block
   */
  async delete(id: string, cabinetId: string) {
    // Check block exists and is deletable
    const existing = await prisma.documentBlock.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Document block not found');
    }

    if (existing.isSystemBlock) {
      throw new ForbiddenError('System blocks cannot be deleted');
    }

    if (existing.cabinetId !== cabinetId) {
      throw new ForbiddenError('You can only delete blocks from your own cabinet');
    }

    // Check if block is used in any active templates
    const templatesUsingBlock = await prisma.builderTemplate.findMany({
      where: {
        cabinetId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        blocksStructure: true,
      },
    });

    const usedInTemplates = templatesUsingBlock.filter((template) => {
      const structure = template.blocksStructure as Array<{ blockId: string }>;
      return structure.some((s) => s.blockId === id);
    });

    if (usedInTemplates.length > 0) {
      const templateNames = usedInTemplates.map((t) => t.name).join(', ');
      throw new BadRequestError(
        `Cannot delete block: it is used in the following templates: ${templateNames}`
      );
    }

    // Soft delete
    await prisma.documentBlock.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Duplicate a block (typically a system block) for customization
   */
  async duplicate(id: string, cabinetId: string, userId: string) {
    const original = await prisma.documentBlock.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemBlock: true }],
      },
    });

    if (!original) {
      throw new NotFoundError('Document block not found');
    }

    const duplicate = await prisma.documentBlock.create({
      data: {
        cabinetId,
        createdById: userId,
        title: `${original.title} (copie)`,
        category: original.category,
        content: original.content,
        variables: original.variables as Prisma.InputJsonValue,
        tags: original.tags,
        isMandatory: original.isMandatory,
        displayOrder: original.displayOrder,
        isSystemBlock: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return duplicate;
  }

  /**
   * Get all available categories with counts
   */
  async getCategories(cabinetId: string) {
    const categories = await prisma.documentBlock.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemBlock: true }],
      },
      _count: {
        category: true,
      },
    });

    return categories.map((c) => ({
      category: c.category,
      count: c._count.category,
    }));
  }

  /**
   * Get all available tags with counts
   */
  async getTags(cabinetId: string) {
    const blocks = await prisma.documentBlock.findMany({
      where: {
        deletedAt: null,
        OR: [{ cabinetId }, { isSystemBlock: true }],
      },
      select: {
        tags: true,
      },
    });

    const tagCounts: Record<string, number> = {};
    for (const block of blocks) {
      for (const tag of block.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export const documentBlocksService = new DocumentBlocksService();
