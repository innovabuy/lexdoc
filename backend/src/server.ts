import app from './app';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { prisma, testConnection } from '@/config/database';
import { initializeBuckets, testMinioConnection } from '@/config/minio';

const PORT = config.port;

async function bootstrap() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Initialize MinIO buckets
    const minioConnected = await testMinioConnection();
    if (minioConnected) {
      await initializeBuckets();
    } else {
      logger.warn('MinIO not available, file storage will not work');
    }

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`LexDoc API running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        await prisma.$disconnect();
        logger.info('Database connection closed');

        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
