const crypto = require('crypto');
const minioClient = require('../config/minio');
const { calculateChecksum } = require('../utils/helpers');
const { InternalError } = require('../utils/errors');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

class StorageService {
  constructor() {
    this.bucket = process.env.MINIO_BUCKET || 'lexdoc-dev';
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt buffer using AES-256-GCM
   */
  encrypt(buffer) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(this.encryptionKey, 'hex');
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: Buffer.concat([iv, authTag, encrypted]),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt buffer using AES-256-GCM
   */
  decrypt(encryptedBuffer, ivHex, authTagHex) {
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Extract encrypted data (skip iv and authTag from combined buffer)
    const encryptedData = encryptedBuffer.slice(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  /**
   * Upload file with optional encryption
   */
  async uploadFile(buffer, objectKey, metadata = {}, encrypt = true) {
    try {
      let dataToUpload = buffer;
      let encryptionInfo = { iv: null, authTag: null };

      if (encrypt) {
        const { encryptedData, iv, authTag } = this.encrypt(buffer);
        dataToUpload = encryptedData;
        encryptionInfo = { iv, authTag };
      }

      await minioClient.putObject(
        this.bucket,
        objectKey,
        dataToUpload,
        dataToUpload.length,
        { ...metadata, encrypted: encrypt.toString() }
      );

      return {
        bucket: this.bucket,
        objectKey,
        size: buffer.length,
        encryptedSize: dataToUpload.length,
        checksum: calculateChecksum(buffer),
        isEncrypted: encrypt,
        ...encryptionInfo,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalError('File upload failed');
    }
  }

  /**
   * Download file with optional decryption
   */
  async downloadFile(objectKey, ivHex = null, authTagHex = null) {
    try {
      const stream = await minioClient.getObject(this.bucket, objectKey);
      const chunks = [];

      const buffer = await new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

      // If encryption info provided, decrypt
      if (ivHex && authTagHex) {
        return this.decrypt(buffer, ivHex, authTagHex);
      }

      return buffer;
    } catch (error) {
      console.error('Download error:', error);
      throw new InternalError('File download failed');
    }
  }

  /**
   * Download and decrypt file (convenience method)
   */
  async downloadDecrypted(objectKey, ivHex, authTagHex) {
    return this.downloadFile(objectKey, ivHex, authTagHex);
  }

  async deleteFile(objectKey) {
    try {
      await minioClient.removeObject(this.bucket, objectKey);
    } catch (error) {
      throw new InternalError('File deletion failed');
    }
  }

  async generatePresignedUrl(objectKey, expirySeconds = 3600) {
    try {
      return await minioClient.presignedGetObject(
        this.bucket,
        objectKey,
        expirySeconds
      );
    } catch (error) {
      throw new InternalError('URL generation failed');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(objectKey) {
    try {
      await minioClient.statObject(this.bucket, objectKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileStats(objectKey) {
    try {
      return await minioClient.statObject(this.bucket, objectKey);
    } catch (error) {
      throw new InternalError('Failed to get file stats');
    }
  }

  /**
   * Copy file within bucket
   */
  async copyFile(sourceKey, destKey) {
    try {
      await minioClient.copyObject(
        this.bucket,
        destKey,
        `/${this.bucket}/${sourceKey}`
      );
      return { bucket: this.bucket, objectKey: destKey };
    } catch (error) {
      throw new InternalError('File copy failed');
    }
  }
}

module.exports = new StorageService();
