import { Client as MinioClient, BucketItem } from 'minio';
import { Readable } from 'stream';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface UploadOptions {
  bucket?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  encrypt?: boolean;
}

interface DownloadResult {
  stream: Readable;
  metadata: Record<string, string>;
  size: number;
}

class MinioService {
  private client: MinioClient | null = null;
  private defaultBucket: string;
  private encryptionKey: string;

  constructor() {
    this.defaultBucket = process.env.MINIO_DEFAULT_BUCKET || 'documents';
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.initialize();
  }

  private initialize(): void {
    const { MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL } = process.env;

    if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
      logger.warn('MinIO configuration incomplete. Storage service will be disabled.');
      return;
    }

    this.client = new MinioClient({
      endPoint: MINIO_ENDPOINT,
      port: parseInt(MINIO_PORT || '9000', 10),
      useSSL: MINIO_USE_SSL === 'true',
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });

    this.ensureBuckets();
  }

  private async ensureBuckets(): Promise<void> {
    if (!this.client) return;

    const buckets = ['documents', 'templates', 'signatures', 'backups'];

    for (const bucket of buckets) {
      try {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket);
          logger.info(`Created bucket: ${bucket}`);
        }
      } catch (error) {
        logger.error(`Failed to ensure bucket ${bucket}:`, error);
      }
    }
  }

  private encrypt(buffer: Buffer): { encrypted: Buffer; iv: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.encryptionKey, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return { encrypted, iv: iv.toString('hex') };
  }

  private decrypt(encrypted: Buffer, iv: string): Buffer {
    const key = Buffer.from(this.encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  async uploadFile(
    objectName: string,
    data: Buffer | Readable,
    options: UploadOptions = {}
  ): Promise<{ path: string; size: number; etag: string; iv?: string }> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const bucket = options.bucket || this.defaultBucket;
    let uploadData: Buffer | Readable = data;
    let iv: string | undefined;

    // Encrypt if requested and data is a Buffer
    if (options.encrypt && Buffer.isBuffer(data)) {
      const encrypted = this.encrypt(data);
      uploadData = encrypted.encrypted;
      iv = encrypted.iv;
    }

    const metadata: Record<string, string> = {
      ...options.metadata,
      'Content-Type': options.contentType || 'application/octet-stream',
    };

    if (iv) {
      metadata['x-amz-meta-iv'] = iv;
    }

    const size = Buffer.isBuffer(uploadData) ? uploadData.length : -1;

    const etag = await this.client.putObject(bucket, objectName, uploadData, size > 0 ? size : undefined, metadata);

    logger.info(`Uploaded file: ${bucket}/${objectName}`);

    return {
      path: `${bucket}/${objectName}`,
      size: Buffer.isBuffer(uploadData) ? uploadData.length : 0,
      etag: typeof etag === 'string' ? etag : etag.etag,
      iv,
    };
  }

  async downloadFile(objectName: string, bucket?: string): Promise<DownloadResult> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const targetBucket = bucket || this.defaultBucket;
    const stat = await this.client.statObject(targetBucket, objectName);
    const stream = await this.client.getObject(targetBucket, objectName);

    return {
      stream,
      metadata: stat.metaData || {},
      size: stat.size,
    };
  }

  async downloadFileAsBuffer(objectName: string, bucket?: string, decrypt = false): Promise<Buffer> {
    const { stream, metadata } = await this.downloadFile(objectName, bucket);

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    let buffer = Buffer.concat(chunks);

    // Decrypt if IV is present and decrypt is requested
    if (decrypt && metadata['x-amz-meta-iv']) {
      buffer = this.decrypt(buffer, metadata['x-amz-meta-iv']);
    }

    return buffer;
  }

  async deleteFile(objectName: string, bucket?: string): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const targetBucket = bucket || this.defaultBucket;
    await this.client.removeObject(targetBucket, objectName);
    logger.info(`Deleted file: ${targetBucket}/${objectName}`);
  }

  async listFiles(prefix?: string, bucket?: string): Promise<BucketItem[]> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const targetBucket = bucket || this.defaultBucket;
    const items: BucketItem[] = [];

    const stream = this.client.listObjects(targetBucket, prefix, true);

    for await (const item of stream) {
      items.push(item);
    }

    return items;
  }

  async getPresignedUrl(objectName: string, bucket?: string, expirySeconds = 3600): Promise<string> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const targetBucket = bucket || this.defaultBucket;
    return this.client.presignedGetObject(targetBucket, objectName, expirySeconds);
  }

  async copyFile(sourceObject: string, destObject: string, sourceBucket?: string, destBucket?: string): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const srcBucket = sourceBucket || this.defaultBucket;
    const dstBucket = destBucket || this.defaultBucket;

    await this.client.copyObject(dstBucket, destObject, `/${srcBucket}/${sourceObject}`);
    logger.info(`Copied file: ${srcBucket}/${sourceObject} -> ${dstBucket}/${destObject}`);
  }

  isInitialized(): boolean {
    return this.client !== null;
  }
}

export const minioService = new MinioService();
export default minioService;
