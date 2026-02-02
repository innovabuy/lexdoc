import { Request, Response, NextFunction } from 'express';
import { clientsService } from './clients.service';
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
  clientIdParamSchema,
} from './clients.schemas';

export class ClientsController {
  /**
   * GET /api/clients
   * List all clients
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const query = clientQuerySchema.parse(req.query);
      const result = await clientsService.list(cabinetId, query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clients/search
   * Search clients for autocomplete
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const query = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 10;

      const clients = await clientsService.search(cabinetId, query, limit);

      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clients/:id
   * Get a single client
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const { id } = clientIdParamSchema.parse(req.params);
      const client = await clientsService.getById(id, cabinetId);

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/clients
   * Create a new client
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const input = createClientSchema.parse(req.body);
      const client = await clientsService.create(cabinetId, input);

      res.status(201).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/clients/:id
   * Update a client
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const { id } = clientIdParamSchema.parse(req.params);
      const input = updateClientSchema.parse(req.body);
      const client = await clientsService.update(id, cabinetId, input);

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/clients/:id
   * Delete a client
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const cabinetId = req.cabinetId!;
      const { id } = clientIdParamSchema.parse(req.params);
      await clientsService.delete(id, cabinetId);

      res.json({
        success: true,
        message: 'Client supprime',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clientsController = new ClientsController();
