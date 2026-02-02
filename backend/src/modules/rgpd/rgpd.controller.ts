import { Request, Response, NextFunction } from 'express';
import { rgpdService } from './rgpd.service';
import { ApiResponse } from '@/types';

class RgpdController {
  // ============================================
  // CONSENT ENDPOINTS
  // ============================================

  /**
   * POST /api/rgpd/consent
   * Record a new consent (can be public or authenticated)
   */
  async recordConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const consent = await rgpdService.recordConsent(
        req.body,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: consent,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rgpd/consent/:id/revoke
   * Revoke a consent
   */
  async revokeConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const consent = await rgpdService.revokeConsent(
        req.params.id,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: consent,
        message: 'Consentement révoqué avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rgpd/consents
   * List consents (admin)
   */
  async listConsents(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rgpdService.listConsents(
        req.cabinetId!,
        req.query as any
      );

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
   * GET /api/rgpd/clients/:clientId/consents
   * Get consents for a specific client
   */
  async getClientConsents(req: Request, res: Response, next: NextFunction) {
    try {
      const consents = await rgpdService.getClientConsents(req.params.clientId);

      const response: ApiResponse = {
        success: true,
        data: consents,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // DATA REQUEST ENDPOINTS
  // ============================================

  /**
   * POST /api/rgpd/requests (public)
   * Submit a new data request
   */
  async submitDataRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await rgpdService.submitDataRequest(
        req.body,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: result.message,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rgpd/requests/verify/:token (public)
   * Verify a data request
   */
  async verifyDataRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await rgpdService.verifyDataRequest(req.params.token);

      const response: ApiResponse = {
        success: true,
        data: request,
        message: 'Demande vérifiée avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rgpd/requests
   * List data requests (admin)
   */
  async listDataRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rgpdService.listDataRequests(
        req.cabinetId!,
        req.query as any
      );

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
   * GET /api/rgpd/requests/:id
   * Get a single data request
   */
  async getDataRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await rgpdService.getDataRequest(
        req.params.id,
        req.cabinetId!
      );

      const response: ApiResponse = {
        success: true,
        data: request,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rgpd/requests/:id/process
   * Process a data request (admin)
   */
  async processDataRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const request = await rgpdService.processDataRequest(
        { requestId: req.params.id, ...req.body },
        req.user!.id,
        req.cabinetId!,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: request,
        message: 'Demande traitée avec succès',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rgpd/clients/:clientId/export
   * Export client data (portability)
   */
  async exportClientData(req: Request, res: Response, next: NextFunction) {
    try {
      const exportData = await rgpdService.exportClientData(
        req.params.clientId,
        req.cabinetId!
      );

      const response: ApiResponse = {
        success: true,
        data: exportData,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rgpd/clients/:clientId/anonymize
   * Anonymize client data (erasure)
   */
  async anonymizeClientData(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await rgpdService.anonymizeClientData(
        req.params.clientId,
        req.cabinetId!,
        req.user!.id,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: result.message,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // RETENTION ENDPOINTS
  // ============================================

  /**
   * POST /api/rgpd/retention
   * Create a retention policy
   */
  async createRetentionPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = await rgpdService.createRetentionPolicy(req.body);

      const response: ApiResponse = {
        success: true,
        data: policy,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rgpd/retention/:entityType/:entityId
   * Get retention policy for an entity
   */
  async getRetentionPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = await rgpdService.getRetentionPolicy(
        req.params.entityType,
        req.params.entityId
      );

      const response: ApiResponse = {
        success: true,
        data: policy,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/rgpd/retention/:entityType/:entityId
   * Update retention policy
   */
  async updateRetentionPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = await rgpdService.updateRetentionPolicy(
        req.params.entityType,
        req.params.entityId,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: policy,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // AUDIT & DASHBOARD ENDPOINTS
  // ============================================

  /**
   * GET /api/rgpd/audit
   * Get RGPD audit logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await rgpdService.getAuditLogs({
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        action: req.query.action as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        data: logs,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rgpd/dashboard
   * Get RGPD dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await rgpdService.getDashboardStats(req.cabinetId!);

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const rgpdController = new RgpdController();
