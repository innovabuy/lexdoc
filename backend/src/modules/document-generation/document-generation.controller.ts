import { Request, Response, NextFunction } from 'express';
import { documentGenerationService } from './document-generation.service';
import { ApiResponse } from '@/types';

export class DocumentGenerationController {
  /**
   * POST /api/document-generation/preview
   * Generate HTML preview of document
   */
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentGenerationService.generatePreview(
        req.user!.id,
        req.cabinetId!,
        req.body
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
   * POST /api/document-generation/generate
   * Generate and save DOCX document
   */
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentGenerationService.generateDocument(
        req.user!.id,
        req.cabinetId!,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Document généré avec succès',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document-generation/:id/download
   * Download generated document
   */
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentGenerationService.downloadDocument(
        req.params.id,
        req.user!.id,
        req.cabinetId!
      );

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(result.filename)}"`
      );
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document-generation/:id/download-url
   * Get presigned download URL for document
   */
  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentGenerationService.getDocumentDownloadUrl(
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
   * POST /api/document-generation/:id/send-signature
   * Send document for electronic signature
   */
  async sendToSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentGenerationService.sendToSignature(
        req.params.id,
        req.user!.id,
        req.cabinetId!,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Document envoyé pour signature',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document-generation/:id/send-lrar
   * Send document via LRAR
   */
  async sendToLrar(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentGenerationService.sendToLrar(
        req.params.id,
        req.user!.id,
        req.cabinetId!,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Document envoyé par LRAR',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const documentGenerationController = new DocumentGenerationController();
