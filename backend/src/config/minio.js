const Minio = require('minio');
const logger = require('./logger');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9003,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Créer bucket par défaut
const defaultBucket = process.env.MINIO_BUCKET || 'lexdoc-dev';

minioClient.bucketExists(defaultBucket, (err, exists) => {
  if (err) {
    logger.error('MinIO bucket check failed', { error: err });
    return;
  }

  if (!exists) {
    minioClient.makeBucket(defaultBucket, 'eu-west-1', (err) => {
      if (err) {
        logger.error('MinIO bucket creation failed', { error: err });
      } else {
        logger.info(`MinIO bucket created: ${defaultBucket}`);
      }
    });
  } else {
    logger.info(`MinIO bucket exists: ${defaultBucket}`);
  }
});

module.exports = minioClient;
