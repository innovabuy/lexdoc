import { Request, Response, NextFunction } from 'express';
import { foldersService } from './folders.service';
import { ApiResponse } from '@/types';

export class FoldersController {
  /**
   * POST /api/folders
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = await foldersService.createFolder(
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: folder,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/folders
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foldersService.listFolders(
        req.cabinetId!,
        req.query as never
      );

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
   * GET /api/folders/tree
   */
  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await foldersService.getFolderTree(
        req.cabinetId!,
        req.query as never
      );

      const response: ApiResponse = {
        success: true,
        data: tree,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/folders/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = await foldersService.getFolder(
        req.params.id,
        req.cabinetId!
      );

      const response: ApiResponse = {
        success: true,
        data: folder,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/folders/:id/breadcrumb
   */
  async getBreadcrumb(req: Request, res: Response, next: NextFunction) {
    try {
      const breadcrumb = await foldersService.getBreadcrumb(
        req.params.id,
        req.cabinetId!
      );

      const response: ApiResponse = {
        success: true,
        data: breadcrumb,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/folders/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = await foldersService.updateFolder(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: folder,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/folders/:id/move
   */
  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = await foldersService.moveFolder(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: folder,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/folders/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await foldersService.deleteFolder(
        req.params.id,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        message: 'Folder deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/folders/:id/metadata
   * Update folder metadata only
   */
  async updateMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = await foldersService.updateMetadata(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: folder,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/folders/:id/auto-fill
   * Get folder data for document generation auto-fill
   */
  async getAutoFillData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await foldersService.getFolderForAutoFill(
        req.params.id,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const foldersController = new FoldersController();
