import multer from 'multer';
import { Request } from 'express';
import crypto from 'crypto';
import path from 'path';
import { minioClient } from '@/config/minio';
import { config } from '@/config';
import { BadRequestError } from '@/utils/errors';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
];

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Configure multer with memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type not allowed: ${file.mimetype}`));
  }
};

// Multer upload middleware
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files at once
  },
});

// Single file upload
export const uploadSingle = uploadMiddleware.single('file');

// Multiple files upload
export const uploadMultiple = uploadMiddleware.array('files', 10);

/**
 * Generate a unique encryption key for a document
 */
function generateDocumentKey(): Buffer {
  return crypto.randomBytes(32); // 256 bits for AES-256
}

/**
 * Encrypt a buffer using AES-256-GCM
 */
function encryptBuffer(buffer: Buffer, key: Buffer): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return { encrypted, iv, authTag };
}

/**
 * Decrypt a buffer using AES-256-GCM
 */
function decryptBuffer(encrypted: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Buffer {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Encrypt the document key with the master encryption key
 */
function encryptDocumentKey(documentKey: Buffer): string {
  const masterKey = Buffer.from(config.encryption.key, 'utf-8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  const encrypted = Buffer.concat([cipher.update(documentKey), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Encrypted key
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt the document key with the master encryption key
 */
function decryptDocumentKey(encryptedKey: string): Buffer {
  const combined = Buffer.from(encryptedKey, 'base64');
  const masterKey = Buffer.from(config.encryption.key, 'utf-8').slice(0, 32);

  const iv = combined.slice(0, 16);
  const authTag = combined.slice(16, 32);
  const encrypted = combined.slice(32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Sanitize filename for safe storage
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);
  // Replace dangerous characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

/**
 * Calculate SHA-256 checksum
 */
function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export interface UploadResult {
  storagePath: string;
  storageKey: string;
  fileSize: number;
  checksum: string;
  mimeType: string;
  originalName: string;
}

/**
 * Upload a file to MinIO with encryption
 */
export async function uploadToMinio(
  file: Express.Multer.File,
  cabinetId: string,
  folderId: string
): Promise<UploadResult> {
  // Generate unique document encryption key
  const documentKey = generateDocumentKey();

  // Encrypt the file content
  const { encrypted, iv, authTag } = encryptBuffer(file.buffer, documentKey);

  // Combine IV + AuthTag + Encrypted data for storage
  const finalBuffer = Buffer.concat([iv, authTag, encrypted]);

  // Generate storage path
  const fileId = crypto.randomUUID();
  const sanitizedName = sanitizeFilename(file.originalname);
  const storagePath = `${cabinetId}/${folderId}/${fileId}_${sanitizedName}`;

  // Encrypt the document key for storage
  const storageKey = encryptDocumentKey(documentKey);

  // Calculate checksum of original file
  const checksum = calculateChecksum(file.buffer);

  // Upload to MinIO
  await minioClient.putObject(
    config.minio.buckets.documents,
    storagePath,
    finalBuffer,
    finalBuffer.length,
    {
      'Content-Type': 'application/octet-stream', // Encrypted data
      'x-amz-meta-cabinet-id': cabinetId,
      'x-amz-meta-folder-id': folderId,
      'x-amz-meta-original-name': Buffer.from(file.originalname).toString('base64'),
      'x-amz-meta-original-mime': file.mimetype,
      'x-amz-meta-original-size': file.size.toString(),
      'x-amz-meta-checksum': checksum,
    }
  );

  return {
    storagePath,
    storageKey,
    fileSize: file.size,
    checksum,
    mimeType: file.mimetype,
    originalName: file.originalname,
  };
}

/**
 * Download and decrypt a file from MinIO
 */
export async function downloadFromMinio(
  storagePath: string,
  storageKey: string
): Promise<{ buffer: Buffer; originalMime?: string }> {
  // Get object from MinIO
  const stream = await minioClient.getObject(config.minio.buckets.documents, storagePath);

  // Collect chunks
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const encryptedBuffer = Buffer.concat(chunks);

  // Extract IV, AuthTag, and encrypted data
  const iv = encryptedBuffer.slice(0, 16);
  const authTag = encryptedBuffer.slice(16, 32);
  const encrypted = encryptedBuffer.slice(32);

  // Decrypt the document key
  const documentKey = decryptDocumentKey(storageKey);

  // Decrypt the data
  const decrypted = decryptBuffer(encrypted, documentKey, iv, authTag);

  // Get original mime type from metadata
  const stat = await minioClient.statObject(config.minio.buckets.documents, storagePath);
  const originalMime = stat.metaData?.['original-mime'];

  return { buffer: decrypted, originalMime };
}

/**
 * Delete a file from MinIO
 */
export async function deleteFromMinio(storagePath: string): Promise<void> {
  await minioClient.removeObject(config.minio.buckets.documents, storagePath);
}

/**
 * Copy a file in MinIO (for versioning)
 */
export async function copyInMinio(
  sourcePath: string,
  destPath: string
): Promise<void> {
  const { CopyConditions } = await import('minio');
  const conditions = new CopyConditions();
  await minioClient.copyObject(
    config.minio.buckets.documents,
    destPath,
    `/${config.minio.buckets.documents}/${sourcePath}`,
    conditions
  );
}

/**
 * Get file stats from MinIO
 */
export async function getMinioStats(storagePath: string) {
  return minioClient.statObject(config.minio.buckets.documents, storagePath);
}

/**
 * Generate a presigned URL for direct download
 */
export async function getPresignedUrl(
  storagePath: string,
  expirySeconds: number = 3600
): Promise<string> {
  return minioClient.presignedGetObject(
    config.minio.buckets.documents,
    storagePath,
    expirySeconds
  );
}
