import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';
import { AppError, ValidationError } from '@/utils/errors';
import { ApiResponse } from '@/types';

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  };

  res.status(404).json(response);
}

/**
 * Global error handler
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  if (err instanceof AppError && err.statusCode < 500) {
    logger.warn('Client error:', {
      message: err.message,
      code: err.code,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
    });
  } else {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      userId: req.user?.id,
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let statusCode = 500;
    let code = 'DATABASE_ERROR';
    let message = 'Database error';

    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      message = `A record with this ${target} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      code = 'FOREIGN_KEY_VIOLATION';
      message = 'Referenced record not found';
    }

    const response: ApiResponse = {
      success: false,
      error: { code, message },
    };

    res.status(statusCode).json(response);
    return;
  }

  // Validation errors
  if (err instanceof ValidationError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.errors,
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Unknown errors
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  };

  res.status(statusCode).json(response);
}
