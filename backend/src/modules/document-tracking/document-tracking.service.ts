import { prisma } from '@/config/database';
import {
  DocumentTrackingStatus,
  DeliveryMethod,
  TrackingSignatureStatus,
  TrackingLrarStatus,
  ReminderFrequency,
  Prisma,
} from '@prisma/client';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { logger } from '@/utils/logger';

interface Signatory {
  name: string;
  email: string;
  phone?: string;
  order?: number;
}

interface SendForSignatureInput {
  documentId: string;
  signatories: Signatory[];
  message?: string;
  deadline?: Date;
  autoReminders?: boolean;
  reminderFrequency?: ReminderFrequency;
  maxReminders?: number;
}

interface SendLrarInput {
  documentId: string;
  recipient: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country?: string;
  };
  options?: {
    withAR?: boolean;
    priority?: boolean;
  };
}

interface TrackingRecipient {
  name: string;
  email: string;
  status: 'PENDING' | 'SIGNED' | 'REFUSED';
  signedAt?: string;
  order?: number;
}

export class DocumentTrackingService {
  /**
   * Get tracking for a document
   */
  async getTracking(documentId: string, cabinetId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
      include: {
        tracking: true,
        signatureTransactions: {
          include: { signatories: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        lrarShipments: {
          include: { trackingEvents: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    return {
      document,
      tracking: document.tracking,
      latestSignature: document.signatureTransactions[0] || null,
      latestLrar: document.lrarShipments[0] || null,
    };
  }

  /**
   * Get or create tracking for a document
   */
  async getOrCreateTracking(documentId: string, cabinetId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
      include: { tracking: true },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    if (document.tracking) {
      return document.tracking;
    }

    // Create new tracking
    return prisma.documentTracking.create({
      data: {
        documentId,
        status: DocumentTrackingStatus.DRAFT,
      },
    });
  }

  /**
   * Send document for electronic signature
   */
  async sendForSignature(cabinetId: string, userId: string, input: SendForSignatureInput) {
    const {
      documentId,
      signatories,
      message,
      deadline,
      autoReminders = true,
      reminderFrequency = ReminderFrequency.DAILY,
      maxReminders = 5,
    } = input;

    // Verify document exists and belongs to cabinet
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
      include: { tracking: true },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    // Check if already sent for signature
    if (document.tracking?.status === DocumentTrackingStatus.PENDING_SIGNATURE) {
      throw new BadRequestError('Document deja envoye pour signature');
    }

    // Validate signatories
    if (!signatories || signatories.length === 0) {
      throw new BadRequestError('Au moins un signataire requis');
    }

    for (const sig of signatories) {
      if (!sig.name || !sig.email) {
        throw new BadRequestError('Nom et email requis pour chaque signataire');
      }
    }

    // Create signature transaction (using existing model)
    const signatureTransaction = await prisma.signatureTransaction.create({
      data: {
        cabinetId,
        documentId,
        initiatorId: userId,
        title: document.title,
        description: message,
        status: 'PENDING',
        expiresAt: deadline,
        signatories: {
          create: signatories.map((sig, idx) => ({
            firstName: sig.name.split(' ')[0] || sig.name,
            lastName: sig.name.split(' ').slice(1).join(' ') || '',
            email: sig.email,
            phone: sig.phone,
            signOrder: sig.order || idx + 1,
            status: 'PENDING',
          })),
        },
      },
      include: { signatories: true },
    });

    // Calculate next reminder time
    const nextReminderAt = autoReminders
      ? this.calculateNextReminderTime(reminderFrequency)
      : null;

    // Create or update tracking
    const recipients: TrackingRecipient[] = signatories.map((sig, idx) => ({
      name: sig.name,
      email: sig.email,
      status: 'PENDING' as const,
      order: sig.order || idx + 1,
    }));

    const tracking = await prisma.documentTracking.upsert({
      where: { documentId },
      create: {
        documentId,
        status: DocumentTrackingStatus.PENDING_SIGNATURE,
        deliveryMethod: DeliveryMethod.SIGNATURE_ELECTRONIQUE,
        signatureRequestId: signatureTransaction.id,
        signatureStatus: TrackingSignatureStatus.PENDING,
        expiresAt: deadline,
        autoRemindersEnabled: autoReminders,
        reminderFrequency,
        maxReminders,
        nextReminderAt,
        customMessage: message,
        recipients: recipients as unknown as Prisma.InputJsonValue,
      },
      update: {
        status: DocumentTrackingStatus.PENDING_SIGNATURE,
        deliveryMethod: DeliveryMethod.SIGNATURE_ELECTRONIQUE,
        signatureRequestId: signatureTransaction.id,
        signatureStatus: TrackingSignatureStatus.PENDING,
        expiresAt: deadline,
        autoRemindersEnabled: autoReminders,
        reminderFrequency,
        maxReminders,
        nextReminderAt,
        reminderCount: 0,
        lastReminderAt: null,
        customMessage: message,
        recipients: recipients as unknown as Prisma.InputJsonValue,
      },
    });

    logger.info(`Document ${documentId} sent for signature, transaction ${signatureTransaction.id}`);

    return {
      tracking,
      signatureTransaction,
    };
  }

  /**
   * Send document via LRAR
   */
  async sendLrar(cabinetId: string, userId: string, input: SendLrarInput) {
    const { documentId, recipient, options = {} } = input;

    // Verify document exists
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
      include: { tracking: true },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    // Validate recipient
    if (!recipient.name || !recipient.address || !recipient.postalCode || !recipient.city) {
      throw new BadRequestError('Informations destinataire incompletes');
    }

    // Get cabinet info for sender
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
    });

    if (!cabinet) {
      throw new NotFoundError('Cabinet non trouve');
    }

    // Create LRAR shipment (using existing model)
    const lrarShipment = await prisma.lrarShipment.create({
      data: {
        cabinetId,
        documentId,
        initiatorId: userId,
        subject: document.title,
        status: 'PENDING',
        recipientFirstName: recipient.name.split(' ')[0] || recipient.name,
        recipientLastName: recipient.name.split(' ').slice(1).join(' ') || '',
        recipientAddress: recipient.address,
        recipientPostalCode: recipient.postalCode,
        recipientCity: recipient.city,
        recipientCountry: recipient.country || 'FR',
        senderFirstName: cabinet.name,
        senderLastName: '',
        senderAddress: cabinet.address || '',
        senderPostalCode: cabinet.postalCode || '',
        senderCity: cabinet.city || '',
        color: options.priority || false,
        registeredMail: true,
      },
    });

    // Create or update tracking
    const tracking = await prisma.documentTracking.upsert({
      where: { documentId },
      create: {
        documentId,
        status: DocumentTrackingStatus.PENDING_DELIVERY,
        deliveryMethod: DeliveryMethod.LRAR,
        lrarRequestId: lrarShipment.id,
        lrarStatus: TrackingLrarStatus.PENDING,
        sentAt: new Date(),
        recipients: [
          {
            name: recipient.name,
            address: recipient.address,
            postalCode: recipient.postalCode,
            city: recipient.city,
          },
        ] as unknown as Prisma.InputJsonValue,
      },
      update: {
        status: DocumentTrackingStatus.PENDING_DELIVERY,
        deliveryMethod: DeliveryMethod.LRAR,
        lrarRequestId: lrarShipment.id,
        lrarStatus: TrackingLrarStatus.PENDING,
        sentAt: new Date(),
        recipients: [
          {
            name: recipient.name,
            address: recipient.address,
            postalCode: recipient.postalCode,
            city: recipient.city,
          },
        ] as unknown as Prisma.InputJsonValue,
      },
    });

    logger.info(`Document ${documentId} sent via LRAR, shipment ${lrarShipment.id}`);

    return {
      tracking,
      lrarShipment,
    };
  }

  /**
   * Send manual reminder for a document
   */
  async sendReminder(documentId: string, cabinetId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
      include: {
        tracking: true,
        signatureTransactions: {
          include: { signatories: { where: { status: 'PENDING' } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    if (!document.tracking || document.tracking.status !== DocumentTrackingStatus.PENDING_SIGNATURE) {
      throw new BadRequestError('Document non en attente de signature');
    }

    const pendingSignatories = document.signatureTransactions[0]?.signatories || [];
    if (pendingSignatories.length === 0) {
      throw new BadRequestError('Aucun signataire en attente');
    }

    // Update tracking
    await prisma.documentTracking.update({
      where: { id: document.tracking.id },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
        nextReminderAt: this.calculateNextReminderTime(document.tracking.reminderFrequency),
      },
    });

    // TODO: Send actual reminder emails via email service
    logger.info(`Manual reminder sent for document ${documentId} to ${pendingSignatories.length} signatories`);

    return {
      success: true,
      remindersSent: pendingSignatories.length,
      signatories: pendingSignatories.map((s) => ({ email: s.email, name: `${s.firstName} ${s.lastName}` })),
    };
  }

  /**
   * Cancel signature request
   */
  async cancelSignature(documentId: string, cabinetId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, cabinetId, deletedAt: null },
      include: { tracking: true },
    });

    if (!document) {
      throw new NotFoundError('Document non trouve');
    }

    if (!document.tracking || document.tracking.status !== DocumentTrackingStatus.PENDING_SIGNATURE) {
      throw new BadRequestError('Aucune signature en cours');
    }

    // Update signature transaction
    if (document.tracking.signatureRequestId) {
      await prisma.signatureTransaction.update({
        where: { id: document.tracking.signatureRequestId },
        data: { status: 'CANCELLED' },
      });
    }

    // Update tracking
    await prisma.documentTracking.update({
      where: { id: document.tracking.id },
      data: {
        status: DocumentTrackingStatus.CANCELLED,
        signatureStatus: TrackingSignatureStatus.CANCELLED,
        autoRemindersEnabled: false,
        nextReminderAt: null,
      },
    });

    logger.info(`Signature cancelled for document ${documentId}`);

    return { success: true };
  }

  /**
   * Update signature status (called by webhook or manually)
   */
  async updateSignatureStatus(
    signatureRequestId: string,
    status: TrackingSignatureStatus,
    signatoryUpdates?: { email: string; status: 'SIGNED' | 'PENDING' | 'REFUSED'; signedAt?: Date }[]
  ) {
    const tracking = await prisma.documentTracking.findFirst({
      where: { signatureRequestId },
    });

    if (!tracking) {
      logger.warn(`Tracking not found for signature request ${signatureRequestId}`);
      return null;
    }

    // Update recipient statuses
    let recipients = (tracking.recipients || []) as unknown as TrackingRecipient[];
    if (signatoryUpdates) {
      recipients = recipients.map((r) => {
        const update = signatoryUpdates.find((u) => u.email === r.email);
        if (update) {
          return {
            ...r,
            status: update.status,
            signedAt: update.signedAt?.toISOString(),
          };
        }
        return r;
      });
    }

    // Determine overall status
    const allSigned = recipients.every((r) => r.status === 'SIGNED');
    const someSigned = recipients.some((r) => r.status === 'SIGNED');
    const signedBy = recipients.filter((r) => r.status === 'SIGNED').map((r) => r.email);

    let documentStatus: DocumentTrackingStatus;
    if (status === TrackingSignatureStatus.COMPLETED || allSigned) {
      documentStatus = DocumentTrackingStatus.SIGNED;
    } else if (status === TrackingSignatureStatus.CANCELLED) {
      documentStatus = DocumentTrackingStatus.CANCELLED;
    } else if (status === TrackingSignatureStatus.EXPIRED) {
      documentStatus = DocumentTrackingStatus.EXPIRED;
    } else if (someSigned) {
      documentStatus = DocumentTrackingStatus.PARTIALLY_SIGNED;
    } else {
      documentStatus = DocumentTrackingStatus.PENDING_SIGNATURE;
    }

    await prisma.documentTracking.update({
      where: { id: tracking.id },
      data: {
        status: documentStatus,
        signatureStatus: status,
        signedAt: allSigned ? new Date() : null,
        signedBy,
        autoRemindersEnabled: allSigned || status === TrackingSignatureStatus.CANCELLED ? false : tracking.autoRemindersEnabled,
        nextReminderAt: allSigned || status === TrackingSignatureStatus.CANCELLED ? null : tracking.nextReminderAt,
        recipients: recipients as unknown as Prisma.InputJsonValue,
      },
    });

    logger.info(`Signature status updated for tracking ${tracking.id}: ${status}`);

    return tracking;
  }

  /**
   * Update LRAR status (called by webhook or manually)
   */
  async updateLrarStatus(
    lrarRequestId: string,
    status: TrackingLrarStatus,
    trackingNumber?: string,
    deliveredAt?: Date
  ) {
    const tracking = await prisma.documentTracking.findFirst({
      where: { lrarRequestId },
    });

    if (!tracking) {
      logger.warn(`Tracking not found for LRAR request ${lrarRequestId}`);
      return null;
    }

    let documentStatus: DocumentTrackingStatus;
    switch (status) {
      case TrackingLrarStatus.DELIVERED:
        documentStatus = DocumentTrackingStatus.DELIVERED;
        break;
      case TrackingLrarStatus.FAILED:
      case TrackingLrarStatus.RETURNED:
        documentStatus = DocumentTrackingStatus.FAILED;
        break;
      default:
        documentStatus = DocumentTrackingStatus.PENDING_DELIVERY;
    }

    await prisma.documentTracking.update({
      where: { id: tracking.id },
      data: {
        status: documentStatus,
        lrarStatus: status,
        lrarTrackingNumber: trackingNumber || tracking.lrarTrackingNumber,
        deliveredAt: deliveredAt || tracking.deliveredAt,
      },
    });

    logger.info(`LRAR status updated for tracking ${tracking.id}: ${status}`);

    return tracking;
  }

  /**
   * Get documents pending reminders
   */
  async getDocumentsPendingReminders() {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return prisma.documentTracking.findMany({
      where: {
        status: DocumentTrackingStatus.PENDING_SIGNATURE,
        autoRemindersEnabled: true,
        nextReminderAt: {
          lte: oneHourFromNow,
        },
        OR: [
          { maxReminders: { gt: 0 } },
          { reminderCount: { lt: prisma.documentTracking.fields.maxReminders } },
        ],
      },
      include: {
        document: {
          include: {
            signatureTransactions: {
              include: {
                signatories: {
                  where: { status: 'PENDING' },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  /**
   * Process reminder for a tracking record
   */
  async processReminder(trackingId: string) {
    const tracking = await prisma.documentTracking.findUnique({
      where: { id: trackingId },
      include: {
        document: {
          include: {
            signatureTransactions: {
              include: { signatories: { where: { status: 'PENDING' } } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!tracking) return null;

    // Check if max reminders reached
    if (tracking.reminderCount >= tracking.maxReminders) {
      await prisma.documentTracking.update({
        where: { id: trackingId },
        data: {
          autoRemindersEnabled: false,
          nextReminderAt: null,
        },
      });
      logger.info(`Max reminders reached for tracking ${trackingId}`);
      return null;
    }

    const pendingSignatories = tracking.document.signatureTransactions[0]?.signatories || [];
    if (pendingSignatories.length === 0) {
      return null;
    }

    // TODO: Send actual reminder emails
    // await emailService.sendSignatureReminder(...)

    // Update tracking
    await prisma.documentTracking.update({
      where: { id: trackingId },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
        nextReminderAt: this.calculateNextReminderTime(tracking.reminderFrequency),
      },
    });

    logger.info(`Reminder processed for tracking ${trackingId}, sent to ${pendingSignatories.length} signatories`);

    return {
      trackingId,
      remindersSent: pendingSignatories.length,
    };
  }

  /**
   * List all trackings for a cabinet
   */
  async listTrackings(
    cabinetId: string,
    filters: {
      status?: DocumentTrackingStatus;
      deliveryMethod?: DeliveryMethod;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, deliveryMethod, page = 1, limit = 20 } = filters;

    const where: Prisma.DocumentTrackingWhereInput = {
      document: { cabinetId, deletedAt: null },
    };

    if (status) where.status = status;
    if (deliveryMethod) where.deliveryMethod = deliveryMethod;

    const [trackings, total] = await Promise.all([
      prisma.documentTracking.findMany({
        where,
        include: {
          document: {
            select: {
              id: true,
              title: true,
              filename: true,
              type: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.documentTracking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: trackings,
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
   * Get tracking statistics
   */
  async getStats(cabinetId: string) {
    const [
      totalDocuments,
      pendingSignatures,
      signed,
      pendingDelivery,
      delivered,
      expired,
    ] = await Promise.all([
      prisma.documentTracking.count({
        where: { document: { cabinetId, deletedAt: null } },
      }),
      prisma.documentTracking.count({
        where: {
          document: { cabinetId, deletedAt: null },
          status: DocumentTrackingStatus.PENDING_SIGNATURE,
        },
      }),
      prisma.documentTracking.count({
        where: {
          document: { cabinetId, deletedAt: null },
          status: DocumentTrackingStatus.SIGNED,
        },
      }),
      prisma.documentTracking.count({
        where: {
          document: { cabinetId, deletedAt: null },
          status: DocumentTrackingStatus.PENDING_DELIVERY,
        },
      }),
      prisma.documentTracking.count({
        where: {
          document: { cabinetId, deletedAt: null },
          status: DocumentTrackingStatus.DELIVERED,
        },
      }),
      prisma.documentTracking.count({
        where: {
          document: { cabinetId, deletedAt: null },
          status: DocumentTrackingStatus.EXPIRED,
        },
      }),
    ]);

    return {
      totalDocuments,
      pendingSignatures,
      signed,
      pendingDelivery,
      delivered,
      expired,
    };
  }

  /**
   * Calculate next reminder time based on frequency
   */
  private calculateNextReminderTime(frequency: ReminderFrequency): Date {
    const now = new Date();
    switch (frequency) {
      case ReminderFrequency.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case ReminderFrequency.EVERY_2_DAYS:
        return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      case ReminderFrequency.EVERY_3_DAYS:
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case ReminderFrequency.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}

export const documentTrackingService = new DocumentTrackingService();
