import { Request, Response, NextFunction } from 'express';
import { documentBlocksService } from './document-blocks.service';
import { ApiResponse } from '@/types';

export class DocumentBlocksController {
  /**
   * GET /api/document-blocks
   * List all document blocks with filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentBlocksService.list(req.cabinetId!, req.query as any);

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
   * GET /api/document-blocks/categories
   * Get all categories with counts
   */
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await documentBlocksService.getCategories(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: categories,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document-blocks/tags
   * Get all tags with counts
   */
  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await documentBlocksService.getTags(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: tags,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document-blocks/:id
   * Get a single document block
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await documentBlocksService.getById(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: block,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document-blocks
   * Create a new document block
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await documentBlocksService.create(req.cabinetId!, req.user!.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: block,
        message: 'Document block created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/document-blocks/:id
   * Update a document block
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await documentBlocksService.update(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: block,
        message: 'Document block updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/document-blocks/:id
   * Soft delete a document block
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await documentBlocksService.delete(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        message: 'Document block deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document-blocks/:id/duplicate
   * Duplicate a document block
   */
  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await documentBlocksService.duplicate(
        req.params.id,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: block,
        message: 'Document block duplicated successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document-blocks/extract-variables
   * Extract variables from template content (utility endpoint)
   */
  async extractVariables(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Content is required' },
        });
      }

      const variables = documentBlocksService.extractVariables(content);
      const validation = documentBlocksService.validateHandlebarsSyntax(content);

      const response: ApiResponse = {
        success: true,
        data: {
          variables,
          validation,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const documentBlocksController = new DocumentBlocksController();
