import { Request, Response, NextFunction } from 'express';
import { setTenantContext, clearTenantContext } from '@/config/database';
import { UnauthorizedError } from '@/utils/errors';

/**
 * Tenant isolation middleware
 * Ensures RLS context is set for every database operation
 */
export async function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Skip for routes that don't require tenant context
    const publicPaths = ['/api/health', '/api/auth/login', '/api/auth/register'];
    if (publicPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const cabinetId = req.cabinetId || req.user?.cabinetId;

    if (!cabinetId) {
      throw new UnauthorizedError('Cabinet context not found');
    }

    // Set RLS context
    await setTenantContext(cabinetId);

    // Clear context after response
    const cleanup = async () => {
      await clearTenantContext();
    };

    req.on('close', cleanup);
    req.on('end', cleanup);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to verify user belongs to the requested cabinet
 */
export function verifyCabinetAccess(paramName = 'cabinetId') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const requestedCabinetId = req.params[paramName] || req.body[paramName];

    if (requestedCabinetId && requestedCabinetId !== req.cabinetId) {
      return next(new UnauthorizedError('Access denied to this cabinet'));
    }

    next();
  };
}
