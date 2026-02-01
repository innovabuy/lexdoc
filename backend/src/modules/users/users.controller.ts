import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { ApiResponse } from '@/types';

export class UsersController {
  /**
   * GET /api/users
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.listUsers(req.cabinetId!, req.query as never);

      const response: ApiResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUser(req.user!.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/me
   */
  async updateCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUser(
        req.user!.id,
        req.cabinetId!,
        req.body,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/me/password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.changePassword(req.user!.id, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   */
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUser(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.createUser(req.cabinetId!, req.body, req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'User created. An invitation email has been sent.',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUser(
        req.params.id,
        req.cabinetId!,
        req.body,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/role
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUserRole(
        req.params.id,
        req.cabinetId!,
        req.body,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/status
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUserStatus(
        req.params.id,
        req.cabinetId!,
        req.body,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.deleteUser(req.params.id, req.cabinetId!, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
