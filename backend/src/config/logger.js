/**
 * Winston Logger Configuration with Daily Rotation
 *
 * Features:
 * - Daily log rotation
 * - Automatic compression of old logs (gzip)
 * - Configurable retention period
 * - Separate files for errors and combined logs
 * - JSON format for easy parsing
 * - Console output in development
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Configuration from environment
const config = {
  // Log directory
  logDir: process.env.LOG_DIR || path.join(__dirname, '../../logs'),

  // Log level
  level: process.env.LOG_LEVEL || 'info',

  // Max file size before rotation (default: 20MB)
  maxSize: process.env.LOG_MAX_SIZE || '20m',

  // How long to keep logs (default: 30 days)
  maxDays: process.env.LOG_MAX_DAYS || '30d',

  // Max number of files to keep (as backup, in addition to date-based retention)
  maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14,

  // Enable compression of rotated files
  compress: process.env.LOG_COMPRESS !== 'false',

  // Date pattern for filename
  datePattern: 'YYYY-MM-DD',
};

// Create log directory if it doesn't exist
if (!fs.existsSync(config.logDir)) {
  fs.mkdirSync(config.logDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Human-readable format for console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
  })
);

// Daily rotate transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(config.logDir, 'error-%DATE%.log'),
  datePattern: config.datePattern,
  level: 'error',
  maxSize: config.maxSize,
  maxFiles: config.maxDays,
  compress: config.compress,
  zippedArchive: config.compress,
  // Create symlink to latest error log
  createSymlink: true,
  symlinkName: 'error.log',
  // Audit file to track rotations
  auditFile: path.join(config.logDir, '.error-audit.json'),
});

// Daily rotate transport for combined logs
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(config.logDir, 'combined-%DATE%.log'),
  datePattern: config.datePattern,
  maxSize: config.maxSize,
  maxFiles: config.maxDays,
  compress: config.compress,
  zippedArchive: config.compress,
  // Create symlink to latest combined log
  createSymlink: true,
  symlinkName: 'combined.log',
  // Audit file to track rotations
  auditFile: path.join(config.logDir, '.combined-audit.json'),
});

// Daily rotate transport for access/HTTP logs (optional, for high traffic)
const accessRotateTransport = new DailyRotateFile({
  filename: path.join(config.logDir, 'access-%DATE%.log'),
  datePattern: config.datePattern,
  level: 'http',
  maxSize: config.maxSize,
  maxFiles: '7d', // Keep access logs for 7 days only
  compress: config.compress,
  zippedArchive: config.compress,
  createSymlink: true,
  symlinkName: 'access.log',
  auditFile: path.join(config.logDir, '.access-audit.json'),
});

// Event handlers for rotation
errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
  // Log rotation event (to combined, not error to avoid recursion)
  logger.info('Error log rotated', {
    oldFile: path.basename(oldFilename),
    newFile: path.basename(newFilename),
  });
});

combinedRotateTransport.on('rotate', (oldFilename, newFilename) => {
  console.log(`[Logger] Combined log rotated: ${path.basename(oldFilename)} -> ${path.basename(newFilename)}`);
});

// Handle rotation errors
errorRotateTransport.on('error', (error) => {
  console.error('[Logger] Error log rotation failed:', error);
});

combinedRotateTransport.on('error', (error) => {
  console.error('[Logger] Combined log rotation failed:', error);
});

// Create the logger
const logger = winston.createLogger({
  level: config.level,
  format: logFormat,
  defaultMeta: { service: 'lexdoc-api' },
  transports: [
    errorRotateTransport,
    combinedRotateTransport,
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add access log transport if LOG_ACCESS is enabled
if (process.env.LOG_ACCESS === 'true') {
  logger.add(accessRotateTransport);
}

// Console output in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
} else {
  // In production, only log warnings and errors to console
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: 'warn',
    })
  );
}

// Add exception and rejection handlers
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(config.logDir, 'exceptions-%DATE%.log'),
    datePattern: config.datePattern,
    maxSize: config.maxSize,
    maxFiles: config.maxDays,
    compress: config.compress,
    zippedArchive: config.compress,
  })
);

logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(config.logDir, 'rejections-%DATE%.log'),
    datePattern: config.datePattern,
    maxSize: config.maxSize,
    maxFiles: config.maxDays,
    compress: config.compress,
    zippedArchive: config.compress,
  })
);

// Helper function to create child logger with additional context
logger.child = (metadata) => {
  return logger.child(metadata);
};

// Log startup configuration
logger.info('Logger initialized', {
  logDir: config.logDir,
  level: config.level,
  maxSize: config.maxSize,
  maxDays: config.maxDays,
  compress: config.compress,
  environment: process.env.NODE_ENV,
});

module.exports = logger;
