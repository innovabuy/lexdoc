import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class HttpError extends Error implements AppError {
  statusCode: number;
  code?: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code?: string) {
    super(message, 400, code || 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Non autorisé') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Accès refusé') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends HttpError {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super('Erreur de validation', 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class InternalError extends HttpError {
  constructor(message = 'Erreur interne du serveur') {
    super(message, 500, 'INTERNAL_ERROR');
    this.isOperational = false;
  }
}

// Format Zod errors
const formatZodError = (error: ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
};

// Format Prisma errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): HttpError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (error.meta?.target as string[])?.join(', ') || 'champ';
      return new ConflictError(`Un enregistrement avec ce ${target} existe déjà`);

    case 'P2025':
      // Record not found
      return new NotFoundError('Enregistrement non trouvé');

    case 'P2003':
      // Foreign key constraint
      return new BadRequestError('Référence invalide');

    case 'P2014':
      // Required relation violation
      return new BadRequestError('Une relation requise est manquante');

    default:
      logger.error('Unhandled Prisma error:', error);
      return new InternalError('Erreur de base de données');
  }
};

// Main error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: HttpError;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(formatZodError(err));
    res.status(422).json({
      error: validationError.message,
      code: validationError.code,
      errors: validationError.errors,
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err instanceof HttpError) {
    error = err;
  } else {
    // Unknown error
    logger.error('Unhandled error:', err);
    error = new InternalError();
  }

  // Log error details (but not for operational errors in production)
  if (!error.isOperational || process.env.NODE_ENV !== 'production') {
    logger.error(`[${error.statusCode}] ${error.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  const response: Record<string, any> = {
    error: error.message,
    code: error.code,
  };

  if (error instanceof ValidationError) {
    response.errors = error.errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Route non trouvée',
    code: 'NOT_FOUND',
    path: req.path,
  });
};

// Async handler wrapper to catch errors
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
