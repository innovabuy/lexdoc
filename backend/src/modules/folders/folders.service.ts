import { prisma } from '@/config/database';
import { Prisma, FolderType } from '@prisma/client';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { auditLogService } from '@/modules/audit/audit.service';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  ListFoldersInput,
  GetFolderTreeInput,
  UpdateFolderMetadataInput,
} from './folders.schemas';

interface FolderWithStats {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  cabinetId: string;
  folderType: FolderType;
  clientId: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    documents: number;
    children: number;
  };
  client?: {
    id: string;
    nom: string;
    prenom: string | null;
    denomination: string | null;
    type: string;
  } | null;
}

interface FolderTreeNode {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  documentCount: number;
  children: FolderTreeNode[];
}

class FoldersService {
  /**
   * Create a new folder
   */
  async createFolder(
    cabinetId: string,
    userId: string,
    input: CreateFolderInput
  ) {
    // Verify parent folder exists and belongs to cabinet
    if (input.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: input.parentId,
          cabinetId,
          deletedAt: null,
        },
      });

      if (!parentFolder) {
        throw new NotFoundError('Parent folder not found');
      }
    }

    // Verify client exists if provided
    if (input.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: input.clientId, cabinetId, deletedAt: null },
      });
      if (!client) {
        throw new NotFoundError('Client not found');
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: input.name,
        description: input.description,
        color: input.color || '#3B82F6',
        parentId: input.parentId,
        folderType: input.folderType || FolderType.AFFAIRE_GENERALE,
        clientId: input.clientId,
        metadata: input.metadata || {},
        cabinetId,
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            denomination: true,
            type: true,
          },
        },
      },
    });

    // Log folder creation
    await auditLogService.log({
      action: 'FOLDER_CREATED',
      entity: 'Folder',
      entityId: folder.id,
      userId,
      cabinetId,
      details: { name: folder.name, parentId: folder.parentId },
    });

    return this.formatFolder(folder as FolderWithStats);
  }

  /**
   * Get folder by ID
   */
  async getFolder(folderId: string, cabinetId: string) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        cabinetId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            denomination: true,
            type: true,
            email: true,
            telephone: true,
            adresse: true,
            codePostal: true,
            ville: true,
            siret: true,
            rcs: true,
            formeJuridique: true,
            capital: true,
            representant: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    return this.formatFolder(folder as FolderWithStats);
  }

  /**
   * Get folder with full data for auto-fill (includes client, metadata, avocat info)
   */
  async getFolderForAutoFill(folderId: string, cabinetId: string, userId: string) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        cabinetId,
        deletedAt: null,
      },
      include: {
        client: true,
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Get avocat legal info for the current user
    const avocatInfo = await prisma.avocatLegalInfo.findFirst({
      where: { userId, cabinetId },
    });

    return {
      folder: {
        id: folder.id,
        name: folder.name,
        folderType: folder.folderType,
        metadata: folder.metadata,
      },
      client: folder.client,
      avocatInfo,
    };
  }

  /**
   * Update folder metadata only
   */
  async updateMetadata(
    folderId: string,
    cabinetId: string,
    userId: string,
    input: UpdateFolderMetadataInput
  ) {
    const existing = await prisma.folder.findFirst({
      where: { id: folderId, cabinetId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Folder not found');
    }

    // Merge existing metadata with new metadata
    const currentMetadata = (existing.metadata as object) || {};
    const newMetadata = { ...currentMetadata, ...input.metadata };

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data: { metadata: newMetadata },
      include: {
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            denomination: true,
            type: true,
          },
        },
      },
    });

    await auditLogService.log({
      action: 'FOLDER_UPDATED',
      entity: 'Folder',
      entityId: folder.id,
      userId,
      cabinetId,
      details: { metadataUpdated: true },
    });

    return this.formatFolder(folder as FolderWithStats);
  }

  /**
   * List folders with pagination
   */
  async listFolders(cabinetId: string, input: ListFoldersInput) {
    const { parentId, search, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.FolderWhereInput = {
      cabinetId,
      deletedAt: null,
    };

    // Handle parentId - if null explicitly, get root folders
    if (parentId === null || parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [folders, total] = await Promise.all([
      prisma.folder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              documents: true,
              children: true,
            },
          },
          client: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              denomination: true,
              type: true,
            },
          },
        },
      }),
      prisma.folder.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: folders.map((f) => this.formatFolder(f as FolderWithStats)),
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
   * Get folder tree (recursive structure)
   */
  async getFolderTree(
    cabinetId: string,
    input: GetFolderTreeInput,
    parentId: string | null = null
  ): Promise<FolderTreeNode[]> {
    const { depth } = input;

    if (depth <= 0) {
      return [];
    }

    const folders = await prisma.folder.findMany({
      where: {
        cabinetId,
        parentId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    const tree: FolderTreeNode[] = [];

    for (const folder of folders) {
      const children = await this.getFolderTree(
        cabinetId,
        { depth: depth - 1 },
        folder.id
      );

      tree.push({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        color: folder.color,
        parentId: folder.parentId,
        documentCount: folder._count.documents,
        children,
      });
    }

    return tree;
  }

  /**
   * Get breadcrumb path for a folder
   */
  async getBreadcrumb(folderId: string, cabinetId: string) {
    const breadcrumb: Array<{ id: string; name: string }> = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const foundFolder: { id: string; name: string; parentId: string | null } | null =
        await prisma.folder.findFirst({
          where: {
            id: currentId,
            cabinetId,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        });

      if (!foundFolder) {
        break;
      }

      breadcrumb.unshift({ id: foundFolder.id, name: foundFolder.name });
      currentId = foundFolder.parentId;
    }

    return breadcrumb;
  }

  /**
   * Update folder
   */
  async updateFolder(
    folderId: string,
    cabinetId: string,
    userId: string,
    input: UpdateFolderInput
  ) {
    const existing = await prisma.folder.findFirst({
      where: {
        id: folderId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Folder not found');
    }

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data: input,
      include: {
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
    });

    // Log folder update
    await auditLogService.log({
      action: 'FOLDER_UPDATED',
      entity: 'Folder',
      entityId: folder.id,
      userId,
      cabinetId,
      details: { changes: input },
    });

    return this.formatFolder(folder as FolderWithStats);
  }

  /**
   * Move folder to new parent
   */
  async moveFolder(
    folderId: string,
    cabinetId: string,
    userId: string,
    input: MoveFolderInput
  ) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Cannot move folder into itself
    if (input.parentId === folderId) {
      throw new BadRequestError('Cannot move folder into itself');
    }

    // Verify new parent exists and belongs to cabinet
    if (input.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: input.parentId,
          cabinetId,
          deletedAt: null,
        },
      });

      if (!parentFolder) {
        throw new NotFoundError('Parent folder not found');
      }

      // Check for circular reference
      const isDescendant = await this.isDescendant(
        input.parentId,
        folderId,
        cabinetId
      );
      if (isDescendant) {
        throw new BadRequestError('Cannot move folder into its descendant');
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { parentId: input.parentId },
      include: {
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
    });

    // Log folder move
    await auditLogService.log({
      action: 'FOLDER_MOVED',
      entity: 'Folder',
      entityId: folder.id,
      userId,
      cabinetId,
      details: {
        fromParentId: folder.parentId,
        toParentId: input.parentId,
      },
    });

    return this.formatFolder(updatedFolder as FolderWithStats);
  }

  /**
   * Delete folder (soft delete)
   */
  async deleteFolder(folderId: string, cabinetId: string, userId: string) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        cabinetId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Check if folder has documents
    if (folder._count.documents > 0) {
      throw new BadRequestError(
        'Cannot delete folder with documents. Move or delete documents first.'
      );
    }

    // Check if folder has children
    if (folder._count.children > 0) {
      throw new BadRequestError(
        'Cannot delete folder with subfolders. Delete subfolders first.'
      );
    }

    // Soft delete folder
    await prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: new Date() },
    });

    // Log folder deletion
    await auditLogService.log({
      action: 'FOLDER_DELETED',
      entity: 'Folder',
      entityId: folder.id,
      userId,
      cabinetId,
      details: { name: folder.name },
    });
  }

  /**
   * Check if a folder is a descendant of another
   */
  private async isDescendant(
    potentialDescendantId: string,
    ancestorId: string,
    cabinetId: string
  ): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;

    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }

      const foundFolder: { parentId: string | null } | null = await prisma.folder.findFirst({
        where: {
          id: currentId,
          cabinetId,
          deletedAt: null,
        },
        select: { parentId: true },
      });

      currentId = foundFolder?.parentId || null;
    }

    return false;
  }

  /**
   * Format folder for API response
   */
  private formatFolder(folder: FolderWithStats) {
    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      color: folder.color,
      parentId: folder.parentId,
      cabinetId: folder.cabinetId,
      folderType: folder.folderType,
      clientId: folder.clientId,
      metadata: folder.metadata,
      client: folder.client,
      documentCount: folder._count.documents,
      childrenCount: folder._count.children,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }
}

export const foldersService = new FoldersService();
