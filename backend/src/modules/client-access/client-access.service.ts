import { prisma } from '@/config/database';
import { sendRawEmail } from '@/lib/email';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { NotFoundError, ConflictError } from '@/utils/errors';
import crypto from 'crypto';
import type { InviteClientInput, UpdatePermissionsInput, ClientAccessQuery } from './client-access.schemas';

export class ClientAccessService {
  /**
   * Invite a client to access the extranet
   */
  async inviteClient(
    cabinetId: string,
    userId: string,
    input: InviteClientInput,
    cabinetName: string,
    lawyerName: string
  ) {
    // Check if email already invited
    const existing = await prisma.clientAccess.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      if (existing.cabinetId !== cabinetId) {
        throw new ConflictError('Cet email est deja utilise par un autre cabinet');
      }
      throw new ConflictError('Ce client a deja ete invite');
    }

    // Generate activation token (valid 7 days)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Determine allowed folders
    let allowedFolders: string[] = input.allowedFolders || [];
    if (input.folderId && !allowedFolders.includes(input.folderId)) {
      allowedFolders = [input.folderId, ...allowedFolders];
    }

    // Create client access
    const clientAccess = await prisma.clientAccess.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        companyName: input.companyName,
        cabinetId,
        folderId: input.folderId,
        clientId: input.clientId,
        allowedFolders,
        permissions: input.permissions || { canSign: true, canDownload: true, canComment: false },
        activationToken,
        activationExpires,
        invitedBy: userId,
      },
      include: {
        folder: { select: { id: true, name: true } },
        client: { select: { id: true, nom: true, prenom: true } },
      },
    });

    // Send invitation email
    const activationUrl = `${config.urls.frontend}/extranet/activate/${activationToken}`;
    const clientName = input.firstName
      ? `${input.firstName} ${input.lastName}`
      : input.companyName || input.email;

    await this.sendInvitationEmail({
      to: input.email,
      clientName,
      activationUrl,
      cabinetName,
      lawyerName,
    });

    logger.info(`[ClientAccess] Client ${input.email} invited by user ${userId}`);

    return {
      clientAccess,
      activationUrl: config.env === 'development' ? activationUrl : undefined,
    };
  }

  /**
   * List all client accesses for a cabinet
   */
  async listClientAccesses(cabinetId: string, query: ClientAccessQuery) {
    const { page, limit, search, isActivated } = query;
    const skip = (page - 1) * limit;

    const where: any = { cabinetId };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActivated !== undefined) {
      where.isActivated = isActivated === 'true';
    }

    const [clientAccesses, total] = await Promise.all([
      prisma.clientAccess.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          isActivated: true,
          lastLoginAt: true,
          loginCount: true,
          invitedAt: true,
          permissions: true,
          allowedFolders: true,
          folder: {
            select: { id: true, name: true },
          },
          client: {
            select: { id: true, nom: true, prenom: true, type: true },
          },
        },
        orderBy: { invitedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.clientAccess.count({ where }),
    ]);

    return {
      data: clientAccesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single client access
   */
  async getClientAccess(id: string, cabinetId: string) {
    const clientAccess = await prisma.clientAccess.findFirst({
      where: { id, cabinetId },
      include: {
        folder: { select: { id: true, name: true } },
        client: { select: { id: true, nom: true, prenom: true, type: true } },
        accessLogs: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client access non trouve');
    }

    return clientAccess;
  }

  /**
   * Update client access permissions
   */
  async updatePermissions(id: string, cabinetId: string, input: UpdatePermissionsInput) {
    const clientAccess = await prisma.clientAccess.findFirst({
      where: { id, cabinetId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client access non trouve');
    }

    const updateData: any = {};

    if (input.permissions) {
      updateData.permissions = {
        ...(clientAccess.permissions as object),
        ...input.permissions,
      };
    }

    if (input.allowedFolders) {
      updateData.allowedFolders = input.allowedFolders;
    }

    const updated = await prisma.clientAccess.update({
      where: { id },
      data: updateData,
      include: {
        folder: { select: { id: true, name: true } },
        client: { select: { id: true, nom: true, prenom: true } },
      },
    });

    logger.info(`[ClientAccess] Permissions updated for client ${id}`);

    return updated;
  }

  /**
   * Resend invitation email
   */
  async resendInvitation(
    id: string,
    cabinetId: string,
    cabinetName: string,
    lawyerName: string
  ) {
    const clientAccess = await prisma.clientAccess.findFirst({
      where: { id, cabinetId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client access non trouve');
    }

    if (clientAccess.isActivated) {
      throw new ConflictError('Ce client a deja active son compte');
    }

    // Generate new token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.clientAccess.update({
      where: { id },
      data: {
        activationToken,
        activationExpires,
      },
    });

    // Resend email
    const activationUrl = `${config.urls.frontend}/extranet/activate/${activationToken}`;
    const clientName = clientAccess.firstName
      ? `${clientAccess.firstName} ${clientAccess.lastName}`
      : clientAccess.companyName || clientAccess.email;

    await this.sendInvitationEmail({
      to: clientAccess.email,
      clientName,
      activationUrl,
      cabinetName,
      lawyerName,
    });

    logger.info(`[ClientAccess] Invitation resent to ${clientAccess.email}`);

    return { success: true };
  }

  /**
   * Delete client access
   */
  async deleteClientAccess(id: string, cabinetId: string) {
    const clientAccess = await prisma.clientAccess.findFirst({
      where: { id, cabinetId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client access non trouve');
    }

    await prisma.clientAccess.delete({ where: { id } });

    logger.info(`[ClientAccess] Client access ${id} deleted`);

    return { success: true };
  }

  /**
   * Get access logs for a client
   */
  async getAccessLogs(id: string, cabinetId: string, limit = 100) {
    const clientAccess = await prisma.clientAccess.findFirst({
      where: { id, cabinetId },
    });

    if (!clientAccess) {
      throw new NotFoundError('Client access non trouve');
    }

    const logs = await prisma.clientAccessLog.findMany({
      where: { clientAccessId: id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs;
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(params: {
    to: string;
    clientName: string;
    activationUrl: string;
    cabinetName: string;
    lawyerName: string;
  }) {
    const { to, clientName, activationUrl, cabinetName, lawyerName } = params;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0066ff 0%, #00d9ff 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Activez votre acces</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Extranet Client - ${cabinetName}</p>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Bonjour ${clientName},</p>

    <p>Le <strong>${cabinetName}</strong> vous invite a acceder a votre espace client securise.</p>

    <div style="background: white; border-left: 4px solid #0066ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #0066ff;">Votre espace personnel</h3>
      <p style="margin: 0;">Vous pourrez :</p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Consulter vos documents juridiques 24h/24</li>
        <li>Signer electroniquement vos contrats</li>
        <li>Suivre l'avancement de vos dossiers</li>
        <li>Telecharger vos documents signes</li>
      </ul>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #0f172a;">Premiere connexion</h4>
      <p style="margin-bottom: 10px;">Email de connexion :</p>
      <div style="padding: 12px; background: #f8fafc; border-radius: 6px; font-family: monospace; font-size: 14px; margin-bottom: 15px;">
        ${to}
      </div>
      <p style="font-size: 14px; color: #64748b;">
        Vous devrez definir votre mot de passe lors de votre premiere connexion.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${activationUrl}"
         style="display: inline-block; background: #0066ff; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Activer mon compte
      </a>
    </div>

    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Important :</strong> Ce lien est valable 7 jours. Apres activation, vous pourrez vous connecter a tout moment.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <div style="text-align: center;">
      <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
        <strong>Besoin d'aide ?</strong>
      </p>
      <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
        ${cabinetName}<br>
        Votre contact : ${lawyerName}
      </p>
    </div>

    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
      Cet email a ete envoye automatiquement par LexDoc. Si vous n'etes pas concerne, vous pouvez ignorer ce message.
    </p>
  </div>
</body>
</html>
    `;

    await sendRawEmail({
      to,
      subject: `Invitation a l'extranet client - ${cabinetName}`,
      html,
    });
  }
}

export const clientAccessService = new ClientAccessService();
