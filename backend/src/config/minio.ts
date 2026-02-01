import * as Minio from 'minio';
import { config } from './index';
import { logger } from '@/utils/logger';

export const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

/**
 * Initialize MinIO buckets
 */
export async function initializeBuckets(): Promise<void> {
  const buckets = Object.values(config.minio.buckets);

  for (const bucket of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        logger.info(`MinIO bucket created: ${bucket}`);
      } else {
        logger.debug(`MinIO bucket exists: ${bucket}`);
      }
    } catch (error) {
      logger.error(`Failed to initialize bucket ${bucket}:`, error);
    }
  }
}

/**
 * Test MinIO connection
 */
export async function testMinioConnection(): Promise<boolean> {
  try {
    await minioClient.listBuckets();
    logger.info('MinIO connection successful');
    return true;
  } catch (error) {
    logger.error('MinIO connection failed:', error);
    return false;
  }
}

export default minioClient;
