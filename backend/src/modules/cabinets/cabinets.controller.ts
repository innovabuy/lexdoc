import { Request, Response, NextFunction } from 'express';
import { cabinetsService } from './cabinets.service';
import { ApiResponse } from '@/types';

export class CabinetsController {
  /**
   * GET /api/cabinets/me
   */
  async getCabinet(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinet = await cabinetsService.getCabinet(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: cabinet,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/cabinets/me
   */
  async updateCabinet(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinet = await cabinetsService.updateCabinet(
        req.cabinetId!,
        req.body,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: cabinet,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cabinets/me/stats
   */
  async getCabinetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await cabinetsService.getCabinetStats(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const cabinetsController = new CabinetsController();
