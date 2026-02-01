import { Request, Response, NextFunction } from 'express';
import { prisma, setTenantContext } from '@/config/database';
import { verifyAccessToken } from '@/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';
import { UserRole } from '@prisma/client';

/**
 * Authentication middleware - verifies JWT and loads user
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        cabinetId: true,
        twoFactorEnabled: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Set user and cabinet context
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      cabinetId: user.cabinetId,
      twoFactorEnabled: user.twoFactorEnabled,
    };
    req.cabinetId = user.cabinetId;

    // Set tenant context for RLS
    await setTenantContext(user.cabinetId);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  return authenticate(req, res, next);
}

/**
 * Require specific roles
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        new ForbiddenError(`This action requires one of the following roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Require admin or avocat role
 */
export const requireAdminOrAvocat = requireRole('ADMIN', 'AVOCAT');
