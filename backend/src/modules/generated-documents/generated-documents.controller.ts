import { Request, Response, NextFunction } from 'express';
import { generatedDocumentsService } from './generated-documents.service';
import { ApiResponse } from '@/types';

export class GeneratedDocumentsController {
  /**
   * GET /api/generated-documents
   * List all generated documents with filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await generatedDocumentsService.list(req.cabinetId!, req.query as any);

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
   * GET /api/generated-documents/stats
   * Get statistics for generated documents
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await generatedDocumentsService.getStats(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/generated-documents/:id
   * Get a single generated document
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.getById(req.params.id, req.cabinetId!);

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
   * GET /api/generated-documents/:id/preview
   * Get preview/rendered content
   */
  async getPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const preview = await generatedDocumentsService.getPreview(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: preview,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/generated-documents
   * Create a new generated document
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.create(
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/generated-documents/:id
   * Update a generated document
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.update(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/generated-documents/:id/finalize
   * Finalize a document
   */
  async finalize(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.finalize(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document finalized successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/generated-documents/:id/regenerate
   * Regenerate content from template
   */
  async regenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.regenerate(
        req.params.id,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document regenerated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/generated-documents/:id
   * Soft delete a generated document
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await generatedDocumentsService.delete(req.params.id, req.cabinetId!);

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
   * POST /api/generated-documents/:id/duplicate
   * Duplicate a generated document
   */
  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.duplicate(
        req.params.id,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document duplicated successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const generatedDocumentsController = new GeneratedDocumentsController();
