import { Request, Response, NextFunction } from 'express';
import { documentTrackingService } from './document-tracking.service';
import { ApiResponse } from '@/types';

export class DocumentTrackingController {
  /**
   * GET /api/documents/:id/tracking
   * Get tracking info for a document
   */
  async getTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await documentTrackingService.getTracking(id, req.cabinetId!);

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
   * POST /api/documents/:id/send-for-signature
   * Send document for electronic signature
   */
  async sendForSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { signatories, message, deadline, autoReminders, reminderFrequency, maxReminders } = req.body;

      const result = await documentTrackingService.sendForSignature(req.cabinetId!, req.user!.id, {
        documentId: id,
        signatories,
        message,
        deadline: deadline ? new Date(deadline) : undefined,
        autoReminders,
        reminderFrequency,
        maxReminders,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Document envoye pour signature',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/send-lrar
   * Send document via LRAR
   */
  async sendLrar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { recipient, options } = req.body;

      const result = await documentTrackingService.sendLrar(req.cabinetId!, req.user!.id, {
        documentId: id,
        recipient,
        options,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Document envoye en LRAR',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/send-reminder
   * Send manual reminder for a document
   */
  async sendReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await documentTrackingService.sendReminder(id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Relance envoyee',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/cancel-signature
   * Cancel signature request
   */
  async cancelSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await documentTrackingService.cancelSignature(id, req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Signature annulee',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document-tracking
   * List all document trackings
   */
  async listTrackings(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, deliveryMethod, page, limit } = req.query;

      const result = await documentTrackingService.listTrackings(req.cabinetId!, {
        status: status as any,
        deliveryMethod: deliveryMethod as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

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
   * GET /api/document-tracking/stats
   * Get tracking statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await documentTrackingService.getStats(req.cabinetId!);

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
   * POST /api/webhooks/signature-status
   * Handle signature status webhook
   */
  async handleSignatureWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { signatureRequestId, status, signatories } = req.body;

      const signatoryUpdates = signatories?.map((s: any) => ({
        email: s.email,
        status: s.status,
        signedAt: s.signedAt ? new Date(s.signedAt) : undefined,
      }));

      await documentTrackingService.updateSignatureStatus(signatureRequestId, status, signatoryUpdates);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/webhooks/lrar-status
   * Handle LRAR status webhook
   */
  async handleLrarWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { lrarRequestId, status, trackingNumber, deliveredAt } = req.body;

      await documentTrackingService.updateLrarStatus(
        lrarRequestId,
        status,
        trackingNumber,
        deliveredAt ? new Date(deliveredAt) : undefined
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const documentTrackingController = new DocumentTrackingController();
