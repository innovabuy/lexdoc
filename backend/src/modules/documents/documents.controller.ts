import { Request, Response, NextFunction } from 'express';
import { documentsService } from './documents.service';
import { ApiResponse } from '@/types';
import { BadRequestError } from '@/utils/errors';

export class DocumentsController {
  /**
   * POST /api/documents/upload
   */
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file;
      const { folderId, name, description, type } = req.body;

      if (!folderId) {
        throw new BadRequestError('Folder ID is required');
      }

      let result;

      if (files && files.length > 0) {
        // Multiple files upload
        result = await documentsService.uploadDocuments(
          files,
          req.cabinetId!,
          folderId,
          req.user!.id
        );
      } else if (file) {
        // Single file upload
        result = await documentsService.uploadDocument(
          file,
          req.cabinetId!,
          folderId,
          req.user!.id,
          { name, description, type, folderId }
        );
      } else {
        throw new BadRequestError('No files provided');
      }

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.listDocuments(req.cabinetId!, req.query as never);

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
   * GET /api/documents/search
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.searchDocuments(req.cabinetId!, req.query as never);

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
   * GET /api/documents/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await documentsService.getDocument(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: document,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/documents/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await documentsService.updateDocument(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: document,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/documents/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await documentsService.deleteDocument(req.params.id, req.cabinetId!, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: 'Document deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/download
   */
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, mimeType, filename } = await documentsService.downloadDocument(
        req.params.id,
        req.cabinetId!
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/preview
   */
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, mimeType, filename } = await documentsService.downloadDocument(
        req.params.id,
        req.cabinetId!
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/documents/:id/move
   */
  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const { folderId } = req.body;

      const document = await documentsService.moveDocument(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        folderId
      );

      const response: ApiResponse = {
        success: true,
        data: document,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/bulk-move
   */
  async bulkMove(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentIds, folderId } = req.body;

      const result = await documentsService.bulkMoveDocuments(
        documentIds,
        req.cabinetId!,
        req.user!.id,
        folderId
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
   * POST /api/documents/bulk-delete
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentIds } = req.body;

      const result = await documentsService.bulkDeleteDocuments(
        documentIds,
        req.cabinetId!,
        req.user!.id
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
   * POST /api/documents/:id/duplicate
   */
  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await documentsService.duplicateDocument(
        req.params.id,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: document,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/versions
   */
  async getVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const versions = await documentsService.getVersions(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: versions,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/versions
   */
  async createVersion(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('No file provided');
      }

      const version = await documentsService.createVersion(
        req.params.id,
        req.file,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: version,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/versions/:versionId/restore
   */
  async restoreVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const version = await documentsService.restoreVersion(
        req.params.id,
        req.params.versionId,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: version,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const documentsController = new DocumentsController();
