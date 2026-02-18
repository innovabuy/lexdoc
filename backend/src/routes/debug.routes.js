/**
 * Debug Routes - Development Only
 *
 * These routes are only available in development mode
 * and are used for testing various integrations.
 */

const express = require('express');
const router = express.Router();
const { captureException, captureMessage, Sentry } = require('../config/sentry');
const { successResponse } = require('../utils/response');
const { BadRequestError } = require('../utils/errors');

// Only allow in development
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
      },
    });
  }
  next();
});

/**
 * Test Sentry error capture
 * GET /api/debug/sentry-test
 *
 * This endpoint intentionally throws an error to test Sentry integration.
 */
router.get('/sentry-test', (req, res, next) => {
  try {
    throw new Error('Sentry test error - This is a test exception');
  } catch (error) {
    next(error);
  }
});

/**
 * Test Sentry message capture
 * GET /api/debug/sentry-message
 */
router.get('/sentry-message', (req, res) => {
  captureMessage('Sentry test message - Integration working', 'info', {
    tags: { test: 'true' },
    extra: { timestamp: new Date().toISOString() },
  });

  return successResponse(res, {
    message: 'Test message sent to Sentry',
    note: 'Check your Sentry dashboard for the message',
  });
});

/**
 * Test unhandled promise rejection
 * GET /api/debug/sentry-rejection
 */
router.get('/sentry-rejection', async (req, res) => {
  // This will create an unhandled promise rejection
  // The global handler will catch it and send to Sentry
  const shouldReject = req.query.confirm === 'true';

  if (!shouldReject) {
    return res.json({
      success: false,
      error: {
        message: 'Add ?confirm=true to actually trigger the rejection',
        warning: 'This will crash the process!',
      },
    });
  }

  // Intentionally reject without catching
  Promise.reject(new Error('Test unhandled rejection for Sentry'));

  return successResponse(res, {
    message: 'Unhandled rejection triggered - process will exit',
  });
});

/**
 * Test AppError with Sentry
 * GET /api/debug/sentry-app-error
 */
router.get('/sentry-app-error', (req, res, next) => {
  // This will NOT be reported to Sentry (400 error)
  next(new BadRequestError('This is a test BadRequestError'));
});

/**
 * Check Sentry status
 * GET /api/debug/sentry-status
 */
router.get('/sentry-status', (req, res) => {
  const isEnabled = !!process.env.SENTRY_DSN;
  const hub = Sentry.getCurrentHub ? Sentry.getCurrentHub() : null;

  return successResponse(res, {
    enabled: isEnabled,
    dsn: isEnabled
      ? process.env.SENTRY_DSN.replace(/\/\/.*@/, '//[FILTERED]@')
      : null,
    environment: process.env.NODE_ENV,
    hubActive: !!hub,
  });
});

/**
 * Simulate a slow endpoint for performance testing
 * GET /api/debug/slow-endpoint?delay=1000
 */
router.get('/slow-endpoint', async (req, res) => {
  const delay = parseInt(req.query.delay) || 1000;
  const maxDelay = 10000;

  const actualDelay = Math.min(delay, maxDelay);

  await new Promise((resolve) => setTimeout(resolve, actualDelay));

  return successResponse(res, {
    message: 'Slow endpoint completed',
    requestedDelay: delay,
    actualDelay,
    note: `Max allowed delay is ${maxDelay}ms`,
  });
});

module.exports = router;
