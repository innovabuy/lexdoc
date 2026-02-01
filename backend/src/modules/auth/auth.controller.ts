import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '@/types';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Registration successful. Please check your email to verify your account.',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login/2fa
   */
  async login2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.loginWith2FA(req.body);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(req.user!.id, refreshToken);

      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'If an account exists with this email, a reset link has been sent',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Password reset successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      await authService.verifyEmail(token);

      const response: ApiResponse = {
        success: true,
        message: 'Email verified successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/resend-verification
   */
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resendVerification(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'If an unverified account exists with this email, a verification link has been sent',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/2fa/setup
   */
  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.setup2FA(req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/2fa/enable
   */
  async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      await authService.enable2FA(req.user!.id, code);

      const response: ApiResponse = {
        success: true,
        message: 'Two-factor authentication enabled',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/2fa/disable
   */
  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, code } = req.body;
      await authService.disable2FA(req.user!.id, password, code);

      const response: ApiResponse = {
        success: true,
        message: 'Two-factor authentication disabled',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
