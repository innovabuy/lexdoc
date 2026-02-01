import { Request, Response, NextFunction } from 'express';
import { lrarService } from './lrar.service';
import { ApiResponse } from '@/types';

export class LrarController {
  /**
   * POST /api/lrar
   * Create a new LRAR shipment
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await lrarService.createLrar(
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: shipment,
        message: 'Envoi LRAR créé avec succès',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lrar
   * List LRAR shipments
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await lrarService.listLrar(req.cabinetId!, req.query as any);

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
   * GET /api/lrar/:id
   * Get LRAR shipment by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await lrarService.getLrar(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: shipment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/lrar/:id/cancel
   * Cancel LRAR shipment
   */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      await lrarService.cancelLrar(req.params.id, req.cabinetId!, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: 'Envoi LRAR annulé avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lrar/:id/proof
   * Download delivery proof (AR)
   */
  async downloadProof(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename } = await lrarService.downloadProof(
        req.params.id,
        req.cabinetId!
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const lrarController = new LrarController();
