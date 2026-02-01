import { Request, Response, NextFunction } from 'express';
import { signaturesService } from './signatures.service';
import { ApiResponse } from '@/types';

export class SignaturesController {
  /**
   * POST /api/signatures
   * Create a new signature transaction
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = await signaturesService.createSignature(
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: signature,
        message: 'Demande de signature créée avec succès',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/signatures
   * List signature transactions
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await signaturesService.listSignatures(req.cabinetId!, req.query as any);

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
   * GET /api/signatures/:id
   * Get signature transaction by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = await signaturesService.getSignature(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: signature,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/signatures/:id/cancel
   * Cancel signature transaction
   */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      await signaturesService.cancelSignature(req.params.id, req.cabinetId!, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: 'Signature annulée avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/signatures/:id/remind
   * Send reminder to signatory
   */
  async remind(req: Request, res: Response, next: NextFunction) {
    try {
      await signaturesService.remindSigner(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body.signerEmail
      );

      const response: ApiResponse = {
        success: true,
        message: 'Rappel envoyé avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/signatures/:id/download
   * Download signed document
   */
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename } = await signaturesService.downloadSignedDocument(
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

  /**
   * GET /api/signatures/:id/certificates
   * Download certificates
   */
  async downloadCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename } = await signaturesService.downloadCertificates(
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

export const signaturesController = new SignaturesController();
