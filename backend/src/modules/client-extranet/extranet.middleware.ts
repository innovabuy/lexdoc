import { Request, Response, NextFunction } from 'express';
import { extranetAuthService } from './extranet-auth.service';
import { UnauthorizedError } from '@/utils/errors';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      clientAccessId?: string;
      clientEmail?: string;
      clientCabinetId?: string;
    }
  }
}

/**
 * Middleware to authenticate client extranet access
 */
export async function authenticateClient(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token non fourni');
    }

    const token = authHeader.substring(7);
    const payload = extranetAuthService.verifyClientToken(token);

    // Verify it's a client token
    if (payload.type !== 'client') {
      throw new UnauthorizedError('Token invalide');
    }

    // Set client context
    req.clientAccessId = payload.clientAccessId;
    req.clientEmail = payload.email;
    req.clientCabinetId = payload.cabinetId;

    next();
  } catch (error) {
    next(error);
  }
}
