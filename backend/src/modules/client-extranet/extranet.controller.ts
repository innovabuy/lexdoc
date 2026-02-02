import { Request, Response, NextFunction } from 'express';
import { extranetService } from './extranet.service';
import {
  documentIdParamSchema,
  documentsQuerySchema,
} from './extranet.schemas';

export class ExtranetController {
  /**
   * GET /api/extranet/dashboard
   * Get client dashboard data
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const clientAccessId = req.clientAccessId!;
      const result = await extranetService.getDashboard(clientAccessId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/extranet/documents
   * Get documents for a client
   */
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const clientAccessId = req.clientAccessId!;
      const query = documentsQuerySchema.parse(req.query);
      const result = await extranetService.getDocuments(
        clientAccessId,
        query,
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
   * GET /api/extranet/documents/:id
   * Get a single document
   */
  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const clientAccessId = req.clientAccessId!;
      const { id } = documentIdParamSchema.parse(req.params);
      const document = await extranetService.getDocument(
        clientAccessId,
        id,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/extranet/folders
   * Get folders accessible to client
   */
  async getFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const clientAccessId = req.clientAccessId!;
      const folders = await extranetService.getFolders(clientAccessId);

      res.json({
        success: true,
        data: folders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/extranet/documents/:id/download
   * Get document download info and log access
   */
  async getDocumentDownload(req: Request, res: Response, next: NextFunction) {
    try {
      const clientAccessId = req.clientAccessId!;
      const { id } = documentIdParamSchema.parse(req.params);
      const document = await extranetService.getDocumentDownloadInfo(
        clientAccessId,
        id,
        req.ip,
        req.headers['user-agent']
      );

      // Return document info for frontend to handle actual download
      res.json({
        success: true,
        data: {
          id: document.id,
          filename: document.filename,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size.toString(),
          minioPath: document.minioPath,
          minioBucket: document.minioBucket,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/extranet/documents/:id/sign
   * Log sign document action
   */
  async signDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const clientAccessId = req.clientAccessId!;
      const { id } = documentIdParamSchema.parse(req.params);
      await extranetService.logSignDocument(
        clientAccessId,
        id,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        message: 'Action de signature enregistree',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const extranetController = new ExtranetController();
