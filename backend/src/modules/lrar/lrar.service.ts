import { prisma } from '@/config/database';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { LrarStatus, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { downloadFromMinio } from '@/modules/documents/upload.middleware';
import { getSendingBoxClient, type Recipient } from './sendingbox.client';
import type {
  CreateLrarInput,
  ListLrarInput,
  LrarShipmentResponse,
  SendingboxWebhookPayload,
} from './lrar.schemas';

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

export const lrarService = new LrarService();
