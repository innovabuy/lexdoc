const logger = require('../config/logger');
const { captureException, setUser, addBreadcrumb } = require('../config/sentry');
const { AppError } = require('../utils/errors');

/**
 * Determine if an error should be reported to Sentry
 * @param {Error} err - The error to check
 * @returns {boolean} Whether to report to Sentry
 */
const shouldReportToSentry = (err) => {
  // Don't report client errors (4xx)
  if (err instanceof AppError && err.statusCode < 500) {
    return false;
  }

  // Don't report JWT errors (authentication failures)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return false;
  }

  // Don't report validation errors
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return false;
  }

  // Don't report Prisma unique constraint violations (P2002)
  if (err.code === 'P2002') {
    return false;
  }

  // Don't report Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return false;
  }

  // Report everything else (5xx errors, unknown errors)
  return true;
};

/**
 * Get error severity level for Sentry
 * @param {Error} err - The error
 * @returns {string} Sentry severity level
 */
const getErrorLevel = (err) => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) return 'error';
    if (err.statusCode >= 400) return 'warning';
  }

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    // Connection errors are critical
    if (err.code === 'P1001' || err.code === 'P1002') return 'fatal';
    return 'error';
  }

  return 'error';
};

const errorHandler = (err, req, res, next) => {
  // Add breadcrumb for debugging in Sentry
  addBreadcrumb({
    category: 'http',
    message: `${req.method} ${req.originalUrl} failed`,
    level: 'error',
    data: {
      statusCode: err.statusCode || 500,
      errorCode: err.code,
    },
  });

  // Log the error locally
  logger.error('API Error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.tenant?.id,
    errorCode: err.code,
  });

  // Report to Sentry if applicable
  if (shouldReportToSentry(err)) {
    // Set user context for Sentry
    if (req.user) {
      setUser(req.user);
    }

    captureException(err, {
      user: req.user,
      tenantId: req.tenant?.id,
      req,
      level: getErrorLevel(err),
      tags: {
        errorCode: err.code,
        route: `${req.method} ${req.route?.path || req.originalUrl}`,
      },
      extra: {
        body: req.body ? sanitizeBody(req.body) : undefined,
        query: req.query,
        params: req.params,
      },
    });
  }

  // Erreurs personnalisées (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }

  // Erreurs Prisma
  if (err.code && err.code.startsWith('P')) {
    const statusCode = getPrismaStatusCode(err.code);
    return res.status(statusCode).json({
      success: false,
      error: {
        message: getPrismaErrorMessage(err),
        code: err.code,
        ...(process.env.NODE_ENV === 'development' && { details: err.message }),
      },
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
    });
  }

  // Erreurs de validation
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err.errors || err.issues,
      },
    });
  }

  // Erreur générique
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * Get HTTP status code for Prisma error codes
 * @param {string} code - Prisma error code
 * @returns {number} HTTP status code
 */
const getPrismaStatusCode = (code) => {
  switch (code) {
    case 'P2002': // Unique constraint violation
      return 409;
    case 'P2025': // Record not found
      return 404;
    case 'P2003': // Foreign key constraint violation
      return 400;
    case 'P1001': // Can't reach database server
    case 'P1002': // Database server timed out
      return 503;
    default:
      return 400;
  }
};

/**
 * Get user-friendly message for Prisma errors
 * @param {Error} err - Prisma error
 * @returns {string} User-friendly message
 */
const getPrismaErrorMessage = (err) => {
  switch (err.code) {
    case 'P2002':
      return 'A record with this value already exists';
    case 'P2025':
      return 'Record not found';
    case 'P2003':
      return 'Related record not found';
    case 'P1001':
      return 'Database server is unreachable';
    case 'P1002':
      return 'Database request timed out';
    default:
      return 'Database error';
  }
};

/**
 * Sanitize request body to remove sensitive fields
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeBody = (body) => {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
  const sanitized = { ...body };

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[FILTERED]';
    }
  });

  return sanitized;
};

// Not found handler
const notFoundHandler = (req, res) => {
  // Add breadcrumb for 404s (helps debug routing issues)
  addBreadcrumb({
    category: 'http',
    message: `404 Not Found: ${req.method} ${req.originalUrl}`,
    level: 'warning',
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      path: req.originalUrl,
    },
  });
};

module.exports = { errorHandler, notFoundHandler };
