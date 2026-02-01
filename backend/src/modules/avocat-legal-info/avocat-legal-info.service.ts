import { prisma } from '@/config/database';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '@/utils/errors';
import { Civilite } from '@prisma/client';
import Handlebars from 'handlebars';
import crypto from 'crypto';
import sharp from 'sharp';
import type {
  CreateAvocatLegalInfoInput,
  UpdateAvocatLegalInfoInput,
} from './avocat-legal-info.schemas';

// Bucket for legal documents (signatures, cachets)
const LEGAL_DOCS_BUCKET = config.minio.buckets.documents;

// Default legal mentions template
const DEFAULT_MENTIONS_TEMPLATE = `
<div class="mentions-legales">
  <p><strong>{{civilite}} {{prenom}} {{nom}}</strong></p>
  <p>Avocat au {{barreau}}</p>
  {{#if numeroToque}}<p>Toque n° {{numeroToque}}</p>{{/if}}
  <p>{{adresseCabinet}}</p>
  <p>{{codePostal}} {{ville}}</p>
  <p>Tél: {{telephone}}</p>
  {{#if fax}}<p>Fax: {{fax}}</p>{{/if}}
  <p>Email: {{email}}</p>
  {{#if siteWeb}}<p>Site: {{siteWeb}}</p>{{/if}}
</div>
`;

// Allowed MIME types for signature/cachet
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

export class AvocatLegalInfoService {
  /**
   * Get legal info for the current user
   */
  async getMyLegalInfo(userId: string, cabinetId: string) {
    const legalInfo = await prisma.avocatLegalInfo.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!legalInfo) {
      // Return empty template structure
      return {
        exists: false,
        template: {
          civilite: Civilite.MAITRE,
          nom: '',
          prenom: '',
          barreau: '',
          numeroToque: null,
          adresseCabinet: '',
          codePostal: '',
          ville: '',
          telephone: '',
          fax: null,
          email: '',
          siteWeb: null,
          mentionsLegalesDefaut: {},
          signatureImage: null,
          cachetCabinet: null,
        },
      };
    }

    // Generate signed URLs for images if they exist
    const signatureUrl = legalInfo.signatureImage
      ? await this.getSignedUrl(legalInfo.signatureImage)
      : null;
    const cachetUrl = legalInfo.cachetCabinet
      ? await this.getSignedUrl(legalInfo.cachetCabinet)
      : null;

    return {
      exists: true,
      data: {
        ...legalInfo,
        signatureUrl,
        cachetUrl,
      },
    };
  }

  /**
   * Get legal info by ID
   */
  async getById(id: string, userId: string, cabinetId: string) {
    const legalInfo = await prisma.avocatLegalInfo.findFirst({
      where: { id, cabinetId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!legalInfo) {
      throw new NotFoundError('Informations légales non trouvées');
    }

    // Only allow user to access their own legal info (unless admin)
    if (legalInfo.userId !== userId) {
      throw new ForbiddenError('Vous ne pouvez accéder qu\'à vos propres informations légales');
    }

    // Generate signed URLs
    const signatureUrl = legalInfo.signatureImage
      ? await this.getSignedUrl(legalInfo.signatureImage)
      : null;
    const cachetUrl = legalInfo.cachetCabinet
      ? await this.getSignedUrl(legalInfo.cachetCabinet)
      : null;

    return {
      ...legalInfo,
      signatureUrl,
      cachetUrl,
    };
  }

  /**
   * Create legal info for a user
   */
  async create(userId: string, cabinetId: string, data: CreateAvocatLegalInfoInput) {
    // Check if user already has legal info
    const existing = await prisma.avocatLegalInfo.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictError('Les informations légales existent déjà pour cet utilisateur');
    }

    // Generate default mentions if not provided
    const mentionsLegalesDefaut = data.mentionsLegalesDefaut || this.generateDefaultMentions(data);

    const legalInfo = await prisma.avocatLegalInfo.create({
      data: {
        userId,
        cabinetId,
        civilite: data.civilite,
        nom: data.nom,
        prenom: data.prenom,
        barreau: data.barreau,
        numeroToque: data.numeroToque,
        adresseCabinet: data.adresseCabinet,
        codePostal: data.codePostal,
        ville: data.ville,
        telephone: data.telephone,
        fax: data.fax,
        email: data.email,
        siteWeb: data.siteWeb,
        mentionsLegalesDefaut,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'AVOCAT_INFO_UPDATED',
        entity: 'AvocatLegalInfo',
        entityId: legalInfo.id,
        details: {
          action: 'created',
          nom: legalInfo.nom,
          prenom: legalInfo.prenom,
          barreau: legalInfo.barreau,
        },
      },
    });

    return legalInfo;
  }

  /**
   * Update legal info
   */
  async update(id: string, userId: string, cabinetId: string, data: UpdateAvocatLegalInfoInput) {
    const existing = await prisma.avocatLegalInfo.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Informations légales non trouvées');
    }

    // Verify ownership
    if (existing.userId !== userId) {
      throw new ForbiddenError('Vous ne pouvez modifier que vos propres informations légales');
    }

    const legalInfo = await prisma.avocatLegalInfo.update({
      where: { id },
      data: {
        ...(data.civilite !== undefined && { civilite: data.civilite }),
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.prenom !== undefined && { prenom: data.prenom }),
        ...(data.barreau !== undefined && { barreau: data.barreau }),
        ...(data.numeroToque !== undefined && { numeroToque: data.numeroToque }),
        ...(data.adresseCabinet !== undefined && { adresseCabinet: data.adresseCabinet }),
        ...(data.codePostal !== undefined && { codePostal: data.codePostal }),
        ...(data.ville !== undefined && { ville: data.ville }),
        ...(data.telephone !== undefined && { telephone: data.telephone }),
        ...(data.fax !== undefined && { fax: data.fax }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.siteWeb !== undefined && { siteWeb: data.siteWeb }),
        ...(data.mentionsLegalesDefaut !== undefined && { mentionsLegalesDefaut: data.mentionsLegalesDefaut }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'AVOCAT_INFO_UPDATED',
        entity: 'AvocatLegalInfo',
        entityId: legalInfo.id,
        details: {
          action: 'updated',
          updatedFields: Object.keys(data),
        },
      },
    });

    return legalInfo;
  }

  /**
   * Upload signature image
   */
  async uploadSignature(
    id: string,
    userId: string,
    cabinetId: string,
    file: Express.Multer.File
  ) {
    const existing = await prisma.avocatLegalInfo.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Informations légales non trouvées');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('Vous ne pouvez modifier que vos propres informations');
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        `Type de fichier non autorisé. Types acceptés: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      );
    }

    // Process image (convert to PNG if necessary)
    let imageBuffer: Buffer;
    if (file.mimetype === 'application/pdf') {
      // For PDF, store as-is (could add PDF to PNG conversion with pdf-poppler if needed)
      imageBuffer = file.buffer;
    } else {
      // Convert to PNG with sharp
      imageBuffer = await sharp(file.buffer)
        .png()
        .resize(800, 400, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    // Generate storage path
    const filename = `signature_${Date.now()}.png`;
    const storagePath = `legal-docs/${userId}/signatures/${filename}`;

    // Delete old signature if exists
    if (existing.signatureImage) {
      try {
        await minioClient.removeObject(LEGAL_DOCS_BUCKET, existing.signatureImage);
      } catch {
        // Ignore errors when deleting old file
      }
    }

    // Upload to MinIO
    await minioClient.putObject(
      LEGAL_DOCS_BUCKET,
      storagePath,
      imageBuffer,
      imageBuffer.length,
      {
        'Content-Type': 'image/png',
        'x-amz-meta-user-id': userId,
        'x-amz-meta-type': 'signature',
      }
    );

    // Update database
    const legalInfo = await prisma.avocatLegalInfo.update({
      where: { id },
      data: { signatureImage: storagePath },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'AVOCAT_INFO_UPDATED',
        entity: 'AvocatLegalInfo',
        entityId: id,
        details: {
          action: 'signature_uploaded',
          filename,
        },
      },
    });

    // Return with signed URL
    const signatureUrl = await this.getSignedUrl(storagePath);

    return {
      ...legalInfo,
      signatureUrl,
    };
  }

  /**
   * Upload cachet/logo
   */
  async uploadCachet(
    id: string,
    userId: string,
    cabinetId: string,
    file: Express.Multer.File
  ) {
    const existing = await prisma.avocatLegalInfo.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Informations légales non trouvées');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('Vous ne pouvez modifier que vos propres informations');
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        `Type de fichier non autorisé. Types acceptés: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      );
    }

    // Process image (convert to PNG if necessary)
    let imageBuffer: Buffer;
    let contentType = 'image/png';

    if (file.mimetype === 'application/pdf') {
      imageBuffer = file.buffer;
      contentType = 'application/pdf';
    } else {
      imageBuffer = await sharp(file.buffer)
        .png()
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    // Generate storage path
    const ext = file.mimetype === 'application/pdf' ? 'pdf' : 'png';
    const filename = `cachet_${Date.now()}.${ext}`;
    const storagePath = `legal-docs/${userId}/cachets/${filename}`;

    // Delete old cachet if exists
    if (existing.cachetCabinet) {
      try {
        await minioClient.removeObject(LEGAL_DOCS_BUCKET, existing.cachetCabinet);
      } catch {
        // Ignore errors when deleting old file
      }
    }

    // Upload to MinIO
    await minioClient.putObject(
      LEGAL_DOCS_BUCKET,
      storagePath,
      imageBuffer,
      imageBuffer.length,
      {
        'Content-Type': contentType,
        'x-amz-meta-user-id': userId,
        'x-amz-meta-type': 'cachet',
      }
    );

    // Update database
    const legalInfo = await prisma.avocatLegalInfo.update({
      where: { id },
      data: { cachetCabinet: storagePath },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'AVOCAT_INFO_UPDATED',
        entity: 'AvocatLegalInfo',
        entityId: id,
        details: {
          action: 'cachet_uploaded',
          filename,
        },
      },
    });

    // Return with signed URL
    const cachetUrl = await this.getSignedUrl(storagePath);

    return {
      ...legalInfo,
      cachetUrl,
    };
  }

  /**
   * Generate preview of legal mentions as HTML
   */
  async previewMentions(id: string, userId: string, cabinetId: string) {
    const legalInfo = await prisma.avocatLegalInfo.findFirst({
      where: { id },
    });

    if (!legalInfo) {
      throw new NotFoundError('Informations légales non trouvées');
    }

    if (legalInfo.userId !== userId) {
      throw new ForbiddenError('Vous ne pouvez accéder qu\'à vos propres informations');
    }

    // Get custom template or use default
    const mentionsTemplate =
      (legalInfo.mentionsLegalesDefaut as { template?: string })?.template ||
      DEFAULT_MENTIONS_TEMPLATE;

    // Compile and render Handlebars template
    const template = Handlebars.compile(mentionsTemplate);
    const html = template({
      civilite: this.formatCivilite(legalInfo.civilite),
      nom: legalInfo.nom,
      prenom: legalInfo.prenom,
      barreau: legalInfo.barreau,
      numeroToque: legalInfo.numeroToque,
      adresseCabinet: legalInfo.adresseCabinet,
      codePostal: legalInfo.codePostal,
      ville: legalInfo.ville,
      telephone: legalInfo.telephone,
      fax: legalInfo.fax,
      email: legalInfo.email,
      siteWeb: legalInfo.siteWeb,
    });

    // Get signature URL if exists
    const signatureUrl = legalInfo.signatureImage
      ? await this.getSignedUrl(legalInfo.signatureImage)
      : null;

    // Get cachet URL if exists
    const cachetUrl = legalInfo.cachetCabinet
      ? await this.getSignedUrl(legalInfo.cachetCabinet)
      : null;

    // Styled HTML wrapper
    const styledHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
          }
          .mentions-legales {
            border: 1px solid #ddd;
            padding: 20px;
            background: #fafafa;
          }
          .mentions-legales p {
            margin: 5px 0;
          }
          .signature-section {
            margin-top: 30px;
            text-align: right;
          }
          .signature-section img {
            max-width: 200px;
            max-height: 100px;
          }
          .cachet-section {
            margin-top: 20px;
          }
          .cachet-section img {
            max-width: 150px;
            max-height: 150px;
          }
        </style>
      </head>
      <body>
        ${html}
        ${signatureUrl ? `
          <div class="signature-section">
            <p><strong>Signature:</strong></p>
            <img src="${signatureUrl}" alt="Signature">
          </div>
        ` : ''}
        ${cachetUrl ? `
          <div class="cachet-section">
            <p><strong>Cachet du cabinet:</strong></p>
            <img src="${cachetUrl}" alt="Cachet">
          </div>
        ` : ''}
      </body>
      </html>
    `;

    return {
      html: styledHtml,
      rawHtml: html,
      variables: {
        civilite: this.formatCivilite(legalInfo.civilite),
        nom: legalInfo.nom,
        prenom: legalInfo.prenom,
        barreau: legalInfo.barreau,
        numeroToque: legalInfo.numeroToque,
        adresseCabinet: legalInfo.adresseCabinet,
        codePostal: legalInfo.codePostal,
        ville: legalInfo.ville,
        telephone: legalInfo.telephone,
        fax: legalInfo.fax,
        email: legalInfo.email,
        siteWeb: legalInfo.siteWeb,
      },
      signatureUrl,
      cachetUrl,
    };
  }

  /**
   * Generate signed URL for file access (expires in 1 hour)
   */
  private async getSignedUrl(path: string): Promise<string> {
    try {
      return await minioClient.presignedGetObject(LEGAL_DOCS_BUCKET, path, 3600);
    } catch {
      return '';
    }
  }

  /**
   * Format civilite enum to display string
   */
  private formatCivilite(civilite: Civilite): string {
    const mapping: Record<Civilite, string> = {
      MAITRE: 'Maître',
      MONSIEUR: 'Monsieur',
      MADAME: 'Madame',
    };
    return mapping[civilite] || civilite;
  }

  /**
   * Generate default mentions structure
   */
  private generateDefaultMentions(data: CreateAvocatLegalInfoInput): Record<string, any> {
    return {
      template: DEFAULT_MENTIONS_TEMPLATE,
      generatedAt: new Date().toISOString(),
      version: 1,
    };
  }
}

export const avocatLegalInfoService = new AvocatLegalInfoService();
