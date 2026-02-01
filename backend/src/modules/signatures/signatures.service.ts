import { prisma } from '@/config/database';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { SignatureStatus, SignatoryStatus, GeneratedDocumentStatus, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { downloadFromMinio } from '@/modules/documents/upload.middleware';
import { getUniversignClient, type Signatory } from './universign.client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type {
  CreateSignatureInput,
  ListSignaturesInput,
  SignatureTransactionResponse,
  UniversignWebhookPayload,
} from './signatures.schemas';

const execAsync = promisify(exec);

// Signatory input for generated document signature
export interface GeneratedDocumentSignatory {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'client' | 'avocat' | 'partie_adverse' | 'temoin' | 'autre';
}

// Signature request result
export interface SignatureRequestResult {
  transactionId: string;
  signers: Array<{
    email: string;
    signUrl: string;
    status: string;
  }>;
  expiresAt: Date;
}

export class SignaturesService {
  /**
   * Create a new signature transaction
   */
  async createSignature(
    cabinetId: string,
    userId: string,
    input: CreateSignatureInput
  ): Promise<SignatureTransactionResponse> {
    // 1. Verify document exists and belongs to cabinet
    const document = await prisma.document.findFirst({
      where: { id: input.documentId, cabinetId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundError('Document non trouvé');
    }

    if (document.mimeType !== 'application/pdf') {
      throw new BadRequestError('Seuls les documents PDF peuvent être signés');
    }

    // 2. Create transaction in DB first (pending)
    const transaction = await prisma.signatureTransaction.create({
      data: {
        cabinetId,
        documentId: input.documentId,
        initiatorId: userId,
        title: input.title,
        description: input.description,
        profile: input.profile,
        language: input.language,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        status: SignatureStatus.PENDING,
        signatories: {
          create: input.signatories.map((s, index) => ({
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone,
            signOrder: index + 1,
            status: SignatoryStatus.PENDING,
          })),
        },
      },
      include: {
        document: { select: { id: true, title: true, mimeType: true } },
        initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
        signatories: true,
      },
    });

    // 3. Download document from MinIO
    if (!document.encryptionKey) {
      throw new BadRequestError('Clé de chiffrement du document manquante');
    }

    const { buffer } = await downloadFromMinio(document.minioPath, document.encryptionKey);

    // 4. Send to Universign
    try {
      const universignClient = getUniversignClient();
      const webhookUrl = `${config.urls.backend}/api/webhooks/universign`;

      const universignTransaction = await universignClient.createTransaction(
        buffer,
        `${document.title}.pdf`,
        {
          documentId: transaction.id,
          signatories: input.signatories as Signatory[],
          title: input.title,
          description: input.description,
          profile: input.profile.toLowerCase() as 'default' | 'certified' | 'advanced',
          language: input.language as 'fr' | 'en',
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          webhookUrl,
        }
      );

      // 5. Update transaction with Universign data
      const updated = await prisma.signatureTransaction.update({
        where: { id: transaction.id },
        data: {
          universignId: universignTransaction.id,
          status: SignatureStatus.IN_PROGRESS,
          expiresAt: universignTransaction.expiresAt,
          signatories: {
            updateMany: universignTransaction.signers.map((signer) => ({
              where: { email: signer.email },
              data: { signUrl: signer.url },
            })),
          },
        },
        include: {
          document: { select: { id: true, title: true, mimeType: true } },
          initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
          signatories: { orderBy: { signOrder: 'asc' } },
        },
      });

      // 6. Audit log
      await this.createAuditLog(cabinetId, userId, transaction.id, 'SIGNATURE_CREATED', {
        title: input.title,
        documentId: input.documentId,
        signatoryCount: input.signatories.length,
      });

      return this.formatTransaction(updated);
    } catch (error: any) {
      // Mark transaction as error if Universign fails
      await prisma.signatureTransaction.update({
        where: { id: transaction.id },
        data: { status: SignatureStatus.ERROR },
      });

      logger.error('Failed to create Universign transaction:', error);
      throw new BadRequestError(`Erreur lors de la création de la signature: ${error.message}`);
    }
  }

  /**
   * Create signature request from a generated document
   * Handles DOCX to PDF conversion and Universign transaction creation
   */
  async createSignatureRequestFromDocument(
    documentId: string,
    cabinetId: string,
    userId: string,
    signatories: GeneratedDocumentSignatory[],
    options?: {
      signingOrder?: 'sequential' | 'parallel';
      customMessage?: string;
      profile?: 'default' | 'certified' | 'advanced';
    }
  ): Promise<SignatureRequestResult> {
    // 1. Load generated document from DB
    const generatedDoc = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        cabinetId,
        deletedAt: null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
            workflowConfig: true,
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

    if (!generatedDoc) {
      throw new NotFoundError('Document genere non trouve');
    }

    if (generatedDoc.status !== GeneratedDocumentStatus.FINALIZED) {
      throw new BadRequestError('Le document doit etre finalise avant envoi en signature');
    }

    if (!generatedDoc.outputFilePath) {
      throw new BadRequestError('Le fichier du document n\'est pas disponible');
    }

    // 2. Get document file from MinIO
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
      logger.error(`Failed to fetch document from MinIO: ${error.message}`);
      throw new BadRequestError('Impossible de recuperer le fichier du document');
    }

    // 3. Convert DOCX to PDF if needed
    let pdfBuffer: Buffer;
    const isDocx = generatedDoc.outputFilePath.toLowerCase().endsWith('.docx');

    if (isDocx) {
      try {
        pdfBuffer = await this.convertDocxToPdf(documentBuffer);
        logger.info(`[Signature] Converted DOCX to PDF for document ${documentId}`);
      } catch (error: any) {
        logger.error(`DOCX to PDF conversion failed: ${error.message}`);
        throw new BadRequestError('Erreur lors de la conversion du document en PDF');
      }
    } else {
      pdfBuffer = documentBuffer;
    }

    // 4. Create Universign transaction
    const universignClient = getUniversignClient();
    const webhookUrl = `${config.urls.backend}/api/webhooks/universign`;
    const profile = options?.profile || 'default';

    try {
      const transaction = await universignClient.createTransaction(
        pdfBuffer,
        `${generatedDoc.title}.pdf`,
        {
          documentId: generatedDoc.id,
          signatories: signatories.map((s) => ({
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone,
          })),
          title: generatedDoc.title,
          description: options?.customMessage || `Signature du document "${generatedDoc.title}"`,
          profile,
          language: 'fr',
          successUrl: `${config.urls.frontend}/document-generation/documents/${generatedDoc.id}?signed=true`,
          cancelUrl: `${config.urls.frontend}/document-generation/documents/${generatedDoc.id}?signed=false`,
          webhookUrl,
        }
      );

      // 5. Update generated document with workflow status
      const workflowStatus = (generatedDoc.workflowStatus || {}) as Record<string, any>;
      workflowStatus.signature = {
        transactionId: transaction.id,
        status: 'PENDING',
        signatories: signatories.map((s) => ({
          email: s.email,
          role: s.role,
          status: 'PENDING',
        })),
        createdAt: new Date().toISOString(),
        profile,
        signingOrder: options?.signingOrder || 'sequential',
      };

      await prisma.generatedDocument.update({
        where: { id: generatedDoc.id },
        data: {
          status: GeneratedDocumentStatus.SENT,
          workflowStatus: workflowStatus as Prisma.InputJsonValue,
          sentAt: new Date(),
        },
      });

      // 6. Create audit log
      await this.createAuditLog(cabinetId, userId, generatedDoc.id, 'SIGNATURE_REQUEST_CREATED', {
        documentTitle: generatedDoc.title,
        transactionId: transaction.id,
        signatoryCount: signatories.length,
      });

      logger.info(`[Signature] Created signature request for document ${documentId}: ${transaction.id}`);

      return {
        transactionId: transaction.id,
        signers: transaction.signers.map((signer) => ({
          email: signer.email,
          signUrl: signer.url,
          status: signer.status,
        })),
        expiresAt: transaction.expiresAt,
      };
    } catch (error: any) {
      logger.error(`Failed to create Universign transaction: ${error.message}`);
      throw new BadRequestError(`Erreur lors de la creation de la demande de signature: ${error.message}`);
    }
  }

  /**
   * Handle Universign webhook specifically for generated documents
   * Called when signature status changes
   */
  async handleGeneratedDocumentWebhook(payload: UniversignWebhookPayload): Promise<void> {
    logger.info(`[Webhook] Processing generated document webhook: ${payload.transactionId} -> ${payload.status}`);

    // Find generated document with this transaction ID in workflowStatus
    const documents = await prisma.generatedDocument.findMany({
      where: {
        deletedAt: null,
        workflowStatus: {
          path: ['signature', 'transactionId'],
          equals: payload.transactionId,
        },
      },
      include: {
        folder: { select: { id: true, name: true } },
      },
    });

    if (documents.length === 0) {
      logger.warn(`[Webhook] No generated document found for transaction: ${payload.transactionId}`);
      return;
    }

    for (const document of documents) {
      const workflowStatus = (document.workflowStatus || {}) as Record<string, any>;
      const signatureStatus = workflowStatus.signature || {};

      // Update signer statuses
      if (payload.signers) {
        signatureStatus.signatories = signatureStatus.signatories?.map((s: any) => {
          const payloadSigner = payload.signers?.find((ps) => ps.email === s.email);
          if (payloadSigner) {
            return {
              ...s,
              status: this.mapSignatoryStatus(payloadSigner.status),
              signedAt: payloadSigner.signedAt,
              refusedAt: payloadSigner.refusedAt,
              refusedReason: payloadSigner.refusedReason,
            };
          }
          return s;
        }) || [];
      }

      // Update overall signature status
      signatureStatus.status = this.mapWebhookStatus(payload.status);
      signatureStatus.updatedAt = new Date().toISOString();

      let documentStatus = document.status;
      let signedAt: Date | undefined;

      // Handle completed signature
      if (payload.status.toLowerCase() === 'completed') {
        documentStatus = GeneratedDocumentStatus.SIGNED;
        signedAt = new Date();
        signatureStatus.completedAt = signedAt.toISOString();

        // Download and store signed document
        await this.storeSignedGeneratedDocument(document, payload.transactionId);
      }

      // Handle refused/expired
      if (['refused', 'expired', 'cancelled', 'canceled'].includes(payload.status.toLowerCase())) {
        documentStatus = GeneratedDocumentStatus.FINALIZED; // Revert to finalized
        signatureStatus.failedAt = new Date().toISOString();
        signatureStatus.failureReason = payload.status;
      }

      workflowStatus.signature = signatureStatus;

      // Update document
      await prisma.generatedDocument.update({
        where: { id: document.id },
        data: {
          status: documentStatus,
          workflowStatus: workflowStatus as Prisma.InputJsonValue,
          signedAt,
        },
      });

      // Create audit log
      await this.createAuditLog(
        document.cabinetId,
        document.createdById,
        document.id,
        payload.status.toLowerCase() === 'completed'
          ? 'DOCUMENT_SIGNATURE_COMPLETED'
          : 'DOCUMENT_SIGNATURE_UPDATED',
        { status: payload.status, transactionId: payload.transactionId }
      );

      logger.info(`[Webhook] Updated generated document ${document.id} signature status to ${payload.status}`);
    }
  }

  /**
   * Store signed document from Universign to MinIO
   */
  private async storeSignedGeneratedDocument(
    document: { id: string; cabinetId: string; folderId: string; title: string },
    transactionId: string
  ): Promise<void> {
    try {
      const universignClient = getUniversignClient();

      // Download signed document
      const signedDoc = await universignClient.downloadSignedDocument(transactionId);

      // Generate storage path: /documents/{cabinetId}/{folderId}/signed_{filename}.pdf
      const sanitizedTitle = document.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const signedPath = `${document.cabinetId}/${document.folderId}/signed_${sanitizedTitle}_${Date.now()}.pdf`;

      await minioClient.putObject(
        config.minio.buckets.documents,
        signedPath,
        signedDoc,
        signedDoc.length,
        { 'Content-Type': 'application/pdf' }
      );

      // Download and store certificates
      const certificates = await universignClient.downloadCertificates(transactionId);
      const certPath = `${document.cabinetId}/${document.folderId}/certificates_${sanitizedTitle}_${Date.now()}.pdf`;

      await minioClient.putObject(
        config.minio.buckets.documents,
        certPath,
        certificates,
        certificates.length,
        { 'Content-Type': 'application/pdf' }
      );

      // Update document with signed file path
      const workflowStatus = (await prisma.generatedDocument.findUnique({
        where: { id: document.id },
        select: { workflowStatus: true },
      }))?.workflowStatus as Record<string, any> || {};

      workflowStatus.signature = {
        ...workflowStatus.signature,
        signedDocumentPath: signedPath,
        certificatesPath: certPath,
      };

      await prisma.generatedDocument.update({
        where: { id: document.id },
        data: {
          workflowStatus: workflowStatus as Prisma.InputJsonValue,
        },
      });

      logger.info(`[Signature] Stored signed document for ${document.id} at ${signedPath}`);
    } catch (error: any) {
      logger.error(`[Signature] Failed to store signed document: ${error.message}`);
    }
  }

  /**
   * Convert DOCX to PDF using LibreOffice
   */
  private async convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexdoc-convert-'));
    const inputPath = path.join(tempDir, 'input.docx');
    const outputPath = path.join(tempDir, 'input.pdf');

    try {
      // Write DOCX to temp file
      await fs.writeFile(inputPath, docxBuffer);

      // Convert using LibreOffice
      await execAsync(
        `libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${inputPath}"`,
        { timeout: 60000 }
      );

      // Read the PDF
      const pdfBuffer = await fs.readFile(outputPath);

      return pdfBuffer;
    } finally {
      // Cleanup temp files
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get signature transaction by ID
   */
  async getSignature(id: string, cabinetId: string): Promise<SignatureTransactionResponse> {
    const transaction = await prisma.signatureTransaction.findFirst({
      where: { id, cabinetId, deletedAt: null },
      include: {
        document: { select: { id: true, title: true, mimeType: true } },
        initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
        signatories: { orderBy: { signOrder: 'asc' } },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction de signature non trouvée');
    }

    return this.formatTransaction(transaction);
  }

  /**
   * List signature transactions
   */
  async listSignatures(cabinetId: string, query: ListSignaturesInput) {
    const { page, limit, status, documentId, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SignatureTransactionWhereInput = {
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
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { signatories: { some: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.signatureTransaction.findMany({
        where,
        include: {
          document: { select: { id: true, title: true, mimeType: true } },
          initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
          signatories: { orderBy: { signOrder: 'asc' } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.signatureTransaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions.map(this.formatTransaction),
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
   * Cancel signature transaction
   */
  async cancelSignature(id: string, cabinetId: string, userId: string): Promise<void> {
    const transaction = await prisma.signatureTransaction.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction de signature non trouvée');
    }

    if (transaction.status === SignatureStatus.COMPLETED) {
      throw new BadRequestError('Impossible d\'annuler une signature complétée');
    }

    if (transaction.status === SignatureStatus.CANCELLED) {
      throw new BadRequestError('Cette signature est déjà annulée');
    }

    // Cancel on Universign if transaction exists
    if (transaction.universignId) {
      try {
        const universignClient = getUniversignClient();
        await universignClient.cancelTransaction(transaction.universignId);
      } catch (error: any) {
        logger.warn(`Failed to cancel on Universign: ${error.message}`);
      }
    }

    // Update status in DB
    await prisma.signatureTransaction.update({
      where: { id },
      data: { status: SignatureStatus.CANCELLED },
    });

    await this.createAuditLog(cabinetId, userId, id, 'SIGNATURE_CANCELLED', {
      title: transaction.title,
    });
  }

  /**
   * Remind signatory
   */
  async remindSigner(
    id: string,
    cabinetId: string,
    userId: string,
    signerEmail: string
  ): Promise<void> {
    const transaction = await prisma.signatureTransaction.findFirst({
      where: { id, cabinetId, deletedAt: null },
      include: { signatories: true },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction de signature non trouvée');
    }

    if (transaction.status !== SignatureStatus.IN_PROGRESS) {
      throw new BadRequestError('La signature n\'est pas en cours');
    }

    const signatory = transaction.signatories.find((s) => s.email === signerEmail);
    if (!signatory) {
      throw new NotFoundError('Signataire non trouvé');
    }

    if (signatory.status === SignatoryStatus.SIGNED) {
      throw new BadRequestError('Ce signataire a déjà signé');
    }

    if (transaction.universignId) {
      const universignClient = getUniversignClient();
      await universignClient.remindSigner(transaction.universignId, signerEmail);
    }
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(
    id: string,
    cabinetId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const transaction = await prisma.signatureTransaction.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction de signature non trouvée');
    }

    if (transaction.status !== SignatureStatus.COMPLETED) {
      throw new BadRequestError('La signature n\'est pas complétée');
    }

    if (!transaction.signedDocumentPath) {
      throw new BadRequestError('Document signé non disponible');
    }

    // Download from MinIO
    const stream = await minioClient.getObject(
      config.minio.buckets.documents,
      transaction.signedDocumentPath
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return {
      buffer,
      filename: `${transaction.title}_signed.pdf`,
    };
  }

  /**
   * Download certificates
   */
  async downloadCertificates(
    id: string,
    cabinetId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const transaction = await prisma.signatureTransaction.findFirst({
      where: { id, cabinetId, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction de signature non trouvée');
    }

    if (transaction.status !== SignatureStatus.COMPLETED) {
      throw new BadRequestError('La signature n\'est pas complétée');
    }

    if (!transaction.certificatesPath) {
      throw new BadRequestError('Certificats non disponibles');
    }

    const stream = await minioClient.getObject(
      config.minio.buckets.documents,
      transaction.certificatesPath
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return {
      buffer,
      filename: `${transaction.title}_certificates.pdf`,
    };
  }

  /**
   * Handle webhook from Universign
   */
  async handleWebhook(payload: UniversignWebhookPayload): Promise<void> {
    logger.info(`[Webhook] Processing Universign webhook: ${payload.transactionId} -> ${payload.status}`);

    // Find transaction by Universign ID
    const transaction = await prisma.signatureTransaction.findFirst({
      where: { universignId: payload.transactionId },
      include: {
        signatories: true,
        initiator: { select: { email: true, firstName: true } },
        document: { select: { title: true } },
      },
    });

    if (!transaction) {
      logger.warn(`[Webhook] Transaction not found: ${payload.transactionId}`);
      return;
    }

    const newStatus = this.mapWebhookStatus(payload.status);

    // Update signatories if provided
    if (payload.signers) {
      for (const signer of payload.signers) {
        const signatory = transaction.signatories.find((s) => s.email === signer.email);
        if (signatory) {
          await prisma.signatureSignatory.update({
            where: { id: signatory.id },
            data: {
              status: this.mapSignatoryStatus(signer.status),
              signedAt: signer.signedAt ? new Date(signer.signedAt) : undefined,
              refusedAt: signer.refusedAt ? new Date(signer.refusedAt) : undefined,
              refusedReason: signer.refusedReason,
            },
          });
        }
      }
    }

    // Update transaction status
    const updateData: Prisma.SignatureTransactionUpdateInput = {
      status: newStatus,
    };

    if (newStatus === SignatureStatus.COMPLETED) {
      updateData.completedAt = new Date();

      // Download and store signed document + certificates
      await this.storeSignedDocuments(transaction);
    }

    await prisma.signatureTransaction.update({
      where: { id: transaction.id },
      data: updateData,
    });

    // Create audit log
    await this.createAuditLog(
      transaction.cabinetId,
      transaction.initiatorId,
      transaction.id,
      newStatus === SignatureStatus.COMPLETED ? 'SIGNATURE_COMPLETED' : 'SIGNATURE_UPDATED',
      { status: newStatus }
    );

    logger.info(`[Webhook] Transaction ${transaction.id} updated to ${newStatus}`);
  }

  /**
   * Store signed documents from Universign
   */
  private async storeSignedDocuments(transaction: {
    id: string;
    cabinetId: string;
    universignId: string | null;
  }): Promise<void> {
    if (!transaction.universignId) return;

    try {
      const universignClient = getUniversignClient();

      // Download signed document
      const signedDoc = await universignClient.downloadSignedDocument(transaction.universignId);
      const signedPath = `${transaction.cabinetId}/signatures/${transaction.id}/signed.pdf`;

      await minioClient.putObject(
        config.minio.buckets.documents,
        signedPath,
        signedDoc,
        signedDoc.length,
        { 'Content-Type': 'application/pdf' }
      );

      // Download certificates
      const certificates = await universignClient.downloadCertificates(transaction.universignId);
      const certPath = `${transaction.cabinetId}/signatures/${transaction.id}/certificates.pdf`;

      await minioClient.putObject(
        config.minio.buckets.documents,
        certPath,
        certificates,
        certificates.length,
        { 'Content-Type': 'application/pdf' }
      );

      // Update transaction with paths
      await prisma.signatureTransaction.update({
        where: { id: transaction.id },
        data: {
          signedDocumentPath: signedPath,
          certificatesPath: certPath,
        },
      });

      logger.info(`[Signature] Stored signed documents for ${transaction.id}`);
    } catch (error: any) {
      logger.error(`[Signature] Failed to store signed documents: ${error.message}`);
    }
  }

  /**
   * Find transaction by Universign ID
   */
  async findByUniversignId(universignId: string) {
    return prisma.signatureTransaction.findFirst({
      where: { universignId },
      include: {
        initiator: { select: { email: true, firstName: true } },
        document: { select: { title: true } },
      },
    });
  }

  private mapWebhookStatus(status: string): SignatureStatus {
    const statusMap: Record<string, SignatureStatus> = {
      'ready': SignatureStatus.PENDING,
      'pending': SignatureStatus.PENDING,
      'in_progress': SignatureStatus.IN_PROGRESS,
      'completed': SignatureStatus.COMPLETED,
      'canceled': SignatureStatus.CANCELLED,
      'cancelled': SignatureStatus.CANCELLED,
      'expired': SignatureStatus.EXPIRED,
      'failed': SignatureStatus.ERROR,
    };

    return statusMap[status.toLowerCase()] || SignatureStatus.IN_PROGRESS;
  }

  private mapSignatoryStatus(status: string): SignatoryStatus {
    const statusMap: Record<string, SignatoryStatus> = {
      'waiting': SignatoryStatus.PENDING,
      'pending': SignatoryStatus.PENDING,
      'in_progress': SignatoryStatus.IN_PROGRESS,
      'signed': SignatoryStatus.SIGNED,
      'refused': SignatoryStatus.REFUSED,
    };

    return statusMap[status.toLowerCase()] || SignatoryStatus.PENDING;
  }

  private formatTransaction(transaction: any): SignatureTransactionResponse {
    return {
      id: transaction.id,
      documentId: transaction.documentId,
      title: transaction.title,
      description: transaction.description,
      status: transaction.status,
      profile: transaction.profile,
      language: transaction.language,
      universignId: transaction.universignId,
      signedDocumentPath: transaction.signedDocumentPath,
      certificatesPath: transaction.certificatesPath,
      expiresAt: transaction.expiresAt,
      completedAt: transaction.completedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      document: transaction.document,
      initiator: transaction.initiator,
      signatories: transaction.signatories.map((s: any) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
        status: s.status,
        signOrder: s.signOrder,
        signUrl: s.signUrl,
        signedAt: s.signedAt,
        refusedAt: s.refusedAt,
        refusedReason: s.refusedReason,
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
          entity: 'SignatureTransaction',
          entityId,
          details,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const signaturesService = new SignaturesService();
