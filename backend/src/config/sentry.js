/**
 * Sentry Configuration for LexDoc Backend
 *
 * Documentation: https://docs.sentry.io/platforms/javascript/guides/node/
 */

const Sentry = require('@sentry/node');
const logger = require('./logger');

/**
 * Initialize Sentry SDK
 * Must be called before any other code runs
 */
function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;

  // Skip Sentry in development if no DSN is provided
  if (!dsn) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('SENTRY_DSN not configured - error tracking disabled');
    } else {
      logger.info('Sentry disabled (no DSN configured)');
    }
    return false;
  }

  try {
    Sentry.init({
      dsn,

      // Environment identification
      environment: process.env.NODE_ENV || 'development',
      release: `lexdoc-backend@${process.env.npm_package_version || '1.0.0'}`,

      // Server name for identifying which instance sent the error
      serverName: process.env.HOSTNAME || 'lexdoc-api',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

      // Profile a percentage of transactions
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

      // Integrations
      integrations: [
        // HTTP integration for tracking outgoing requests
        Sentry.httpIntegration({ tracing: true }),
        // Express integration
        Sentry.expressIntegration({ app }),
        // Capture console errors
        Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
      ],

      // Filter sensitive data before sending
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers['x-api-key'];
        }

        // Remove sensitive data from request body
        if (event.request?.data) {
          const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
          try {
            const data = typeof event.request.data === 'string'
              ? JSON.parse(event.request.data)
              : event.request.data;

            sensitiveFields.forEach(field => {
              if (data[field]) {
                data[field] = '[FILTERED]';
              }
            });
            event.request.data = JSON.stringify(data);
          } catch (e) {
            // If parsing fails, just continue
          }
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Ignore authentication errors (normal flow)
        'Invalid token',
        'Token expired',
        'Unauthorized',
        // Ignore not found errors
        'Route not found',
        // Ignore validation errors (user input)
        'Validation error',
      ],

      // Additional tags for filtering in Sentry dashboard
      initialScope: {
        tags: {
          service: 'lexdoc-backend',
          component: 'api',
        },
      },
    });

    logger.info('Sentry initialized successfully', {
      environment: process.env.NODE_ENV,
      dsn: dsn.replace(/\/\/.*@/, '//[FILTERED]@'), // Log DSN without credentials
    });

    return true;
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error: error.message });
    return false;
  }
}

/**
 * Capture an exception and send to Sentry
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    // Add user context if available
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        // Don't send full user object
      });
    }

    // Add tenant context
    if (context.tenantId) {
      scope.setTag('tenantId', context.tenantId);
    }

    // Add request context
    if (context.req) {
      scope.setTag('url', context.req.originalUrl);
      scope.setTag('method', context.req.method);
      scope.setExtra('ip', context.req.ip);
      scope.setExtra('userAgent', context.req.get('user-agent'));
    }

    // Add custom tags
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Add extra data
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    // Set error level
    if (context.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message (non-error event)
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {Object} context - Additional context
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Set user context for all subsequent events
 * @param {Object} user - User object with id, email
 */
function setUser(user) {
  if (!process.env.SENTRY_DSN) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
function addBreadcrumb(breadcrumb) {
  if (!process.env.SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category: breadcrumb.category || 'custom',
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
}

/**
 * Start a transaction for performance monitoring
 * @param {Object} options - Transaction options
 * @returns {Transaction} Sentry transaction
 */
function startTransaction(options) {
  if (!process.env.SENTRY_DSN) return null;

  return Sentry.startSpan(options, () => {});
}

/**
 * Express error handler middleware for Sentry
 * Should be added after all routes but before custom error handler
 */
function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}

/**
 * Express request handler middleware for Sentry
 * Should be added before all routes
 */
function sentryRequestHandler() {
  return Sentry.expressIntegration().setupExpressErrorHandler;
}

/**
 * Flush all pending events before shutdown
 * @param {number} timeout - Timeout in milliseconds
 */
async function flush(timeout = 2000) {
  if (!process.env.SENTRY_DSN) return;

  try {
    await Sentry.flush(timeout);
  } catch (error) {
    logger.error('Failed to flush Sentry events', { error: error.message });
  }
}

module.exports = {
  Sentry,
  initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  sentryErrorHandler,
  sentryRequestHandler,
  flush,
};
