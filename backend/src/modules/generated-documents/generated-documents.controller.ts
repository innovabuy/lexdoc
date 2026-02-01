import { Request, Response, NextFunction } from 'express';
import { generatedDocumentsService } from './generated-documents.service';
import { signaturesService } from '@/modules/signatures/signatures.service';
import { generatedDocumentLrarService } from '@/modules/lrar/lrar.service';
import { ApiResponse } from '@/types';
import type { SendSignatureRequestInput, SendLrarRequestInput } from './generated-documents.schemas';

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

  /**
   * POST /api/generated-documents/:id/send-signature
   * Send document for electronic signature via Universign
   */
  async sendSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as SendSignatureRequestInput;

      const result = await signaturesService.createSignatureRequestFromDocument(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        input.signatories,
        {
          signingOrder: input.signingOrder,
          customMessage: input.customMessage,
          profile: input.profile,
        }
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Document envoye en signature avec succes',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/generated-documents/:id/signature-status
   * Get signature status for a document
   */
  async getSignatureStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.getById(req.params.id, req.cabinetId!);

      const workflowStatus = (document.workflowStatus || {}) as Record<string, any>;
      const signatureStatus = workflowStatus.signature || null;

      const response: ApiResponse = {
        success: true,
        data: signatureStatus,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/generated-documents/:id/download-signed
   * Download the signed document
   */
  async downloadSignedDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await generatedDocumentsService.getById(req.params.id, req.cabinetId!);

      const workflowStatus = (document.workflowStatus || {}) as Record<string, any>;
      const signedPath = workflowStatus.signature?.signedDocumentPath;

      if (!signedPath) {
        return res.status(404).json({
          success: false,
          message: 'Document signe non disponible',
        });
      }

      const { minioClient } = await import('@/config/minio');
      const { config } = await import('@/config');

      const stream = await minioClient.getObject(config.minio.buckets.documents, signedPath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.title}_signed.pdf"`);

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /api/generated-documents/:id/send-lrar
   * Send document via LRAR (registered mail)
   */
  async sendLrar(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as SendLrarRequestInput;

      const result = await generatedDocumentLrarService.sendDocumentAsLRAR(
        req.params.id,
        req.cabinetId!,
        req.user!.id,
        input.recipient,
        input.options
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Document envoye en LRAR avec succes',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/generated-documents/:id/lrar-tracking
   * Get LRAR tracking status for a document
   */
  async getLrarTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const tracking = await generatedDocumentLrarService.getTrackingStatus(
        req.params.id,
        req.cabinetId!
      );

      const response: ApiResponse = {
        success: true,
        data: tracking,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/generated-documents/:id/download-ar
   * Download the delivery proof (AR)
   */
  async downloadAR(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename } = await generatedDocumentLrarService.downloadProof(
        req.params.id,
        req.cabinetId!
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const generatedDocumentsController = new GeneratedDocumentsController();
