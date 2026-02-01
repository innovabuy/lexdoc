import { Request, Response, NextFunction } from 'express';
import { templatesService } from './templates.service';
import { ApiResponse } from '@/types';

export class TemplatesController {
  /**
   * GET /api/templates
   */
  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await templatesService.listTemplates(req.cabinetId!, req.query as never);

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
   * GET /api/templates/categories
   */
  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await templatesService.getCategories();

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
   * GET /api/templates/:id
   */
  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await templatesService.getTemplate(req.params.id, req.cabinetId!);

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
   * POST /api/templates
   */
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A DOCX file is required',
          },
        });
        return;
      }

      const template = await templatesService.createTemplate(
        req.cabinetId!,
        req.body,
        req.file,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: template,
        message: 'Template created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/templates/:id
   */
  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await templatesService.updateTemplate(
        req.params.id,
        req.cabinetId!,
        req.body,
        req.user!.id
      );

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
   * DELETE /api/templates/:id
   */
  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      await templatesService.deleteTemplate(req.params.id, req.cabinetId!, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: 'Template deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/templates/:id/variables
   */
  async getTemplateVariables(req: Request, res: Response, next: NextFunction) {
    try {
      const variables = await templatesService.getTemplateVariables(req.params.id, req.cabinetId!);

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
   * POST /api/templates/:id/generate
   */
  async generateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await templatesService.generateDocument(
        req.params.id,
        req.cabinetId!,
        req.body,
        req.user!.id
      );

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document generated successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/templates/:id/preview
   */
  async previewTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename } = await templatesService.generatePreview(
        req.params.id,
        req.cabinetId!,
        req.body?.data
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const templatesController = new TemplatesController();
