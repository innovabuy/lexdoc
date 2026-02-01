import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database';
import { config } from '@/config';
import { hashPassword, comparePassword, generateToken, generateUrlSafeToken } from '@/utils/crypto';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpiresIn,
} from '@/utils/jwt';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
  TwoFactorRequiredError,
} from '@/utils/errors';
import type {
  RegisterInput,
  LoginInput,
  Login2FAInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendVerificationInput,
} from './auth.schemas';

export class AuthService {
  /**
   * Register a new cabinet with admin user
   */
  async register(data: RegisterInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingCabinet = await prisma.cabinet.findUnique({
      where: { email: data.cabinetEmail.toLowerCase() },
    });

    if (existingCabinet) {
      throw new ConflictError('Cabinet email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create cabinet and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create cabinet
      const cabinet = await tx.cabinet.create({
        data: {
          name: data.cabinetName,
          email: data.cabinetEmail.toLowerCase(),
          siret: data.siret,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'ADMIN',
          cabinetId: cabinet.id,
          verifyToken: generateUrlSafeToken(32),
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          cabinetId: cabinet.id,
          userId: user.id,
          action: 'USER_CREATED',
          entity: 'User',
          entityId: user.id,
          details: { method: 'register' },
        },
      });

      return { cabinet, user };
    });

    // TODO: Send verification email

    return {
      cabinet: {
        id: result.cabinet.id,
        name: result.cabinet.name,
        email: result.cabinet.email,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        cabinet: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (user.cabinet.status === 'SUSPENDED' || user.cabinet.status === 'CANCELED') {
      throw new UnauthorizedError('Cabinet subscription is inactive');
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if 2FA is required
    if (user.twoFactorEnabled) {
      throw new TwoFactorRequiredError();
    }

    // Generate tokens
    return this.generateAuthTokens(user);
  }

  /**
   * Login with 2FA
   */
  async loginWith2FA(data: Login2FAInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        cabinet: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password first
    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify 2FA code
    if (!user.twoFactorSecret) {
      throw new BadRequestError('2FA is not enabled for this account');
    }

    const isValidCode = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: data.code,
      window: config.twoFactor.window,
    });

    if (!isValidCode) {
      throw new UnauthorizedError('Invalid 2FA code');
    }

    return this.generateAuthTokens(user);
  }

  /**
   * Generate auth tokens for a user
   */
  private async generateAuthTokens(user: {
    id: string;
    email: string;
    role: string;
    cabinetId: string;
    cabinet: { id: string; name: string };
    firstName: string;
    lastName: string;
    twoFactorEnabled: boolean;
  }) {
    const tokenId = uuidv4();

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      cabinetId: user.cabinetId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId,
    });

    // Store refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokens: { push: tokenId },
        lastLoginAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId: user.cabinetId,
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenExpiresIn(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        cabinet: user.cabinet,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenValue: string) {
    const payload = verifyRefreshToken(refreshTokenValue);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        cabinet: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Verify token ID is in stored tokens
    if (!user.refreshTokens.includes(payload.tokenId)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Remove old token and generate new
    const newTokenId = uuidv4();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokens: {
          set: user.refreshTokens.filter((t) => t !== payload.tokenId).concat(newTokenId),
        },
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      cabinetId: user.cabinetId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: newTokenId,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: getAccessTokenExpiresIn(),
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);

        await prisma.user.update({
          where: { id: userId },
          data: {
            refreshTokens: {
              set: (
                await prisma.user.findUnique({
                  where: { id: userId },
                  select: { refreshTokens: true },
                })
              )?.refreshTokens.filter((t) => t !== payload.tokenId),
            },
          },
        });
      } catch {
        // Ignore invalid token errors during logout
      }
    }

    // Audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cabinetId: true },
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          cabinetId: user.cabinetId,
          userId,
          action: 'USER_LOGOUT',
          entity: 'User',
          entityId: userId,
        },
      });
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || user.deletedAt) {
      return;
    }

    const resetToken = generateUrlSafeToken(32);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send password reset email
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordInput) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(data.password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        refreshTokens: [], // Invalidate all sessions
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId: user.cabinetId,
        userId: user.id,
        action: 'USER_PASSWORD_RESET',
        entity: 'User',
        entityId: user.id,
      },
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      throw new BadRequestError('Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verifyToken: null,
      },
    });
  }

  /**
   * Resend verification email
   */
  async resendVerification(data: ResendVerificationInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || user.deletedAt) {
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      throw new BadRequestError('Email is already verified');
    }

    // Generate new verification token
    const verifyToken = generateUrlSafeToken(32);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken },
    });

    // TODO: Send verification email
  }

  /**
   * Setup 2FA - generate secret and QR code
   */
  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestError('2FA is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `${config.twoFactor.issuer}:${user.email}`,
      issuer: config.twoFactor.issuer,
    });

    // Store secret temporarily (will be confirmed on enable)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  /**
   * Enable 2FA after verifying code
   */
  async enable2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('Please setup 2FA first');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: config.twoFactor.window,
    });

    if (!isValid) {
      throw new BadRequestError('Invalid verification code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId: user.cabinetId,
        userId: user.id,
        action: 'USER_2FA_ENABLED',
        entity: 'User',
        entityId: user.id,
      },
    });
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, password: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid password');
    }

    // Verify 2FA code
    if (!user.twoFactorSecret) {
      throw new BadRequestError('2FA is not enabled');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: config.twoFactor.window,
    });

    if (!isValid) {
      throw new BadRequestError('Invalid verification code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId: user.cabinetId,
        userId: user.id,
        action: 'USER_2FA_DISABLED',
        entity: 'User',
        entityId: user.id,
      },
    });
  }
}

export const authService = new AuthService();
