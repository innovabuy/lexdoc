const prisma = require('../config/database');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePaginationParams, omitSensitiveFields } = require('../utils/helpers');
const logger = require('../config/logger');
const timeline = require('../services/timeline.service');

/**
 * Generate unique folder reference
 */
const generateFolderReference = async (tenantId) => {
  const year = new Date().getFullYear();
  const count = await prisma.folder.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  return `DOS-${year}-${String(count + 1).padStart(4, '0')}`;
};

/**
 * List folders with filters and pagination
 */
const list = async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationParams(req.query);
    const { status, clientId, type, parentId, search, tree } = req.query;

    // If tree=true, return flat list of all folders for building client-side tree
    if (tree === 'true') {
      const folders = await prisma.folder.findMany({
        where: { tenantId: req.tenant.id },
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          reference: true,
          status: true,
          color: true,
          parentId: true,
          _count: { select: { documents: true, children: true } },
        },
      });

      // Transform to match expected format (name field for tree component)
      const transformed = folders.map(f => ({
        ...f,
        name: f.title,
      }));

      return res.json(transformed);
    }

    const where = { tenantId: req.tenant.id };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (type) where.type = type;

    // Handle root folders vs subfolders
    if (parentId === 'null' || parentId === 'root') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    // Search on title and reference
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [folders, total] = await Promise.all([
      prisma.folder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              firstName: true,
              lastName: true,
              type: true,
              email: true,
            },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { documents: true, children: true },
          },
        },
      }),
      prisma.folder.count({ where }),
    ]);

    const sanitized = folders.map(f => ({
      ...omitSensitiveFields(f),
      documentsCount: f._count?.documents || 0,
      subfoldersCount: f._count?.children || 0,
    }));

    return paginatedResponse(res, sanitized, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get folder by ID with documents
 */
const getById = async (req, res, next) => {
  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
      },
      include: {
        client: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, title: true, reference: true } },
        children: {
          select: {
            id: true,
            title: true,
            reference: true,
            status: true,
            color: true,
            _count: { select: { documents: true, children: true } },
          },
          orderBy: { title: 'asc' },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            name: true,
            originalName: true,
            type: true,
            status: true,
            mimeType: true,
            size: true,
            createdAt: true,
            tags: true,
          },
        },
        _count: { select: { documents: true, children: true } },
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_VIEWED',
        entityType: 'Folder',
        entityId: folder.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    return successResponse(res, omitSensitiveFields(folder));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new folder
 */
const create = async (req, res, next) => {
  try {
    const { title, description, type, clientId, parentId, color, status, metadataCession } = req.body;

    if (!title) {
      throw new BadRequestError('Title is required');
    }
    if (!clientId) {
      throw new BadRequestError('Client ID is required');
    }
    if (!type) {
      throw new BadRequestError('Folder type is required');
    }

    // Normalize folder type — accept common aliases
    const VALID_TYPES = ['LITIGATION', 'CONTRACT', 'BUSINESS', 'FAMILY', 'REAL_ESTATE', 'LABOR', 'INTELLECTUAL', 'ADMINISTRATIVE', 'CRIMINAL', 'OTHER'];
    const TYPE_ALIASES = {
      CORPORATE: 'BUSINESS',
      CIVIL: 'LITIGATION',
      COMMERCIAL: 'BUSINESS',
      IMMOBILIER: 'REAL_ESTATE',
      TRAVAIL: 'LABOR',
      PENAL: 'CRIMINAL',
      PROPRIETE_INTELLECTUELLE: 'INTELLECTUAL',
      juridique: 'CONTRACT',
      judiciaire: 'LITIGATION',
    };
    const normalizedType = TYPE_ALIASES[type] || type;
    if (!VALID_TYPES.includes(normalizedType)) {
      throw new BadRequestError(`Invalid folder type "${type}". Valid types: ${VALID_TYPES.join(', ')}`);
    }

    // Verify client exists and belongs to tenant
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: req.tenant.id },
    });
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // If parentId provided, verify it exists
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, tenantId: req.tenant.id },
      });
      if (!parentFolder) {
        throw new NotFoundError('Parent folder not found');
      }
    }

    // Generate unique reference
    const reference = await generateFolderReference(req.tenant.id);

    const folder = await prisma.folder.create({
      data: {
        reference,
        title,
        description: description || null,
        type: normalizedType,
        status: status || 'OPEN',
        color: color || '#3B82F6',
        parentId: parentId || null,
        clientId,
        tenantId: req.tenant.id,
        createdById: req.user.id,
        metadataCession: metadataCession || null,
      },
      include: {
        client: { select: { id: true, companyName: true, firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_CREATED',
        entityType: 'Folder',
        entityId: folder.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: { title, type, clientId },
      },
    });

    // Timeline event
    await timeline.addEvent({
      folderId: folder.id,
      type: 'dossier_cree',
      description: `Dossier "${folder.title}" créé`,
      userId: req.user.id,
    });

    logger.info('Folder created', {
      folderId: folder.id,
      reference: folder.reference,
      userId: req.user.id,
    });

    return successResponse(res, omitSensitiveFields(folder), 'Folder created', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update folder
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type, status, color, parentId, metadataCession, archivedAt, closedAt } = req.body;

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // If changing parent, verify it exists and isn't the folder itself or a child
    if (parentId !== undefined) {
      if (parentId === id) {
        throw new BadRequestError('Folder cannot be its own parent');
      }
      if (parentId) {
        const newParent = await prisma.folder.findFirst({
          where: { id: parentId, tenantId: req.tenant.id },
        });
        if (!newParent) {
          throw new NotFoundError('Parent folder not found');
        }
        // Check for circular reference
        if (newParent.parentId === id) {
          throw new BadRequestError('Circular folder reference not allowed');
        }
      }
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        type: type || undefined,
        status: status || undefined,
        color: color || undefined,
        parentId: parentId !== undefined ? (parentId || null) : undefined,
        metadataCession: metadataCession !== undefined ? metadataCession : undefined,
        archivedAt: archivedAt !== undefined ? (archivedAt ? new Date(archivedAt) : null) : undefined,
        closedAt: closedAt !== undefined ? (closedAt ? new Date(closedAt) : null) : undefined,
      },
      include: {
        client: { select: { id: true, companyName: true, firstName: true, lastName: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_UPDATED',
        entityType: 'Folder',
        entityId: folder.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        changes: { title, description, type, status, color, parentId },
      },
    });

    return successResponse(res, omitSensitiveFields(updated), 'Folder updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete folder (soft delete or hard delete if empty)
 */
const deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Check if folder has documents or subfolders
    if (folder._count.documents > 0 || folder._count.children > 0) {
      if (force !== 'true') {
        throw new BadRequestError(
          `Folder contains ${folder._count.documents} documents and ${folder._count.children} subfolders. Use force=true to delete.`
        );
      }

      // Force delete: archive the folder
      await prisma.folder.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'FOLDER_ARCHIVED',
          entityType: 'Folder',
          entityId: folder.id,
          userId: req.user.id,
          tenantId: req.tenant.id,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
        },
      });

      return successResponse(res, null, 'Folder archived (contains documents)');
    }

    // Delete empty folder
    await prisma.folder.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_DELETED',
        entityType: 'Folder',
        entityId: folder.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info('Folder deleted', { folderId: id, userId: req.user.id });

    return successResponse(res, null, 'Folder deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Get folder tree (hierarchy)
 */
const getTree = async (req, res, next) => {
  try {
    const { clientId } = req.query;

    const where = {
      tenantId: req.tenant.id,
      parentId: null, // Root folders only
    };

    if (clientId) where.clientId = clientId;

    const rootFolders = await prisma.folder.findMany({
      where,
      orderBy: { title: 'asc' },
      include: {
        client: { select: { id: true, companyName: true, firstName: true, lastName: true } },
        children: {
          orderBy: { title: 'asc' },
          include: {
            children: {
              orderBy: { title: 'asc' },
              select: {
                id: true,
                title: true,
                reference: true,
                status: true,
                color: true,
                _count: { select: { documents: true, children: true } },
              },
            },
            _count: { select: { documents: true, children: true } },
          },
        },
        _count: { select: { documents: true, children: true } },
      },
    });

    return successResponse(res, rootFolders);
  } catch (error) {
    next(error);
  }
};

/**
 * Get folder breadcrumb (path from root)
 */
const getBreadcrumb = async (req, res, next) => {
  try {
    const { id } = req.params;

    const breadcrumb = [];
    let currentId = id;

    while (currentId) {
      const folder = await prisma.folder.findFirst({
        where: { id: currentId, tenantId: req.tenant.id },
        select: { id: true, title: true, reference: true, parentId: true },
      });

      if (!folder) break;

      // Map title to name for frontend consistency
      breadcrumb.unshift({
        ...folder,
        name: folder.title,
      });
      currentId = folder.parentId;
    }

    // Return direct array for frontend useQuery
    return res.json(breadcrumb);
  } catch (error) {
    next(error);
  }
};

/**
 * Move folder to new parent
 */
const move = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Verify new parent exists (if not moving to root)
    if (parentId) {
      if (parentId === id) {
        throw new BadRequestError('Folder cannot be its own parent');
      }

      const newParent = await prisma.folder.findFirst({
        where: { id: parentId, tenantId: req.tenant.id },
      });

      if (!newParent) {
        throw new NotFoundError('Target folder not found');
      }

      // Check for circular reference
      let checkId = newParent.parentId;
      while (checkId) {
        if (checkId === id) {
          throw new BadRequestError('Cannot move folder into its own subfolder');
        }
        const checkFolder = await prisma.folder.findFirst({
          where: { id: checkId },
          select: { parentId: true },
        });
        checkId = checkFolder?.parentId;
      }
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: { parentId: parentId || null },
      include: {
        parent: { select: { id: true, title: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_MOVED',
        entityType: 'Folder',
        entityId: folder.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: { oldParentId: folder.parentId, newParentId: parentId },
      },
    });

    return successResponse(res, omitSensitiveFields(updated), 'Folder moved');
  } catch (error) {
    next(error);
  }
};

/**
 * Get folder activity/timeline
 */
const getActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, pageSize, skip, take } = parsePaginationParams(req.query, { pageSize: 50 });

    // Verify folder exists and belongs to tenant
    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
      select: { id: true },
    });

    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    // Get all document IDs in this folder for related activity
    const documents = await prisma.document.findMany({
      where: { folderId: id },
      select: { id: true },
    });
    const documentIds = documents.map(d => d.id);

    // Get all person IDs in this folder
    const persons = await prisma.folderPerson.findMany({
      where: { folderId: id },
      select: { id: true },
    });
    const personIds = persons.map(p => p.id);

    // Query audit logs for folder and related entities
    const whereConditions = [
      { entityType: 'Folder', entityId: id },
    ];

    if (documentIds.length > 0) {
      whereConditions.push({ entityType: 'Document', entityId: { in: documentIds } });
    }
    if (personIds.length > 0) {
      whereConditions.push({ entityType: 'FolderPerson', entityId: { in: personIds } });
    }

    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          tenantId: req.tenant.id,
          OR: whereConditions,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          tenantId: req.tenant.id,
          OR: whereConditions,
        },
      }),
    ]);

    // Transform activities for frontend
    const transformed = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      user: activity.user ? {
        id: activity.user.id,
        name: `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email,
      } : null,
      metadata: activity.metadata,
      changes: activity.changes,
      createdAt: activity.createdAt,
    }));

    return paginatedResponse(res, transformed, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Create folder via wizard (atomic transaction)
 */
const createWizard = async (req, res, next) => {
  try {
    // GO-LIVE-6 B2 — `documents` retiré : le wizard ne crée plus de documents placeholder
    // (voir suppression de l'ex-étape 7). Les documents se génèrent à la demande.
    const { client, type, nature, infos, parties, extranet } = req.body;

    if (!client) throw new BadRequestError('Client is required');
    if (!type) throw new BadRequestError('Type is required');
    if (!infos || !infos.titre) throw new BadRequestError('Title is required');

    // Map wizard type to FolderType enum
    const folderTypeMap = { juridique: 'CONTRACT', judiciaire: 'LITIGATION' };
    const folderType = folderTypeMap[type] || 'OTHER';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or retrieve client
      let clientRecord;
      if (client.id) {
        clientRecord = await tx.client.findFirst({
          where: { id: client.id, tenantId: req.tenant.id },
        });
        if (!clientRecord) throw new NotFoundError('Client not found');
      } else {
        clientRecord = await tx.client.create({
          data: {
            tenantId: req.tenant.id,
            type: client.type || 'INDIVIDUAL',
            lastName: client.lastName || '',
            firstName: client.firstName || null,
            companyName: client.companyName || null,
            email: client.email || null,
          },
        });
      }

      // 2. Generate reference
      const year = new Date().getFullYear();
      const count = await tx.folder.count({
        where: {
          tenantId: req.tenant.id,
          createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
        },
      });
      const reference = `DOS-${year}-${String(count + 1).padStart(4, '0')}`;

      // 3. Create the folder
      const folder = await tx.folder.create({
        data: {
          tenantId: req.tenant.id,
          clientId: clientRecord.id,
          createdById: req.user.id,
          reference,
          title: infos.titre,
          description: infos.description || null,
          type: folderType,
          nature: nature || null,
          juridiction: infos.juridiction || null,
          numeroRG: infos.numeroRG || null,
          chambre: infos.chambre || null,
          dateAudience: infos.dateAudience ? new Date(infos.dateAudience) : null,
          dateEcheance: infos.dateEcheance ? new Date(infos.dateEcheance) : null,
          openedAt: infos.dateOuverture ? new Date(infos.dateOuverture) : new Date(),
        },
      });

      // 4. Create doc categories from tree template
      const treeTemplate = await tx.folderTreeTemplate.findFirst({
        where: {
          tenantId: req.tenant.id,
          folderType: type,
          isDefault: true,
        },
      });

      let firstCategoryId = null;
      if (treeTemplate && Array.isArray(treeTemplate.categories)) {
        for (const cat of treeTemplate.categories) {
          const created = await tx.folderDocCategory.create({
            data: {
              folderId: folder.id,
              name: cat.name,
              ordre: cat.ordre || 0,
            },
          });
          if (!firstCategoryId) firstCategoryId = created.id;
        }
      }

      // 5. Add client as FolderPerson (role: CLIENT)
      await tx.folderPerson.create({
        data: {
          folderId: folder.id,
          tenantId: req.tenant.id,
          role: 'CLIENT',
          lastName: clientRecord.lastName || clientRecord.companyName || '',
          firstName: clientRecord.firstName || null,
          email: clientRecord.email || null,
          phone: clientRecord.phone || null,
          clientId: clientRecord.id,
        },
      });

      // 6. Add parties (judiciaire)
      if (parties && Array.isArray(parties)) {
        for (const partie of parties) {
          // GO-LIVE-1.B — support adversaire personne morale via le wizard.
          const partieType = partie.type === 'MORALE' ? 'MORALE' : 'PHYSIQUE';
          const capRaw = partie.capital;
          const capital = (capRaw === null || capRaw === undefined || capRaw === '' || !Number.isFinite(Number(capRaw)))
            ? null
            : Math.round(Number(capRaw)); // front envoie déjà en centimes
          const fp = await tx.folderPerson.create({
            data: {
              folderId: folder.id,
              tenantId: req.tenant.id,
              type: partieType,
              role: partie.role || 'PARTIE_ADVERSE',
              lastName: partie.lastName || '',
              firstName: partie.firstName || null,
              company: partieType === 'MORALE' ? (partie.company || null) : null,
              email: partie.email || null,
              phone: partie.phone || null,
              address: partie.address || null,
              cabinet: partie.cabinet || null,
              barreau: partie.barreau || null,
              // Champs PM uniquement si MORALE
              formeSociale: partieType === 'MORALE' ? (partie.formeSociale || null) : null,
              capital: partieType === 'MORALE' ? capital : null,
              villeImmatriculation: partieType === 'MORALE' ? (partie.villeImmatriculation || null) : null,
              numeroImmatriculation: partieType === 'MORALE' ? (partie.numeroImmatriculation || null) : null,
            },
          });

          if (partie.avocat) {
            await tx.folderPerson.create({
              data: {
                folderId: folder.id,
                tenantId: req.tenant.id,
                role: 'AVOCAT_ADVERSE',
                lastName: partie.avocat.lastName || partie.avocat.nom || '',
                firstName: partie.avocat.firstName || null,
                cabinet: partie.avocat.cabinet || null,
                barreau: partie.avocat.barreau || null,
                email: partie.avocat.email || null,
                avocatAdverseId: fp.id,
              },
            });
          }
        }
      }

      // 7. (SUPPRIMÉ — GO-LIVE-6 B2) — le wizard ne crée plus de documents "placeholder"
      //    (size 0, objectKey `pending/…`, jamais générés). Ils apparaissaient comme des
      //    documents fantômes (404 au téléchargement, échec silencieux). Les documents se
      //    génèrent désormais à la demande via /templates/generate (flux qui produit un
      //    vrai .docx et porte les garde-fous champs requis / identité des parties).

      // 8. Update extranet if requested
      if (extranet && clientRecord.id) {
        await tx.client.update({
          where: { id: clientRecord.id },
          data: { hasExternet: true },
        });
      }

      // 9. Create timeline event
      await tx.timelineEvent.create({
        data: {
          folderId: folder.id,
          type: 'dossier_cree',
          description: `Dossier "${folder.title}" créé`,
          userId: req.user.id,
        },
      });

      // Return folder with relations
      return tx.folder.findUnique({
        where: { id: folder.id },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, companyName: true, email: true, type: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { documents: true, persons: true } },
        },
      });
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_CREATED_WIZARD',
        entityType: 'Folder',
        entityId: result.id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: { type, nature, title: infos.titre, clientId: result.clientId },
      },
    });

    logger.info('Folder created via wizard', {
      folderId: result.id,
      reference: result.reference,
      userId: req.user.id,
    });

    return successResponse(res, omitSensitiveFields(result), 'Dossier créé', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Change folder status
 */
const patchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING', 'CLOSED', 'ARCHIVED'];
    if (!status || !validStatuses.includes(status)) {
      throw new BadRequestError('Invalid status');
    }

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
    });
    if (!folder) throw new NotFoundError('Folder not found');

    const data = { status };
    if (status === 'CLOSED') data.closedAt = new Date();
    if (status === 'ARCHIVED') data.archivedAt = new Date();
    if (status === 'OPEN' && folder.status === 'CLOSED') data.closedAt = null;

    const updated = await prisma.folder.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, companyName: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'FOLDER_STATUS_CHANGED',
        entityType: 'Folder',
        entityId: id,
        userId: req.user.id,
        tenantId: req.tenant.id,
        metadata: { oldStatus: folder.status, newStatus: status },
      },
    });

    // Timeline event
    const statusLabels = { OPEN: 'Ouvert', IN_PROGRESS: 'En cours', PENDING: 'En attente', CLOSED: 'Clôturé', ARCHIVED: 'Archivé' };
    const eventType = status === 'CLOSED' ? 'dossier_cloture' : status === 'ARCHIVED' ? 'dossier_archive' : (folder.status === 'CLOSED' ? 'dossier_reouvert' : 'dossier_statut');
    await timeline.addEvent({
      folderId: id,
      type: eventType,
      description: `Statut changé de "${statusLabels[folder.status] || folder.status}" à "${statusLabels[status] || status}"`,
      userId: req.user.id,
      metadata: { oldStatus: folder.status, newStatus: status },
    });

    return successResponse(res, omitSensitiveFields(updated), 'Status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Get next folder reference
 */
const nextReference = async (req, res, next) => {
  try {
    const reference = await generateFolderReference(req.tenant.id);
    return successResponse(res, { reference });
  } catch (error) {
    next(error);
  }
};

/**
 * Get folder documents grouped by FolderDocCategory
 */
const getDocumentsGrouped = async (req, res, next) => {
  try {
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
      select: { id: true },
    });
    if (!folder) throw new NotFoundError('Folder not found');

    // Get all doc categories for this folder
    const categories = await prisma.folderDocCategory.findMany({
      where: { folderId: id },
      orderBy: { ordre: 'asc' },
      include: {
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            originalName: true,
            type: true,
            status: true,
            mimeType: true,
            size: true,
            visibleExtranet: true,
            createdAt: true,
            tags: true,
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { versions: true, signatures: true } },
          },
        },
      },
    });

    // Get uncategorized documents (no docCategoryId)
    const uncategorized = await prisma.document.findMany({
      where: {
        folderId: id,
        deletedAt: null,
        docCategoryId: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        originalName: true,
        type: true,
        status: true,
        mimeType: true,
        size: true,
        visibleExtranet: true,
        createdAt: true,
        tags: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { versions: true, signatures: true } },
      },
    });

    // Convert BigInt size to Number for JSON serialization
    const serializeDocs = (docs) => docs.map(d => ({ ...d, size: Number(d.size) }));
    const serializedCategories = categories.map(c => ({
      ...c,
      documents: serializeDocs(c.documents || []),
    }));

    return successResponse(res, {
      categories: serializedCategories,
      uncategorized: serializeDocs(uncategorized),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get signatures related to a folder
 */
const getSignatures = async (req, res, next) => {
  try {
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
      select: { id: true },
    });
    if (!folder) throw new NotFoundError('Folder not found');

    const signatures = await prisma.signatureRequest.findMany({
      where: { folderId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: { id: true, name: true, originalName: true, mimeType: true },
        },
      },
    });

    return successResponse(res, signatures);
  } catch (error) {
    next(error);
  }
};

/**
 * Get folder timeline events
 */
const getTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, limit } = req.query;

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
      select: { id: true },
    });
    if (!folder) throw new NotFoundError('Folder not found');

    const where = { folderId: id };
    if (type) where.type = type;

    const events = await prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 200,
      include: {
        document: { select: { id: true, name: true } },
      },
    });

    // Enrich with user names
    const userIds = [...new Set(events.filter(e => e.userId).map(e => e.userId))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const userMap = {};
    users.forEach(u => { userMap[u.id] = `${u.firstName} ${u.lastName}`; });

    const enriched = events.map(e => ({
      ...e,
      userName: e.userId ? (userMap[e.userId] || null) : null,
      typeLabel: timeline.TYPE_LABELS[e.type] || e.type,
    }));

    return successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a FolderDocCategory to a folder
 */
const addDocCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;

    if (!name) throw new BadRequestError('Category name is required');

    const folder = await prisma.folder.findFirst({
      where: { id, tenantId: req.tenant.id },
      select: { id: true },
    });
    if (!folder) throw new NotFoundError('Folder not found');

    // Get max ordre
    const maxOrdre = await prisma.folderDocCategory.aggregate({
      where: { folderId: id },
      _max: { ordre: true },
    });

    const category = await prisma.folderDocCategory.create({
      data: {
        folderId: id,
        name,
        icon: icon || null,
        ordre: (maxOrdre._max.ordre || 0) + 1,
      },
    });

    return successResponse(res, category, 'Category created', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  delete: deleteFolder,
  getTree,
  getBreadcrumb,
  move,
  getActivity,
  createWizard,
  patchStatus,
  nextReference,
  getDocumentsGrouped,
  getSignatures,
  getTimeline,
  addDocCategory,
};
