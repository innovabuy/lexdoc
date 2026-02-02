import { Request, Response, NextFunction } from 'express';
import { clientAccessService } from './client-access.service';
import {
  inviteClientSchema,
  updatePermissionsSchema,
  clientAccessIdParamSchema,
  clientAccessQuerySchema,
} from './client-access.schemas';
import { prisma } from '@/config/database';

export class ClientAccessController {
  /**
   * POST /api/client-access/invite
   * Invite a client to access the extranet
   */
  async inviteClient(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const userId = req.user!.id;
      const input = inviteClientSchema.parse(req.body);

      // Get cabinet and user info for email
      const [cabinet, user] = await Promise.all([
        prisma.cabinet.findUnique({ where: { id: cabinetId }, select: { name: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } }),
      ]);

      const result = await clientAccessService.inviteClient(
        cabinetId,
        userId,
        input,
        cabinet?.name || 'Cabinet',
        `${user?.firstName} ${user?.lastName}`
      );

      res.status(201).json({
        success: true,
        data: result.clientAccess,
        activationUrl: result.activationUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/client-access
   * List all client accesses
   */
  async listClientAccesses(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const query = clientAccessQuerySchema.parse(req.query);
      const result = await clientAccessService.listClientAccesses(cabinetId, query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/client-access/:id
   * Get a single client access
   */
  async getClientAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const { id } = clientAccessIdParamSchema.parse(req.params);
      const clientAccess = await clientAccessService.getClientAccess(id, cabinetId);

      res.json({
        success: true,
        data: clientAccess,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/client-access/:id/permissions
   * Update client access permissions
   */
  async updatePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const { id } = clientAccessIdParamSchema.parse(req.params);
      const input = updatePermissionsSchema.parse(req.body);
      const clientAccess = await clientAccessService.updatePermissions(id, cabinetId, input);

      res.json({
        success: true,
        data: clientAccess,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/client-access/:id/resend-invitation
   * Resend invitation email
   */
  async resendInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const userId = req.user!.id;
      const { id } = clientAccessIdParamSchema.parse(req.params);

      // Get cabinet and user info for email
      const [cabinet, user] = await Promise.all([
        prisma.cabinet.findUnique({ where: { id: cabinetId }, select: { name: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } }),
      ]);

      const result = await clientAccessService.resendInvitation(
        id,
        cabinetId,
        cabinet?.name || 'Cabinet',
        `${user?.firstName} ${user?.lastName}`
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/client-access/:id
   * Delete client access
   */
  async deleteClientAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const { id } = clientAccessIdParamSchema.parse(req.params);
      const result = await clientAccessService.deleteClientAccess(id, cabinetId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/client-access/:id/logs
   * Get access logs
   */
  async getAccessLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const { id } = clientAccessIdParamSchema.parse(req.params);
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await clientAccessService.getAccessLogs(id, cabinetId, limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clientAccessController = new ClientAccessController();
