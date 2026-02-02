import { prisma } from '@/config/database';
import { BlockCategory } from '@prisma/client';
import { CreateFreeNoteInput, UpdateFreeNoteInput, ConvertToBlockInput } from './free-notes.schemas';

interface ExtractedVariable {
  name: string;
  type: string;
  required: boolean;
}

/**
 * Extract Handlebars variables from content
 */
function extractVariables(content: string): ExtractedVariable[] {
  const variablePattern = /\{\{([^#/][^}]*?)\}\}/g;
  const variables: ExtractedVariable[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    const varName = match[1].trim();
    if (!seen.has(varName) && !varName.startsWith('#') && !varName.startsWith('/')) {
      seen.add(varName);
      variables.push({
        name: varName,
        type: 'string',
        required: true,
      });
    }
  }

  return variables;
}

class FreeNotesService {
  /**
   * Get all free notes for a folder
   */
  async getByFolder(
    folderId: string,
    cabinetId: string,
    filters?: { linkedCategory?: BlockCategory; search?: string }
  ) {
    const where: any = {
      folderId,
      cabinetId,
      category: BlockCategory.NOTE_LIBRE,
      deletedAt: null,
    };

    if (filters?.linkedCategory) {
      where.metadata = {
        path: ['linkedCategory'],
        equals: filters.linkedCategory,
      };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.documentBlock.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
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
  }

  /**
   * Get a single free note by ID
   */
  async getById(noteId: string, cabinetId: string) {
    return prisma.documentBlock.findFirst({
      where: {
        id: noteId,
        cabinetId,
        category: BlockCategory.NOTE_LIBRE,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create a new free note for a folder
   */
  async create(
    folderId: string,
    cabinetId: string,
    userId: string,
    data: CreateFreeNoteInput
  ) {
    // Verify folder exists and belongs to cabinet
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new Error('Dossier non trouvé');
    }

    // Extract variables from content
    const variables = extractVariables(data.content);

    // Create the free note block
    return prisma.documentBlock.create({
      data: {
        cabinetId,
        category: BlockCategory.NOTE_LIBRE,
        title: data.title || 'Note personnalisée',
        content: data.content,
        variables: variables as any,
        tags: ['note_libre', `dossier_${folderId}`],
        isSystemBlock: false,
        isMandatory: false,
        displayOrder: data.position || 0,
        folderId,
        metadata: {
          linkedCategory: data.linkedCategory || null,
          createdInFolder: folder.name,
        },
        createdById: userId,
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
  }

  /**
   * Update a free note
   */
  async update(noteId: string, cabinetId: string, data: UpdateFreeNoteInput) {
    // Verify note exists
    const note = await prisma.documentBlock.findFirst({
      where: {
        id: noteId,
        cabinetId,
        category: BlockCategory.NOTE_LIBRE,
        deletedAt: null,
      },
    });

    if (!note) {
      throw new Error('Note non trouvée');
    }

    // Prepare update data
    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.variables = extractVariables(data.content);
    }

    if (data.position !== undefined) {
      updateData.displayOrder = data.position;
    }

    if (data.linkedCategory !== undefined) {
      const currentMetadata = (note.metadata as any) || {};
      updateData.metadata = {
        ...currentMetadata,
        linkedCategory: data.linkedCategory,
      };
    }

    return prisma.documentBlock.update({
      where: { id: noteId },
      data: updateData,
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
  }

  /**
   * Delete a free note (soft delete)
   */
  async delete(noteId: string, cabinetId: string) {
    const note = await prisma.documentBlock.findFirst({
      where: {
        id: noteId,
        cabinetId,
        category: BlockCategory.NOTE_LIBRE,
        deletedAt: null,
      },
    });

    if (!note) {
      throw new Error('Note non trouvée');
    }

    return prisma.documentBlock.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Convert a free note to a reusable block
   */
  async convertToBlock(
    noteId: string,
    cabinetId: string,
    userId: string,
    data: ConvertToBlockInput
  ) {
    // Get the original note
    const note = await prisma.documentBlock.findFirst({
      where: {
        id: noteId,
        cabinetId,
        category: BlockCategory.NOTE_LIBRE,
        deletedAt: null,
      },
    });

    if (!note) {
      throw new Error('Note non trouvée');
    }

    // Create new reusable block from the note content
    const newBlock = await prisma.documentBlock.create({
      data: {
        cabinetId,
        category: data.category,
        title: data.title,
        content: note.content,
        variables: note.variables as any,
        tags: [...data.tags, 'converti_note_libre'],
        isSystemBlock: false,
        isMandatory: false,
        displayOrder: 0,
        metadata: {
          convertedFrom: noteId,
          originalFolderId: note.folderId,
        },
        createdById: userId,
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

    return newBlock;
  }

  /**
   * Get all free notes for the cabinet (for search/listing)
   */
  async getAllForCabinet(cabinetId: string, search?: string) {
    const where: any = {
      cabinetId,
      category: BlockCategory.NOTE_LIBRE,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.documentBlock.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}

export const freeNotesService = new FreeNotesService();
