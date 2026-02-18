require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');
const { initSentry, Sentry, flush: flushSentry } = require('./config/sentry');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');
const reminderJob = require('./jobs/reminder.job');
const backupJob = require('./jobs/backup.job');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

// ============================================================================
// SENTRY - Initialize first for error tracking
// ============================================================================
const sentryEnabled = initSentry(app);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Sécurité
app.use(helmet());

// CORS - Multiple origins support
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_PORTAL_URL,
  process.env.FRONTEND_CLIENT_URL,
].filter(Boolean);

// In development, also allow localhost origins
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:4001', 'http://localhost:4002',
    'http://localhost:5173', 'http://localhost:5174',
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn('CORS blocked origin', { origin, allowedOrigins });
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', generalLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

app.use('/api', routes);

// Health check (en dehors du rate limiter)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LexDoc API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFoundHandler);

// Sentry error handler must be before custom error handler
if (sentryEnabled) {
  app.use(Sentry.expressErrorHandler());
}

app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 LexDoc API started on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV}`);
  logger.info(`   API URL: http://0.0.0.0:${PORT}`);
  logger.info(`   Health: http://0.0.0.0:${PORT}/health`);

  // Start scheduled jobs
  if (process.env.NODE_ENV !== 'test') {
    reminderJob.start();
    backupJob.start();
    logger.info('📅 Scheduled jobs started');
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Flush Sentry events before shutdown
  if (sentryEnabled) {
    logger.info('Flushing Sentry events...');
    await flushSentry(2000);
  }

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exceptions
process.on('uncaughtException', async (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });

  // Capture in Sentry before crashing
  if (sentryEnabled) {
    Sentry.captureException(err);
    await flushSentry(2000);
  }

  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });

  // Capture in Sentry
  if (sentryEnabled) {
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
    await flushSentry(2000);
  }

  process.exit(1);
});

module.exports = app;
