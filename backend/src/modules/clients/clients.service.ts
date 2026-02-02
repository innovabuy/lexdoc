import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '@/utils/errors';
import type { CreateClientInput, UpdateClientInput, ClientQuery } from './clients.schemas';

export class ClientsService {
  /**
   * List clients with filters
   */
  async list(cabinetId: string, query: ClientQuery) {
    const { search, type, tags, page, limit, sortBy, sortOrder } = query;

    const where: Prisma.ClientWhereInput = {
      cabinetId,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      where.tags = { hasSome: tagList };
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { denomination: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { siret: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { folders: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: clients.map((c) => ({
        ...c,
        foldersCount: c._count.folders,
        _count: undefined,
      })),
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
   * Get a single client by ID
   */
  async getById(id: string, cabinetId: string) {
    const client = await prisma.client.findFirst({
      where: {
        id,
        cabinetId,
        deletedAt: null,
      },
      include: {
        folders: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            folderType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client non trouve');
    }

    return client;
  }

  /**
   * Create a new client
   */
  async create(cabinetId: string, data: CreateClientInput) {
    const client = await prisma.client.create({
      data: {
        cabinetId,
        type: data.type,
        civilite: data.civilite,
        nom: data.nom,
        prenom: data.prenom,
        denomination: data.denomination,
        email: data.email || null,
        telephone: data.telephone,
        mobile: data.mobile,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        pays: data.pays,
        siret: data.siret || null,
        rcs: data.rcs,
        formeJuridique: data.formeJuridique,
        capital: data.capital,
        representant: data.representant,
        notes: data.notes,
        tags: data.tags || [],
      },
    });

    return client;
  }

  /**
   * Update a client
   */
  async update(id: string, cabinetId: string, data: UpdateClientInput) {
    const existing = await prisma.client.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Client non trouve');
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.civilite !== undefined && { civilite: data.civilite }),
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.prenom !== undefined && { prenom: data.prenom }),
        ...(data.denomination !== undefined && { denomination: data.denomination }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.telephone !== undefined && { telephone: data.telephone }),
        ...(data.mobile !== undefined && { mobile: data.mobile }),
        ...(data.adresse !== undefined && { adresse: data.adresse }),
        ...(data.codePostal !== undefined && { codePostal: data.codePostal }),
        ...(data.ville !== undefined && { ville: data.ville }),
        ...(data.pays !== undefined && { pays: data.pays }),
        ...(data.siret !== undefined && { siret: data.siret || null }),
        ...(data.rcs !== undefined && { rcs: data.rcs }),
        ...(data.formeJuridique !== undefined && { formeJuridique: data.formeJuridique }),
        ...(data.capital !== undefined && { capital: data.capital }),
        ...(data.representant !== undefined && { representant: data.representant }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });

    return client;
  }

  /**
   * Soft delete a client
   */
  async delete(id: string, cabinetId: string) {
    const existing = await prisma.client.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Client non trouve');
    }

    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Search clients for autocomplete
   */
  async search(cabinetId: string, query: string, limit = 10) {
    const clients = await prisma.client.findMany({
      where: {
        cabinetId,
        deletedAt: null,
        OR: [
          { nom: { contains: query, mode: 'insensitive' } },
          { prenom: { contains: query, mode: 'insensitive' } },
          { denomination: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        type: true,
        nom: true,
        prenom: true,
        denomination: true,
        email: true,
        siret: true,
      },
      orderBy: { nom: 'asc' },
    });

    return clients;
  }
}

export const clientsService = new ClientsService();
