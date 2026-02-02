import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { randomBytes } from 'crypto';
import { addMonths, addYears } from 'date-fns';
import type {
  SubmitConsentInput,
  SubmitRgpdRequestInput,
  ProcessRgpdRequestInput,
  CreateRetentionPolicyInput,
  UpdateRetentionPolicyInput,
  ListRgpdRequestsQuery,
  ListConsentsQuery,
} from './rgpd.schemas';

class RgpdService {
  // ============================================
  // CONSENT MANAGEMENT
  // ============================================

  /**
   * Record a new RGPD consent
   */
  async recordConsent(
    input: SubmitConsentInput,
    ipAddress: string,
    userAgent?: string
  ) {
    const consent = await prisma.rgpdConsent.create({
      data: {
        clientId: input.clientId,
        consentGiven: true,
        ipAddress,
        userAgent,
        consentTypes: input.consentTypes,
        version: input.version,
        context: input.context,
        contextId: input.contextId,
      },
    });

    // Log the action
    await this.logRgpdAction('CONSENT_GIVEN', {
      consentId: consent.id,
      clientId: input.clientId,
      consentTypes: input.consentTypes,
      context: input.context,
    }, ipAddress, userAgent, 'client');

    return consent;
  }

  /**
   * Revoke a consent
   */
  async revokeConsent(consentId: string, ipAddress: string, userAgent?: string) {
    const consent = await prisma.rgpdConsent.findUnique({
      where: { id: consentId },
    });

    if (!consent) {
      throw new AppError('Consentement non trouvé', 404);
    }

    if (consent.isRevoked) {
      throw new AppError('Ce consentement est déjà révoqué', 400);
    }

    const updated = await prisma.rgpdConsent.update({
      where: { id: consentId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // Log the action
    await this.logRgpdAction('CONSENT_REVOKED', {
      consentId,
      clientId: consent.clientId,
    }, ipAddress, userAgent, 'client');

    return updated;
  }

  /**
   * Get consents for a client
   */
  async getClientConsents(clientId: string) {
    return prisma.rgpdConsent.findMany({
      where: { clientId },
      orderBy: { consentDate: 'desc' },
    });
  }

  /**
   * List all consents (admin)
   */
  async listConsents(cabinetId: string, query: ListConsentsQuery) {
    const { clientId, isRevoked, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (typeof isRevoked === 'boolean') where.isRevoked = isRevoked;

    // Filter by cabinet's clients
    if (!clientId) {
      where.client = { cabinetId };
    }

    const [data, total] = await Promise.all([
      prisma.rgpdConsent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { consentDate: 'desc' },
        include: {
          client: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
        },
      }),
      prisma.rgpdConsent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

  // ============================================
  // DATA REQUEST MANAGEMENT
  // ============================================

  /**
   * Submit a new RGPD data request (public)
   */
  async submitDataRequest(
    input: SubmitRgpdRequestInput,
    ipAddress: string,
    userAgent?: string
  ) {
    // Check if a pending request already exists for this email
    const existingRequest = await prisma.rgpdDataRequest.findFirst({
      where: {
        requestedByEmail: input.email,
        status: { in: ['PENDING', 'VERIFIED', 'PROCESSING'] },
      },
    });

    if (existingRequest) {
      throw new AppError(
        'Une demande est déjà en cours de traitement pour cet email',
        400
      );
    }

    // Find client by email
    const client = await prisma.client.findFirst({
      where: { email: input.email },
    });

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Due date is 1 month from now (RGPD requirement)
    const dueDate = addMonths(new Date(), 1);

    const request = await prisma.rgpdDataRequest.create({
      data: {
        clientId: client?.id,
        type: input.type,
        requestedByEmail: input.email,
        requestedByName: input.name,
        requestDetails: input.details ? { details: input.details } : undefined,
        verificationToken,
        dueDate,
      },
    });

    // Log the action
    await this.logRgpdAction('DATA_ACCESS_REQUESTED', {
      requestId: request.id,
      type: input.type,
      email: input.email,
    }, ipAddress, userAgent, 'client');

    // TODO: Send verification email with token

    return {
      id: request.id,
      message: 'Un email de vérification a été envoyé à votre adresse',
    };
  }

  /**
   * Verify a data request via token
   */
  async verifyDataRequest(token: string) {
    const request = await prisma.rgpdDataRequest.findUnique({
      where: { verificationToken: token },
    });

    if (!request) {
      throw new AppError('Token de vérification invalide', 400);
    }

    if (request.verifiedAt) {
      throw new AppError('Cette demande a déjà été vérifiée', 400);
    }

    const updated = await prisma.rgpdDataRequest.update({
      where: { id: request.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationToken: null, // Clear token after use
      },
    });

    return updated;
  }

  /**
   * List data requests (admin)
   */
  async listDataRequests(cabinetId: string, query: ListRgpdRequestsQuery) {
    const { status, type, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Filter by cabinet's clients OR unlinked requests
    where.OR = [
      { client: { cabinetId } },
      { clientId: null },
    ];

    const [data, total] = await Promise.all([
      prisma.rgpdDataRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestDate: 'desc' },
        include: {
          client: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          processedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.rgpdDataRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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
   * Get a single data request
   */
  async getDataRequest(requestId: string, cabinetId: string) {
    const request = await prisma.rgpdDataRequest.findUnique({
      where: { id: requestId },
      include: {
        client: true,
        processedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!request) {
      throw new AppError('Demande non trouvée', 404);
    }

    // Verify access (must be cabinet's client or unlinked)
    if (request.client && request.client.cabinetId !== cabinetId) {
      throw new AppError('Accès non autorisé', 403);
    }

    return request;
  }

  /**
   * Process a data request (admin)
   */
  async processDataRequest(
    input: ProcessRgpdRequestInput,
    processedById: string,
    cabinetId: string,
    ipAddress: string,
    userAgent?: string
  ) {
    const request = await this.getDataRequest(input.requestId, cabinetId);

    if (request.status === 'COMPLETED' || request.status === 'REJECTED') {
      throw new AppError('Cette demande a déjà été traitée', 400);
    }

    const updated = await prisma.rgpdDataRequest.update({
      where: { id: input.requestId },
      data: {
        status: input.status,
        processedById,
        processingNotes: input.processingNotes,
        responseData: input.responseData,
        completedDate: new Date(),
      },
    });

    // Log the action
    const actionType = request.type === 'ACCESS' ? 'DATA_ACCESS_PROVIDED' :
                       request.type === 'ERASURE' ? 'DATA_ERASURE_COMPLETED' :
                       request.type === 'RECTIFICATION' ? 'DATA_RECTIFICATION_COMPLETED' :
                       request.type === 'PORTABILITY' ? 'DATA_PORTABILITY_PROVIDED' :
                       request.type === 'RESTRICTION' ? 'DATA_RESTRICTION_APPLIED' :
                       'DATA_OPPOSITION_APPLIED';

    await this.logRgpdAction(actionType, {
      requestId: input.requestId,
      status: input.status,
      clientId: request.clientId,
    }, ipAddress, userAgent, 'user', processedById);

    return updated;
  }

  /**
   * Export client data for portability
   */
  async exportClientData(clientId: string, cabinetId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId },
      include: {
        folders: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            folderType: true,
            createdAt: true,
          },
        },
        rgpdConsents: {
          select: {
            id: true,
            consentDate: true,
            consentTypes: true,
            isRevoked: true,
            revokedAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new AppError('Client non trouvé', 404);
    }

    // Format data for portability (JSON)
    return {
      exportDate: new Date().toISOString(),
      format: 'JSON',
      data: {
        personalInfo: {
          type: client.type,
          civilite: client.civilite,
          nom: client.nom,
          prenom: client.prenom,
          denomination: client.denomination,
          email: client.email,
          telephone: client.telephone,
          mobile: client.mobile,
          adresse: client.adresse,
          codePostal: client.codePostal,
          ville: client.ville,
          pays: client.pays,
        },
        businessInfo: client.type === 'ENTREPRISE' ? {
          siret: client.siret,
          rcs: client.rcs,
          formeJuridique: client.formeJuridique,
          capital: client.capital?.toString(),
          representant: client.representant,
        } : null,
        folders: client.folders,
        consents: client.rgpdConsents,
        metadata: {
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        },
      },
    };
  }

  /**
   * Anonymize client data (for erasure requests)
   */
  async anonymizeClientData(clientId: string, cabinetId: string, userId: string, ipAddress: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId },
    });

    if (!client) {
      throw new AppError('Client non trouvé', 404);
    }

    // Anonymize the client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        nom: '[ANONYMISÉ]',
        prenom: null,
        denomination: client.denomination ? '[ANONYMISÉ]' : null,
        email: `anonymized-${clientId.substring(0, 8)}@deleted.local`,
        telephone: null,
        mobile: null,
        adresse: '[SUPPRIMÉ]',
        codePostal: null,
        ville: null,
        siret: null,
        rcs: null,
        representant: null,
        notes: null,
        tags: [],
      },
    });

    // Update retention policy
    await prisma.rgpdDataRetention.upsert({
      where: {
        entityType_entityId: {
          entityType: 'Client',
          entityId: clientId,
        },
      },
      create: {
        entityType: 'Client',
        entityId: clientId,
        retentionUntil: new Date(),
        reason: 'Exercice du droit à l\'effacement (Art. 17 RGPD)',
        isAnonymized: true,
        anonymizedAt: new Date(),
      },
      update: {
        isAnonymized: true,
        anonymizedAt: new Date(),
      },
    });

    // Log the action
    await this.logRgpdAction('DATA_ANONYMIZED', {
      clientId,
      reason: 'Demande d\'effacement',
    }, ipAddress, undefined, 'user', userId);

    return { success: true, message: 'Données client anonymisées' };
  }

  // ============================================
  // DATA RETENTION MANAGEMENT
  // ============================================

  /**
   * Create a retention policy
   */
  async createRetentionPolicy(input: CreateRetentionPolicyInput) {
    const retentionUntil = addYears(new Date(), input.retentionYears);

    return prisma.rgpdDataRetention.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        retentionUntil,
        reason: input.reason,
        legalBasis: input.legalBasis,
        notes: input.notes,
      },
    });
  }

  /**
   * Get retention policy for an entity
   */
  async getRetentionPolicy(entityType: string, entityId: string) {
    return prisma.rgpdDataRetention.findUnique({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
    });
  }

  /**
   * Update retention policy
   */
  async updateRetentionPolicy(
    entityType: string,
    entityId: string,
    input: UpdateRetentionPolicyInput
  ) {
    return prisma.rgpdDataRetention.update({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
      data: {
        retentionUntil: input.retentionUntil ? new Date(input.retentionUntil) : undefined,
        reason: input.reason,
        notes: input.notes,
      },
    });
  }

  /**
   * Get entities due for anonymization
   */
  async getEntitiesDueForAnonymization() {
    return prisma.rgpdDataRetention.findMany({
      where: {
        retentionUntil: { lte: new Date() },
        isAnonymized: false,
      },
      orderBy: { retentionUntil: 'asc' },
    });
  }

  /**
   * Process automatic anonymization (called by CRON)
   */
  async processAutomaticAnonymization() {
    const entitiesToAnonymize = await this.getEntitiesDueForAnonymization();
    const results = [];

    for (const entity of entitiesToAnonymize) {
      try {
        if (entity.entityType === 'Client') {
          // Get client to find cabinetId
          const client = await prisma.client.findUnique({
            where: { id: entity.entityId },
            select: { cabinetId: true },
          });

          if (client) {
            await this.anonymizeClientData(
              entity.entityId,
              client.cabinetId,
              'system',
              'cron-job'
            );
            results.push({ entityId: entity.entityId, status: 'anonymized' });
          }
        }
        // Add handlers for other entity types as needed
      } catch (error) {
        results.push({ entityId: entity.entityId, status: 'error', error: String(error) });
      }
    }

    return results;
  }

  // ============================================
  // RGPD AUDIT LOGGING
  // ============================================

  /**
   * Log an RGPD action
   */
  private async logRgpdAction(
    action: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    actorType: 'user' | 'system' | 'client' = 'system',
    actorId?: string
  ) {
    return prisma.rgpdAuditLog.create({
      data: {
        action: action as any,
        entityType: details.entityType || (details.clientId ? 'Client' : null),
        entityId: details.entityId || details.clientId || details.requestId,
        actorId,
        actorType,
        details,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get RGPD audit logs
   */
  async getAuditLogs(filters: {
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return prisma.rgpdAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  // ============================================
  // DASHBOARD STATS
  // ============================================

  /**
   * Get RGPD dashboard statistics
   */
  async getDashboardStats(cabinetId: string) {
    const [
      pendingRequests,
      overdueRequests,
      activeConsents,
      revokedConsents,
      entitiesWithRetention,
    ] = await Promise.all([
      prisma.rgpdDataRequest.count({
        where: {
          status: { in: ['PENDING', 'VERIFIED', 'PROCESSING'] },
          OR: [
            { client: { cabinetId } },
            { clientId: null },
          ],
        },
      }),
      prisma.rgpdDataRequest.count({
        where: {
          status: { in: ['PENDING', 'VERIFIED', 'PROCESSING'] },
          dueDate: { lt: new Date() },
          OR: [
            { client: { cabinetId } },
            { clientId: null },
          ],
        },
      }),
      prisma.rgpdConsent.count({
        where: {
          isRevoked: false,
          client: { cabinetId },
        },
      }),
      prisma.rgpdConsent.count({
        where: {
          isRevoked: true,
          client: { cabinetId },
        },
      }),
      prisma.rgpdDataRetention.count({
        where: {
          isAnonymized: false,
        },
      }),
    ]);

    return {
      requests: {
        pending: pendingRequests,
        overdue: overdueRequests,
      },
      consents: {
        active: activeConsents,
        revoked: revokedConsents,
      },
      retention: {
        tracked: entitiesWithRetention,
      },
    };
  }
}

export const rgpdService = new RgpdService();
