import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { emailService } from '../../services/email.service';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

// Validation schemas
const activateAccountSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
});

export class ActivationController {
  /**
   * Validate activation token and return client info
   * GET /api/extranet/auth/activate/:token
   */
  async validateActivationToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const clientAccess = await prisma.clientAccess.findUnique({
        where: { activationToken: token },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          activationExpires: true,
          isActivated: true,
        },
      });

      if (!clientAccess) {
        res.status(404).json({ error: 'Lien d\'activation invalide' });
        return;
      }

      if (clientAccess.isActivated) {
        res.status(400).json({ error: 'Ce compte est déjà activé' });
        return;
      }

      if (clientAccess.activationExpires && new Date() > clientAccess.activationExpires) {
        res.status(400).json({ error: 'Ce lien d\'activation a expiré' });
        return;
      }

      res.json({
        email: clientAccess.email,
        name: [clientAccess.firstName, clientAccess.lastName].filter(Boolean).join(' ') || clientAccess.companyName || clientAccess.email,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate account with password
   * POST /api/extranet/auth/activate/:token
   */
  async activateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = activateAccountSchema.parse(req.body);

      const clientAccess = await prisma.clientAccess.findUnique({
        where: { activationToken: token },
      });

      if (!clientAccess) {
        res.status(404).json({ error: 'Lien d\'activation invalide' });
        return;
      }

      if (clientAccess.isActivated) {
        res.status(400).json({ error: 'Ce compte est déjà activé' });
        return;
      }

      if (clientAccess.activationExpires && new Date() > clientAccess.activationExpires) {
        res.status(400).json({ error: 'Ce lien d\'activation a expiré' });
        return;
      }

      // Hash password and activate account
      const passwordHash = await bcrypt.hash(password, 12);

      await prisma.clientAccess.update({
        where: { id: clientAccess.id },
        data: {
          passwordHash,
          isActivated: true,
          activationToken: null,
          activationExpires: null,
        },
      });

      // Log activation
      await prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'LOGIN',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { event: 'account_activated' },
        },
      });

      logger.info(`Client account activated: ${clientAccess.email}`);

      res.json({ message: 'Compte activé avec succès' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/extranet/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const clientAccess = await prisma.clientAccess.findUnique({
        where: { email },
        include: { cabinet: true },
      });

      // Always return success to prevent email enumeration
      if (!clientAccess || !clientAccess.isActivated) {
        res.json({ message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation' });
        return;
      }

      // Generate reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.clientAccess.update({
        where: { id: clientAccess.id },
        data: {
          resetToken,
          resetExpires,
        },
      });

      // Send reset email
      const resetUrl = `${process.env.CLIENT_EXTRANET_URL}/reset-password/${resetToken}`;

      await emailService.sendPasswordReset(clientAccess.email, {
        name: clientAccess.firstName || clientAccess.email,
        resetUrl,
        expiresIn: '1 heure',
      });

      logger.info(`Password reset requested for: ${email}`);

      res.json({ message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      next(error);
    }
  }

  /**
   * Reset password with token
   * POST /api/extranet/auth/reset-password/:token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = resetPasswordSchema.parse(req.body);

      const clientAccess = await prisma.clientAccess.findUnique({
        where: { resetToken: token },
      });

      if (!clientAccess) {
        res.status(404).json({ error: 'Lien de réinitialisation invalide' });
        return;
      }

      if (clientAccess.resetExpires && new Date() > clientAccess.resetExpires) {
        res.status(400).json({ error: 'Ce lien de réinitialisation a expiré' });
        return;
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      await prisma.clientAccess.update({
        where: { id: clientAccess.id },
        data: {
          passwordHash,
          resetToken: null,
          resetExpires: null,
        },
      });

      // Log password reset
      await prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'PASSWORD_RESET',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Password reset completed for: ${clientAccess.email}`);

      res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      next(error);
    }
  }

  /**
   * Login client
   * POST /api/extranet/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email et mot de passe requis' });
        return;
      }

      const clientAccess = await prisma.clientAccess.findUnique({
        where: { email },
        include: { cabinet: true },
      });

      if (!clientAccess || !clientAccess.passwordHash) {
        res.status(401).json({ error: 'Identifiants invalides' });
        return;
      }

      if (!clientAccess.isActivated) {
        res.status(401).json({ error: 'Compte non activé' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, clientAccess.passwordHash);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Identifiants invalides' });
        return;
      }

      // Generate JWT token
      const secret = process.env.JWT_CLIENT_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT secret not configured');
      }

      const token = jwt.sign(
        {
          clientAccessId: clientAccess.id,
          email: clientAccess.email,
          cabinetId: clientAccess.cabinetId,
          type: 'client',
        },
        secret,
        { expiresIn: '7d' }
      );

      // Update last login
      await prisma.clientAccess.update({
        where: { id: clientAccess.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });

      // Log login
      await prisma.clientAccessLog.create({
        data: {
          clientAccessId: clientAccess.id,
          action: 'LOGIN',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Client logged in: ${email}`);

      res.json({
        token,
        client: {
          id: clientAccess.id,
          email: clientAccess.email,
          firstName: clientAccess.firstName,
          lastName: clientAccess.lastName,
          companyName: clientAccess.companyName,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const activationController = new ActivationController();
export default activationController;
