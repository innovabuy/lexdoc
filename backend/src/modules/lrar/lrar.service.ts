import { prisma } from '@/config/database';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { LrarStatus, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { downloadFromMinio } from '@/modules/documents/upload.middleware';
import { getSendingBoxClient, type Recipient } from './sendingbox.client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type {
  CreateLrarInput,
  ListLrarInput,
  LrarShipmentResponse,
  SendingboxWebhookPayload,
} from './lrar.schemas';

const execAsync = promisify(exec);

export class LrarService {
  /**
   * Create a new LRAR shipment
   */
  async createLrar(
    cabinetId: string,
    userId: string,
    input: CreateLrarInput
  ): Promise<LrarShipmentResponse> {
    // 1. Verify document exists and belongs to cabinet
    const document = await prisma.document.findFirst({
      where: { id: input.documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document non trouvé');
    }

    if (document.mimeType !== 'application/pdf') {
      throw new BadRequestError('Seuls les documents PDF peuvent être envoyés en LRAR');
    }

    // 2. Get cabinet and user info for default sender
    const [cabinet, user] = await Promise.all([
      prisma.cabinet.findUnique({ where: { id: cabinetId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!cabinet || !user) {
      throw new NotFoundError('Cabinet ou utilisateur non trouvé');
    }

    // Default sender from cabinet info
    const sender = input.sender || {
      firstName: user.firstName,
      lastName: user.lastName,
      address: cabinet.address || '',
      postalCode: cabinet.postalCode || '',
      city: cabinet.city || '',
      country: 'FR',
    };

    // 3. Create shipment in DB first (pending)
    const shipment = await prisma.lrarShipment.create({
      data: {
        cabinetId,
        documentId: input.documentId,
        initiatorId: userId,
        subject: input.subject,
        reference: input.reference,
        status: LrarStatus.PENDING,

        // Recipient
        recipientFirstName: String(input.recipient.firstName),
        recipientLastName: String(input.recipient.lastName),
        recipientAddress: String(input.recipient.address),
        recipientPostalCode: String(input.recipient.postalCode),
        recipientCity: String(input.recipient.city),
        recipientCountry: String(input.recipient.country ?? 'FR'),

        // Sender
        senderFirstName: String(sender.firstName),
        senderLastName: String(sender.lastName),
        senderAddress: String(sender.address),
        senderPostalCode: String(sender.postalCode),
        senderCity: String(sender.city),
        senderCountry: String(sender.country ?? 'FR'),

        // Options
        color: input.color ?? false,
        duplexPrinting: input.duplexPrinting ?? true,
        registeredMail: input.registeredMail ?? true,
      },
      include: {
        document: { select: { id: true, title: true, mimeType: true } },
        initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
        trackingEvents: { orderBy: { eventAt: 'desc' } },
      },
    });

    // 4. Download document from MinIO
    if (!document.encryptionKey) {
      throw new BadRequestError('Clé de chiffrement du document manquante');
    }

    const { buffer } = await downloadFromMinio(document.minioPath, document.encryptionKey);

    // 5. Send to SendingBox
    try {
      const sendingBoxClient = getSendingBoxClient();
      const webhookUrl = `${config.urls.backend}/api/webhooks/sendingbox`;

      const sendingboxShipment = await sendingBoxClient.createShipment(
        buffer,
        `${document.title}.pdf`,
        {
          documentId: shipment.id,
          recipient: input.recipient as Recipient,
          sender: sender as Recipient,
          subject: input.subject,
          reference: input.reference,
          color: input.color,
          duplexPrinting: input.duplexPrinting,
          registeredMail: input.registeredMail,
          webhookUrl,
        }
      );

      // 6. Update shipment with SendingBox data
      const updated = await prisma.lrarShipment.update({
        where: { id: shipment.id },
        data: {
          sendingboxId: sendingboxShipment.id,
          trackingNumber: sendingboxShipment.trackingNumber,
          status: LrarStatus.PROCESSING,
          estimatedDeliveryAt: sendingboxShipment.estimatedDelivery,
          cost: sendingboxShipment.cost,
        },
        include: {
          document: { select: { id: true, title: true, mimeType: true } },
          initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
          trackingEvents: { orderBy: { eventAt: 'desc' } },
        },
      });

      // 7. Audit log
      await this.createAuditLog(cabinetId, userId, shipment.id, 'LRAR_CREATED', {
        subject: input.subject,
        documentId: input.documentId,
        recipient: `${input.recipient.firstName} ${input.recipient.lastName}`,
      });

      return this.formatShipment(updated);
    } catch (error: any) {
      // Mark shipment as error if SendingBox fails
      await prisma.lrarShipment.update({
        where: { id: shipment.id },
        data: { status: LrarStatus.ERROR },
      });

      logger.error('Failed to create SendingBox shipment:', error);
      throw new BadRequestError(`Erreur lors de la création de l'envoi LRAR: ${error.message}`);
    }
  }

  /**
   * Get LRAR shipment by ID
   */
  async getLrar(id: string, cabinetId: string): Promise<LrarShipmentResponse> {
    const shipment = await prisma.lrarShipment.findFirst({
      where: { id, cabinetId, deletedAt: null },
      include: {
        document: { select: { id: true, title: true, mimeType: true } },
        initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
        trackingEvents: { orderBy: { eventAt: 'desc' } },
      },
    });

    if (!shipment) {
      throw new NotFoundError('Envoi LRAR non trouvé');
    }

    return this.formatShipment(shipment);
  }

  /**
   * List LRAR shipments
   */
  async listLrar(cabinetId: string, query: ListLrarInput) {
    const { page, limit, status, documentId, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LrarShipmentWhereInput = {
      cabinetId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (documentId) {
      where.documentId = documentId;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { recipientFirstName: { contains: search, mode: 'insensitive' } },
        { recipientLastName: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.lrarShipment.findMany({
        where,
        include: {
          document: { select: { id: true, title: true, mimeType: true } },
          initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
          trackingEvents: { orderBy: { eventAt: 'desc' } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.lrarShipment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: shipments.map(this.formatShipment),
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
   * Cancel LRAR shipment
   */
  async cancelLrar(id: string, cabinetId: string, userId: string): Promise<void> {
    const shipment = await prisma.lrarShipment.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!shipment) {
      throw new NotFoundError('Envoi LRAR non trouvé');
    }

    if (shipment.status === LrarStatus.DELIVERED) {
      throw new BadRequestError('Impossible d\'annuler un envoi livré');
    }

    if (shipment.status === LrarStatus.CANCELLED) {
      throw new BadRequestError('Cet envoi est déjà annulé');
    }

    // Cancel on SendingBox if shipment exists and not yet sent
    const cancellableStatuses: LrarStatus[] = [LrarStatus.PENDING, LrarStatus.PROCESSING];
    if (shipment.sendingboxId && cancellableStatuses.includes(shipment.status)) {
      try {
        const sendingBoxClient = getSendingBoxClient();
        await sendingBoxClient.cancelShipment(shipment.sendingboxId);
      } catch (error: any) {
        logger.warn(`Failed to cancel on SendingBox: ${error.message}`);
        // If SendingBox says it's already sent, we can't cancel
        if (error.message.includes('already sent') || error.message.includes('already printed')) {
          throw new BadRequestError('L\'envoi a déjà été imprimé et ne peut plus être annulé');
        }
      }
    }

    // Update status in DB
    await prisma.lrarShipment.update({
      where: { id },
      data: { status: LrarStatus.CANCELLED },
    });

    await this.createAuditLog(cabinetId, userId, id, 'LRAR_UPDATED', {
      action: 'cancelled',
      subject: shipment.subject,
    });
  }

  /**
   * Download delivery proof
   */
  async downloadProof(
    id: string,
    cabinetId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const shipment = await prisma.lrarShipment.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!shipment) {
      throw new NotFoundError('Envoi LRAR non trouvé');
    }

    if (shipment.status !== LrarStatus.DELIVERED) {
      throw new BadRequestError('La preuve de livraison n\'est disponible qu\'après distribution');
    }

    // If proof is stored locally
    if (shipment.proofPath) {
      const stream = await minioClient.getObject(
        config.minio.buckets.documents,
        shipment.proofPath
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return {
        buffer: Buffer.concat(chunks),
        filename: `AR_${shipment.trackingNumber || shipment.id}.pdf`,
      };
    }

    // Otherwise, fetch from SendingBox
    if (!shipment.sendingboxId) {
      throw new BadRequestError('Preuve de livraison non disponible');
    }

    const sendingBoxClient = getSendingBoxClient();
    const buffer = await sendingBoxClient.downloadProof(shipment.sendingboxId);

    // Store for future use
    const proofPath = `${cabinetId}/lrar/${shipment.id}/proof.pdf`;
    await minioClient.putObject(
      config.minio.buckets.documents,
      proofPath,
      buffer,
      buffer.length,
      { 'Content-Type': 'application/pdf' }
    );

    await prisma.lrarShipment.update({
      where: { id },
      data: { proofPath },
    });

    return {
      buffer,
      filename: `AR_${shipment.trackingNumber || shipment.id}.pdf`,
    };
  }

  /**
   * Handle webhook from SendingBox
   */
  async handleWebhook(payload: SendingboxWebhookPayload): Promise<void> {
    logger.info(`[Webhook] Processing SendingBox webhook: ${payload.shipmentId} -> ${payload.status}`);

    // Find shipment by SendingBox ID
    const shipment = await prisma.lrarShipment.findFirst({
      where: { sendingboxId: payload.shipmentId },
      include: {
        initiator: { select: { email: true, firstName: true } },
        document: { select: { title: true } },
      },
    });

    if (!shipment) {
      logger.warn(`[Webhook] Shipment not found: ${payload.shipmentId}`);
      return;
    }

    const newStatus = this.mapWebhookStatus(payload.status);

    // Add tracking event if provided
    if (payload.trackingEvent) {
      await prisma.lrarTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: payload.trackingEvent.status,
          description: payload.trackingEvent.description,
          location: payload.trackingEvent.location,
          eventAt: new Date(payload.trackingEvent.timestamp),
        },
      });
    }

    // Update shipment status
    const updateData: Prisma.LrarShipmentUpdateInput = {
      status: newStatus,
      trackingNumber: payload.trackingNumber || shipment.trackingNumber,
    };

    if (newStatus === LrarStatus.SENT && !shipment.sentAt) {
      updateData.sentAt = new Date();
    }

    if (newStatus === LrarStatus.DELIVERED) {
      updateData.deliveredAt = new Date();

      // Download and store proof
      await this.storeProof(shipment);
    }

    if (newStatus === LrarStatus.RETURNED) {
      updateData.returnedAt = new Date();
    }

    await prisma.lrarShipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    // Create audit log
    const auditAction = newStatus === LrarStatus.DELIVERED ? 'LRAR_DELIVERED' :
                       newStatus === LrarStatus.RETURNED ? 'LRAR_RETURNED' : 'LRAR_UPDATED';

    await this.createAuditLog(
      shipment.cabinetId,
      shipment.initiatorId,
      shipment.id,
      auditAction,
      { status: newStatus }
    );

    logger.info(`[Webhook] Shipment ${shipment.id} updated to ${newStatus}`);
  }

  /**
   * Store delivery proof from SendingBox
   */
  private async storeProof(shipment: {
    id: string;
    cabinetId: string;
    sendingboxId: string | null;
  }): Promise<void> {
    if (!shipment.sendingboxId) return;

    try {
      const sendingBoxClient = getSendingBoxClient();
      const proof = await sendingBoxClient.downloadProof(shipment.sendingboxId);
      const proofPath = `${shipment.cabinetId}/lrar/${shipment.id}/proof.pdf`;

      await minioClient.putObject(
        config.minio.buckets.documents,
        proofPath,
        proof,
        proof.length,
        { 'Content-Type': 'application/pdf' }
      );

      await prisma.lrarShipment.update({
        where: { id: shipment.id },
        data: { proofPath },
      });

      logger.info(`[LRAR] Stored proof for ${shipment.id}`);
    } catch (error: any) {
      logger.error(`[LRAR] Failed to store proof: ${error.message}`);
    }
  }

  /**
   * Find shipment by SendingBox ID
   */
  async findBySendingboxId(sendingboxId: string) {
    return prisma.lrarShipment.findFirst({
      where: { sendingboxId },
      include: {
        initiator: { select: { email: true, firstName: true } },
        document: { select: { title: true } },
      },
    });
  }

  private mapWebhookStatus(status: string): LrarStatus {
    const statusMap: Record<string, LrarStatus> = {
      'draft': LrarStatus.PENDING,
      'pending': LrarStatus.PENDING,
      'processing': LrarStatus.PROCESSING,
      'printed': LrarStatus.PROCESSING,
      'sent': LrarStatus.SENT,
      'in_transit': LrarStatus.IN_TRANSIT,
      'out_for_delivery': LrarStatus.IN_TRANSIT,
      'delivered': LrarStatus.DELIVERED,
      'returned': LrarStatus.RETURNED,
      'failed': LrarStatus.ERROR,
      'cancelled': LrarStatus.CANCELLED,
    };

    return statusMap[status.toLowerCase()] || LrarStatus.PROCESSING;
  }

  private formatShipment(shipment: any): LrarShipmentResponse {
    return {
      id: shipment.id,
      documentId: shipment.documentId,
      subject: shipment.subject,
      reference: shipment.reference,
      status: shipment.status,
      sendingboxId: shipment.sendingboxId,
      trackingNumber: shipment.trackingNumber,

      recipient: {
        firstName: shipment.recipientFirstName,
        lastName: shipment.recipientLastName,
        address: shipment.recipientAddress,
        postalCode: shipment.recipientPostalCode,
        city: shipment.recipientCity,
        country: shipment.recipientCountry,
      },

      sender: {
        firstName: shipment.senderFirstName,
        lastName: shipment.senderLastName,
        address: shipment.senderAddress,
        postalCode: shipment.senderPostalCode,
        city: shipment.senderCity,
        country: shipment.senderCountry,
      },

      color: shipment.color,
      duplexPrinting: shipment.duplexPrinting,
      registeredMail: shipment.registeredMail,

      proofPath: shipment.proofPath,
      cost: shipment.cost ? Number(shipment.cost) : undefined,

      sentAt: shipment.sentAt,
      deliveredAt: shipment.deliveredAt,
      returnedAt: shipment.returnedAt,
      estimatedDeliveryAt: shipment.estimatedDeliveryAt,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,

      document: shipment.document,
      initiator: shipment.initiator,
      trackingEvents: shipment.trackingEvents.map((e: any) => ({
        id: e.id,
        status: e.status,
        description: e.description,
        location: e.location,
        eventAt: e.eventAt,
      })),
    };
  }

  private async createAuditLog(
    cabinetId: string,
    userId: string,
    entityId: string,
    action: string,
    details: Record<string, any>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          cabinetId,
          userId,
          action: action as any,
          entity: 'LrarShipment',
          entityId,
          details,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

// ============================================
// GENERATED DOCUMENTS LRAR METHODS
// ============================================

export interface GeneratedDocumentRecipient {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country?: string;
}

export interface LrarSendOptions {
  color?: boolean;
  duplex?: boolean;
  registered?: boolean;
}

export interface GeneratedDocumentLrarResult {
  letterId: string;
  trackingNumber?: string;
  trackingUrl: string;
  estimatedDelivery?: Date;
  cost?: number;
}

export interface LrarTrackingResult {
  letterId: string;
  status: string;
  trackingNumber?: string;
  events: Array<{
    date: Date;
    type: string;
    description?: string;
    location?: string;
  }>;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  proofAvailable: boolean;
}

export class GeneratedDocumentLrarService {
  /**
   * Send a generated document as LRAR
   */
  async sendDocumentAsLRAR(
    documentId: string,
    cabinetId: string,
    userId: string,
    recipient: GeneratedDocumentRecipient,
    options: LrarSendOptions = {}
  ): Promise<GeneratedDocumentLrarResult> {
    // 1. Load generated document from DB
    const generatedDoc = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
      include: {
        folder: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!generatedDoc) {
      throw new NotFoundError('Document genere non trouve');
    }

    if (generatedDoc.status !== 'FINALIZED') {
      throw new BadRequestError('Le document doit etre finalise avant envoi en LRAR');
    }

    if (!generatedDoc.outputFilePath) {
      throw new BadRequestError('Le fichier du document n\'est pas disponible');
    }

    // 2. Get cabinet and user info for sender
    const [cabinet, user] = await Promise.all([
      prisma.cabinet.findUnique({ where: { id: cabinetId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!cabinet || !user) {
      throw new NotFoundError('Cabinet ou utilisateur non trouve');
    }

    // 3. Get document file from MinIO
    let documentBuffer: Buffer;
    try {
      const stream = await minioClient.getObject(
        config.minio.buckets.documents,
        generatedDoc.outputFilePath
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      documentBuffer = Buffer.concat(chunks);
    } catch (error: any) {
      logger.error(`Failed to get document from MinIO: ${error.message}`);
      throw new BadRequestError('Impossible de recuperer le fichier du document');
    }

    // 4. Convert to PDF if DOCX
    const isDocx = generatedDoc.outputFilePath.toLowerCase().endsWith('.docx');
    if (isDocx) {
      documentBuffer = await this.convertDocxToPdf(documentBuffer);
    }

    // 5. Send to SendingBox
    try {
      const sendingBoxClient = getSendingBoxClient();
      const webhookUrl = `${config.urls.backend}/api/webhooks/sendingbox`;

      // Parse recipient name to first/last
      const nameParts = recipient.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      const shipment = await sendingBoxClient.createShipment(
        documentBuffer,
        `${generatedDoc.title}.pdf`,
        {
          documentId: generatedDoc.id,
          recipient: {
            firstName,
            lastName,
            address: recipient.address,
            postalCode: recipient.postalCode,
            city: recipient.city,
            country: recipient.country || 'FR',
          },
          sender: {
            firstName: user.firstName,
            lastName: user.lastName,
            address: cabinet.address || '',
            postalCode: cabinet.postalCode || '',
            city: cabinet.city || '',
            country: 'FR',
          },
          subject: generatedDoc.title,
          reference: generatedDoc.id,
          color: options.color ?? false,
          duplexPrinting: options.duplex ?? false,
          registeredMail: options.registered ?? true,
          webhookUrl,
        }
      );

      // 6. Update generated document with workflow status
      const workflowStatus = (generatedDoc.workflowStatus || {}) as Record<string, any>;
      workflowStatus.lrar = {
        letterId: shipment.id,
        status: 'PROCESSING',
        trackingNumber: shipment.trackingNumber,
        recipient: {
          name: recipient.name,
          address: recipient.address,
          postalCode: recipient.postalCode,
          city: recipient.city,
          country: recipient.country || 'FR',
        },
        options: {
          color: options.color ?? false,
          duplex: options.duplex ?? false,
          registered: options.registered ?? true,
        },
        cost: shipment.cost,
        createdAt: new Date().toISOString(),
        estimatedDelivery: shipment.estimatedDelivery?.toISOString(),
      };

      await prisma.generatedDocument.update({
        where: { id: generatedDoc.id },
        data: {
          workflowStatus: workflowStatus as Prisma.InputJsonValue,
        },
      });

      // 7. Create audit log
      await this.createAuditLog(cabinetId, userId, generatedDoc.id, 'LRAR_SENT', {
        documentTitle: generatedDoc.title,
        letterId: shipment.id,
        recipient: recipient.name,
      });

      logger.info(`[LRAR] Created shipment for document ${documentId}: ${shipment.id}`);

      return {
        letterId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: `${config.urls.frontend}/document-generation/documents/${documentId}?tab=lrar`,
        estimatedDelivery: shipment.estimatedDelivery,
        cost: shipment.cost,
      };
    } catch (error: any) {
      logger.error(`Failed to create SendingBox shipment: ${error.message}`);
      throw new BadRequestError(`Erreur lors de l'envoi LRAR: ${error.message}`);
    }
  }

  /**
   * Handle SendingBox webhook for generated documents
   */
  async handleGeneratedDocumentWebhook(payload: SendingboxWebhookPayload): Promise<void> {
    logger.info(`[Webhook] Processing generated document LRAR webhook: ${payload.shipmentId} -> ${payload.status}`);

    // Find generated document with this letter ID in workflowStatus
    const documents = await prisma.generatedDocument.findMany({
      where: {
        deletedAt: null,
        workflowStatus: {
          path: ['lrar', 'letterId'],
          equals: payload.shipmentId,
        },
      },
      include: {
        folder: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (documents.length === 0) {
      logger.warn(`[Webhook] No generated document found for letter: ${payload.shipmentId}`);
      return;
    }

    for (const document of documents) {
      const workflowStatus = (document.workflowStatus || {}) as Record<string, any>;
      const lrarStatus = workflowStatus.lrar || {};

      // Map webhook status
      const newStatus = this.mapLrarWebhookStatus(payload.status);
      lrarStatus.status = newStatus;

      if (payload.trackingNumber) {
        lrarStatus.trackingNumber = payload.trackingNumber;
      }

      // Add tracking event
      if (!lrarStatus.events) {
        lrarStatus.events = [];
      }
      if (payload.trackingEvent) {
        lrarStatus.events.push({
          date: payload.trackingEvent.timestamp,
          type: payload.trackingEvent.status,
          description: payload.trackingEvent.description,
          location: payload.trackingEvent.location,
        });
      }

      // Handle delivery - download and store AR
      if (newStatus === 'DELIVERED') {
        lrarStatus.deliveredAt = new Date().toISOString();

        // Store delivery proof (AR)
        await this.storeDeliveryProof(document, payload.shipmentId);
        lrarStatus.proofPath = `${document.cabinetId}/${document.folderId}/ar_${document.id}.pdf`;

        // Send notification email to user
        await this.sendDeliveryNotification(document);
      }

      if (newStatus === 'RETURNED') {
        lrarStatus.returnedAt = new Date().toISOString();
      }

      if (newStatus === 'SENT' && !lrarStatus.sentAt) {
        lrarStatus.sentAt = new Date().toISOString();
      }

      workflowStatus.lrar = lrarStatus;

      await prisma.generatedDocument.update({
        where: { id: document.id },
        data: {
          workflowStatus: workflowStatus as Prisma.InputJsonValue,
        },
      });

      // Create audit log
      const auditAction = newStatus === 'DELIVERED' ? 'LRAR_DELIVERED' :
                         newStatus === 'RETURNED' ? 'LRAR_RETURNED' : 'LRAR_UPDATED';

      await this.createAuditLog(
        document.cabinetId,
        document.createdById,
        document.id,
        auditAction,
        { status: newStatus, letterId: payload.shipmentId }
      );

      logger.info(`[Webhook] Document ${document.id} LRAR updated to ${newStatus}`);
    }
  }

  /**
   * Get LRAR tracking status for a generated document
   */
  async getTrackingStatus(
    documentId: string,
    cabinetId: string
  ): Promise<LrarTrackingResult | null> {
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document genere non trouve');
    }

    const workflowStatus = (document.workflowStatus || {}) as Record<string, any>;
    const lrarStatus = workflowStatus.lrar;

    if (!lrarStatus || !lrarStatus.letterId) {
      return null;
    }

    // Fetch real-time status from SendingBox
    try {
      const sendingBoxClient = getSendingBoxClient();
      const status = await sendingBoxClient.getShipmentStatus(lrarStatus.letterId);

      return {
        letterId: lrarStatus.letterId,
        status: status.status,
        trackingNumber: status.trackingNumber,
        events: status.trackingEvents.map(e => ({
          date: e.date,
          type: e.status,
          description: e.description,
          location: e.location,
        })),
        estimatedDelivery: lrarStatus.estimatedDelivery ? new Date(lrarStatus.estimatedDelivery) : undefined,
        deliveredAt: lrarStatus.deliveredAt ? new Date(lrarStatus.deliveredAt) : undefined,
        proofAvailable: !!lrarStatus.proofPath || status.status === 'DELIVERED',
      };
    } catch (error: any) {
      logger.warn(`Failed to get real-time tracking: ${error.message}`);

      // Return cached status from workflowStatus
      return {
        letterId: lrarStatus.letterId,
        status: lrarStatus.status,
        trackingNumber: lrarStatus.trackingNumber,
        events: lrarStatus.events || [],
        estimatedDelivery: lrarStatus.estimatedDelivery ? new Date(lrarStatus.estimatedDelivery) : undefined,
        deliveredAt: lrarStatus.deliveredAt ? new Date(lrarStatus.deliveredAt) : undefined,
        proofAvailable: !!lrarStatus.proofPath,
      };
    }
  }

  /**
   * Download delivery proof (AR) for a generated document
   */
  async downloadProof(
    documentId: string,
    cabinetId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundError('Document genere non trouve');
    }

    const workflowStatus = (document.workflowStatus || {}) as Record<string, any>;
    const lrarStatus = workflowStatus.lrar;

    if (!lrarStatus || !lrarStatus.letterId) {
      throw new BadRequestError('Aucun envoi LRAR pour ce document');
    }

    // If proof is stored locally
    if (lrarStatus.proofPath) {
      try {
        const stream = await minioClient.getObject(
          config.minio.buckets.documents,
          lrarStatus.proofPath
        );

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        return {
          buffer: Buffer.concat(chunks),
          filename: `AR_${document.title}.pdf`,
        };
      } catch (error) {
        logger.warn('Proof not found in storage, fetching from SendingBox');
      }
    }

    // Otherwise, fetch from SendingBox
    const sendingBoxClient = getSendingBoxClient();
    const buffer = await sendingBoxClient.downloadProof(lrarStatus.letterId);

    // Store for future use
    const proofPath = `${cabinetId}/${document.folderId}/ar_${documentId}.pdf`;
    await minioClient.putObject(
      config.minio.buckets.documents,
      proofPath,
      buffer,
      buffer.length,
      { 'Content-Type': 'application/pdf' }
    );

    // Update workflowStatus with proof path
    lrarStatus.proofPath = proofPath;
    workflowStatus.lrar = lrarStatus;
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        workflowStatus: workflowStatus as Prisma.InputJsonValue,
      },
    });

    return {
      buffer,
      filename: `AR_${document.title}.pdf`,
    };
  }

  /**
   * Store delivery proof from SendingBox
   */
  private async storeDeliveryProof(
    document: { id: string; cabinetId: string; folderId: string },
    letterId: string
  ): Promise<void> {
    try {
      const sendingBoxClient = getSendingBoxClient();
      const proof = await sendingBoxClient.downloadProof(letterId);
      const proofPath = `${document.cabinetId}/${document.folderId}/ar_${document.id}.pdf`;

      await minioClient.putObject(
        config.minio.buckets.documents,
        proofPath,
        proof,
        proof.length,
        { 'Content-Type': 'application/pdf' }
      );

      logger.info(`[LRAR] Stored delivery proof for ${document.id}`);
    } catch (error: any) {
      logger.error(`[LRAR] Failed to store delivery proof: ${error.message}`);
    }
  }

  /**
   * Send delivery notification email
   */
  private async sendDeliveryNotification(
    document: { id: string; title: string; createdBy: { email: string; firstName: string } }
  ): Promise<void> {
    try {
      // TODO: Implement email sending
      logger.info(`[LRAR] Would send delivery notification to ${document.createdBy.email} for ${document.title}`);
    } catch (error: any) {
      logger.error(`[LRAR] Failed to send delivery notification: ${error.message}`);
    }
  }

  /**
   * Convert DOCX to PDF using LibreOffice
   */
  private async convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lrar-convert-'));
    const inputPath = path.join(tempDir, 'input.docx');
    const outputPath = path.join(tempDir, 'input.pdf');

    try {
      await fs.writeFile(inputPath, docxBuffer);

      await execAsync(
        `libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${inputPath}"`
      );

      const pdfBuffer = await fs.readFile(outputPath);
      return pdfBuffer;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private mapLrarWebhookStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'PENDING',
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'printed': 'PROCESSING',
      'letter_printed': 'PROCESSING',
      'sent': 'SENT',
      'letter_sent': 'SENT',
      'in_transit': 'IN_TRANSIT',
      'out_for_delivery': 'IN_TRANSIT',
      'delivered': 'DELIVERED',
      'letter_delivered': 'DELIVERED',
      'returned': 'RETURNED',
      'letter_returned': 'RETURNED',
      'failed': 'ERROR',
      'cancelled': 'CANCELLED',
    };

    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  private async createAuditLog(
    cabinetId: string,
    userId: string,
    entityId: string,
    action: string,
    details: Record<string, any>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          cabinetId,
          userId,
          action: action as any,
          entity: 'GeneratedDocument',
          entityId,
          details,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const lrarService = new LrarService();
export const generatedDocumentLrarService = new GeneratedDocumentLrarService();
