import { Request, Response, NextFunction } from 'express';
import { extranetAuthService } from './extranet-auth.service';
import {
  activationTokenParamSchema,
  activateAccountSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetTokenParamSchema,
} from './extranet-auth.schemas';

export class ExtranetAuthController {
  /**
   * GET /api/extranet/auth/activate/:token
   * Check if activation token is valid
   */
  async checkActivationToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = activationTokenParamSchema.parse(req.params);
      const result = await extranetAuthService.checkActivationToken(token);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/extranet/auth/activate/:token
   * Activate a client account
   */
  async activateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = activationTokenParamSchema.parse(req.params);
      const input = activateAccountSchema.parse(req.body);
      const result = await extranetAuthService.activateAccount(token, input);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/extranet/auth/login
   * Login a client
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await extranetAuthService.login(
        input,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/extranet/auth/forgot-password
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = forgotPasswordSchema.parse(req.body);
      const result = await extranetAuthService.forgotPassword(input.email);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/extranet/auth/reset-password/:token
   * Check if reset token is valid
   */
  async checkResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = resetTokenParamSchema.parse(req.params);
      const result = await extranetAuthService.checkResetToken(token);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/extranet/auth/reset-password/:token
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = resetTokenParamSchema.parse(req.params);
      const input = resetPasswordSchema.parse(req.body);
      const result = await extranetAuthService.resetPassword(
        token,
        input,
        req.ip,
        req.headers['user-agent']
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const extranetAuthController = new ExtranetAuthController();
