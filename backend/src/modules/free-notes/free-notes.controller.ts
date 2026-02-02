import { Request, Response, NextFunction } from 'express';
import { freeNotesService } from './free-notes.service';
import { CreateFreeNoteInput, UpdateFreeNoteInput, ConvertToBlockInput } from './free-notes.schemas';

class FreeNotesController {
  /**
   * Get all free notes for a folder
   * GET /api/folders/:folderId/free-notes
   */
  async getByFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { folderId } = req.params;
      const { linkedCategory, search } = req.query as { linkedCategory?: any; search?: string };

      const notes = await freeNotesService.getByFolder(
        folderId,
        req.cabinetId!,
        { linkedCategory, search }
      );

      res.json({
        success: true,
        data: notes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single free note by ID
   * GET /api/free-notes/:noteId
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { noteId } = req.params;

      const note = await freeNotesService.getById(noteId, req.cabinetId!);

      if (!note) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Note non trouvée' },
        });
      }

      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new free note for a folder
   * POST /api/folders/:folderId/free-notes
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { folderId } = req.params;
      const data = req.body as CreateFreeNoteInput;

      const note = await freeNotesService.create(
        folderId,
        req.cabinetId!,
        req.user!.id,
        data
      );

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error: any) {
      if (error.message === 'Dossier non trouvé') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }

  /**
   * Update a free note
   * PUT /api/free-notes/:noteId
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { noteId } = req.params;
      const data = req.body as UpdateFreeNoteInput;

      const note = await freeNotesService.update(noteId, req.cabinetId!, data);

      res.json({
        success: true,
        data: note,
      });
    } catch (error: any) {
      if (error.message === 'Note non trouvée') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }

  /**
   * Delete a free note
   * DELETE /api/free-notes/:noteId
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { noteId } = req.params;

      await freeNotesService.delete(noteId, req.cabinetId!);

      res.json({
        success: true,
        message: 'Note supprimée',
      });
    } catch (error: any) {
      if (error.message === 'Note non trouvée') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }

  /**
   * Convert a free note to a reusable block
   * POST /api/free-notes/:noteId/convert-to-block
   */
  async convertToBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const { noteId } = req.params;
      const data = req.body as ConvertToBlockInput;

      const block = await freeNotesService.convertToBlock(
        noteId,
        req.cabinetId!,
        req.user!.id,
        data
      );

      res.status(201).json({
        success: true,
        data: block,
        message: 'Note convertie en bloc réutilisable',
      });
    } catch (error: any) {
      if (error.message === 'Note non trouvée') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }

  /**
   * Get all free notes for the cabinet
   * GET /api/free-notes
   */
  async getAllForCabinet(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query as { search?: string };

      const notes = await freeNotesService.getAllForCabinet(req.cabinetId!, search);

      res.json({
        success: true,
        data: notes,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const freeNotesController = new FreeNotesController();
