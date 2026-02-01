import { Request, Response, NextFunction } from 'express';
import { builderTemplatesService } from './builder-templates.service';
import { ApiResponse } from '@/types';

export class BuilderTemplatesController {
  /**
   * GET /api/builder-templates
   * List all builder templates with filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await builderTemplatesService.list(req.cabinetId!, req.query as any);

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
   * GET /api/builder-templates/by-type/:documentType
   * Get all templates for a specific document type
   */
  async getByDocumentType(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await builderTemplatesService.getByDocumentType(
        req.cabinetId!,
        req.params.documentType as any
      );

      const response: ApiResponse = {
        success: true,
        data: templates,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/builder-templates/document-types
   * Get all document types with counts
   */
  async getDocumentTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = await builderTemplatesService.getDocumentTypes(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: types,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/builder-templates/juridictions
   * Get all juridictions with counts
   */
  async getJuridictions(req: Request, res: Response, next: NextFunction) {
    try {
      const juridictions = await builderTemplatesService.getJuridictions(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: juridictions,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/builder-templates/:id
   * Get a single builder template with expanded blocks
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await builderTemplatesService.getById(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: template,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/builder-templates/:id/variables
   * Get all required variables for a template
   */
  async getVariables(req: Request, res: Response, next: NextFunction) {
    try {
      const variables = await builderTemplatesService.getTemplateVariables(
        req.params.id,
        req.cabinetId!
      );

      const response: ApiResponse = {
        success: true,
        data: variables,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/builder-templates
   * Create a new builder template
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await builderTemplatesService.create(
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: template,
        message: 'Builder template created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/builder-templates/:id
   * Update a builder template
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await builderTemplatesService.update(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: template,
        message: 'Builder template updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/builder-templates/:id
   * Soft delete a builder template
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await builderTemplatesService.delete(req.params.id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        message: 'Builder template deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/builder-templates/:id/duplicate
   * Duplicate a builder template
   */
  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await builderTemplatesService.duplicate(
        req.params.id,
        req.cabinetId!,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: template,
        message: 'Builder template duplicated successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/builder-templates/:id/preview
   * Generate a preview of the document from template
   */
  async generatePreview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await builderTemplatesService.generatePreview(
        req.params.id,
        req.cabinetId!,
        req.body.variables || {}
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

export const builderTemplatesController = new BuilderTemplatesController();
