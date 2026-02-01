import { Request, Response, NextFunction } from 'express';
import { avocatLegalInfoService } from './avocat-legal-info.service';
import { ApiResponse } from '@/types';
import { BadRequestError } from '@/utils/errors';

export class AvocatLegalInfoController {
  /**
   * GET /api/avocat-legal-info/me
   * Get legal info for the current user
   */
  async getMyLegalInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await avocatLegalInfoService.getMyLegalInfo(
        req.user!.id,
        req.cabinetId!
      );

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
   * GET /api/avocat-legal-info/:id
   * Get legal info by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await avocatLegalInfoService.getById(
        req.params.id,
        req.user!.id,
        req.cabinetId!
      );

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
   * POST /api/avocat-legal-info
   * Create legal info profile
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await avocatLegalInfoService.create(
        req.user!.id,
        req.cabinetId!,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Informations légales créées avec succès',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/avocat-legal-info/:id
   * Update legal info profile
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await avocatLegalInfoService.update(
        req.params.id,
        req.user!.id,
        req.cabinetId!,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Informations légales mises à jour avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/avocat-legal-info/:id/signature
   * Upload signature image
   */
  async uploadSignature(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('Aucun fichier fourni');
      }

      const result = await avocatLegalInfoService.uploadSignature(
        req.params.id,
        req.user!.id,
        req.cabinetId!,
        req.file
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Signature téléchargée avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/avocat-legal-info/:id/cachet
   * Upload cachet/logo
   */
  async uploadCachet(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('Aucun fichier fourni');
      }

      const result = await avocatLegalInfoService.uploadCachet(
        req.params.id,
        req.user!.id,
        req.cabinetId!,
        req.file
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Cachet téléchargé avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/avocat-legal-info/:id/preview-mentions
   * Generate preview of legal mentions as HTML
   */
  async previewMentions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await avocatLegalInfoService.previewMentions(
        req.params.id,
        req.user!.id,
        req.cabinetId!
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const avocatLegalInfoController = new AvocatLegalInfoController();
