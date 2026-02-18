const crypto = require('crypto');

/**
 * Génère un token aléatoire
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calcule le checksum SHA-256 d'un fichier
 */
const calculateChecksum = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
    .substring(0, 255);
};

/**
 * Parse pagination params
 */
const parsePaginationParams = (query, defaults = {}) => {
  const page = Math.max(1, parseInt(query.page) || defaults.page || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(query.pageSize) || defaults.pageSize || 20)
  );
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip, take: pageSize };
};

/**
 * Convert BigInt to string recursively
 */
const serializeBigInt = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
};

/**
 * Omit sensitive fields from object
 */
const omitSensitiveFields = (obj, fields = ['password', 'resetToken']) => {
  const result = serializeBigInt({ ...obj });
  fields.forEach((field) => delete result[field]);
  return result;
};

/**
 * Format date to ISO string
 */
const formatDate = (date) => {
  return date ? new Date(date).toISOString() : null;
};

/**
 * Sleep utility (for testing)
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate random numeric code
 */
const generateRandomCode = (length = 6) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

module.exports = {
  generateToken,
  calculateChecksum,
  sanitizeFilename,
  parsePaginationParams,
  omitSensitiveFields,
  formatDate,
  sleep,
  generateRandomCode,
};
