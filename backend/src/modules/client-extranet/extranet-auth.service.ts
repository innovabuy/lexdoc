import { prisma } from '@/config/database';
import { sendRawEmail } from '@/lib/email';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { NotFoundError, UnauthorizedError, BadRequestError } from '@/utils/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { ActivateAccountInput, LoginInput, ResetPasswordInput } from './extranet-auth.schemas';

export interface ClientTokenPayload {
  clientAccessId: string;
  email: string;
  type: 'client';
  cabinetId: string;
}

export class ExtranetAuthService {
  /**
   * Check if activation token is valid
   */
  async checkActivationToken(token: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { activationToken: token },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        isActivated: true,
        activationExpires: true,
        cabinet: {
          select: { name: true },
        },
      },
    });

    if (!clientAccess) {
      throw new NotFoundError('Token invalide');
    }

    if (clientAccess.isActivated) {
      throw new BadRequestError('Ce compte a deja ete active');
    }

    if (clientAccess.activationExpires && clientAccess.activationExpires < new Date()) {
      throw new BadRequestError('Ce lien a expire. Demandez un nouveau lien a votre avocat.');
    }

    return {
      email: clientAccess.email,
      name: clientAccess.firstName
        ? `${clientAccess.firstName} ${clientAccess.lastName}`
        : clientAccess.companyName,
      cabinetName: clientAccess.cabinet.name,
    };
  }

  /**
   * Activate a client account
   */
  async activateAccount(token: string, input: ActivateAccountInput) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { activationToken: token },
      include: {
        cabinet: { select: { name: true } },
      },
    });

    if (!clientAccess || clientAccess.isActivated) {
      throw new BadRequestError('Token invalide ou compte deja active');
    }

    if (clientAccess.activationExpires && clientAccess.activationExpires < new Date()) {
      throw new BadRequestError('Token expire');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, config.bcrypt.saltRounds);

    // Activate account
    await prisma.clientAccess.update({
      where: { id: clientAccess.id },
      data: {
        passwordHash,
        isActivated: true,
        activationToken: null,
        activationExpires: null,
      },
    });

    // Generate JWT
    const jwtToken = this.generateClientToken({
      clientAccessId: clientAccess.id,
      email: clientAccess.email,
      type: 'client',
      cabinetId: clientAccess.cabinetId,
    });

    logger.info(`[ExtranetAuth] Client ${clientAccess.email} activated`);

    return {
      token: jwtToken,
      client: {
        id: clientAccess.id,
        email: clientAccess.email,
        firstName: clientAccess.firstName,
        lastName: clientAccess.lastName,
        companyName: clientAccess.companyName,
        cabinetName: clientAccess.cabinet.name,
      },
    };
  }

  /**
   * Login a client
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { email: input.email },
      include: {
        cabinet: { select: { name: true } },
      },
    });

    if (!clientAccess) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    if (!clientAccess.isActivated) {
      throw new UnauthorizedError('Compte non active. Verifiez votre email d\'invitation.');
    }

    if (!clientAccess.passwordHash) {
      throw new UnauthorizedError('Erreur de configuration du compte');
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, clientAccess.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    // Generate JWT
    const token = this.generateClientToken({
      clientAccessId: clientAccess.id,
      email: clientAccess.email,
      type: 'client',
      cabinetId: clientAccess.cabinetId,
    });

    // Log login
    await prisma.$transaction([
      prisma.clientAccess.update({
        where: { id: clientAccess.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      }),
      prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'LOGIN',
          ipAddress,
          userAgent,
        },
      }),
    ]);

    logger.info(`[ExtranetAuth] Client ${clientAccess.email} logged in`);

    return {
      token,
      client: {
        id: clientAccess.id,
        email: clientAccess.email,
        firstName: clientAccess.firstName,
        lastName: clientAccess.lastName,
        companyName: clientAccess.companyName,
        cabinetName: clientAccess.cabinet.name,
      },
    };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { email },
      include: {
        cabinet: { select: { name: true } },
      },
    });

    // Don't reveal if email exists
    if (!clientAccess) {
      return {
        success: true,
        message: 'Si cet email existe, un lien de reinitialisation a ete envoye',
      };
    }

    // Generate reset token (valid 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.clientAccess.update({
      where: { id: clientAccess.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    // Send reset email
    const resetUrl = `${config.urls.frontend}/extranet/reset-password/${resetToken}`;
    const clientName = clientAccess.firstName || clientAccess.companyName || email;

    await this.sendPasswordResetEmail({
      to: email,
      clientName,
      resetUrl,
      cabinetName: clientAccess.cabinet.name,
    });

    logger.info(`[ExtranetAuth] Password reset requested for ${email}`);

    return {
      success: true,
      message: 'Si cet email existe, un lien de reinitialisation a ete envoye',
    };
  }

  /**
   * Check if reset token is valid
   */
  async checkResetToken(token: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { resetToken: token },
      select: {
        id: true,
        email: true,
        resetExpires: true,
      },
    });

    if (!clientAccess || !clientAccess.resetExpires || clientAccess.resetExpires < new Date()) {
      throw new BadRequestError('Token invalide ou expire');
    }

    return { email: clientAccess.email };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, input: ResetPasswordInput, ipAddress?: string, userAgent?: string) {
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { resetToken: token },
    });

    if (!clientAccess || !clientAccess.resetExpires || clientAccess.resetExpires < new Date()) {
      throw new BadRequestError('Token invalide ou expire');
    }

    const passwordHash = await bcrypt.hash(input.password, config.bcrypt.saltRounds);

    await prisma.$transaction([
      prisma.clientAccess.update({
        where: { id: clientAccess.id },
        data: {
          passwordHash,
          resetToken: null,
          resetExpires: null,
        },
      }),
      prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'PASSWORD_RESET',
          ipAddress,
          userAgent,
        },
      }),
    ]);

    logger.info(`[ExtranetAuth] Password reset completed for ${clientAccess.email}`);

    return {
      success: true,
      message: 'Mot de passe reinitialise avec succes',
    };
  }

  /**
   * Verify client token
   */
  verifyClientToken(token: string): ClientTokenPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as ClientTokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Token invalide ou expire');
    }
  }

  /**
   * Generate client JWT token
   */
  private generateClientToken(payload: ClientTokenPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: '30d',
    });
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(params: {
    to: string;
    clientName: string;
    resetUrl: string;
    cabinetName: string;
  }) {
    const { to, clientName, resetUrl, cabinetName } = params;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0066ff 0%, #00d9ff 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Reinitialisation du mot de passe</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Extranet Client - ${cabinetName}</p>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Bonjour ${clientName},</p>

    <p>Vous avez demande la reinitialisation de votre mot de passe pour acceder a votre espace client.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; background: #0066ff; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Reinitialiser mon mot de passe
      </a>
    </div>

    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Important :</strong> Ce lien est valable 1 heure. Si vous n'avez pas demande cette reinitialisation, ignorez cet email.
      </p>
    </div>

    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
      Cet email a ete envoye automatiquement par LexDoc.
    </p>
  </div>
</body>
</html>
    `;

    await sendRawEmail({
      to,
      subject: `Reinitialisation de votre mot de passe - ${cabinetName}`,
      html,
    });
  }
}

export const extranetAuthService = new ExtranetAuthService();
