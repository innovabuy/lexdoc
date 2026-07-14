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
  // GO-LIVE-6 LOT D — ne PAS reconstruire les objets "feuilles" non-plain (Date, Decimal,
  // Buffer...) : les parcourir champ par champ les transformait en {} (bug de sérialisation
  // LRAR : createdAt/updatedAt sortaient en {}). On les renvoie tels quels (leur propre
  // toJSON gère l'ISO / la valeur), on ne récursive que sur les objets littéraux.
  if (obj instanceof Date || typeof obj.toJSON === 'function') return obj;
  if (typeof obj === 'object') {
    const proto = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) return obj; // instance de classe (Decimal, Buffer, ...)
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
