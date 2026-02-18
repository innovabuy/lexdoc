module.exports = {
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Upload
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'image/jpeg',
    'image/png',
  ],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 1 * 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 500, // 500 requests per minute
  
  // Roles
  USER_ROLES: {
    ADMIN: 'ADMIN',
    LAWYER: 'LAWYER',
    ASSISTANT: 'ASSISTANT',
    USER: 'USER',
  },
  
  // Status
  DOCUMENT_STATUS: {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    PENDING_SIGNATURE: 'PENDING_SIGNATURE',
    SIGNED: 'SIGNED',
    SENT: 'SENT',
    ARCHIVED: 'ARCHIVED',
    CANCELLED: 'CANCELLED',
  },
  
  SIGNATURE_STATUS: {
    PENDING: 'PENDING',
    SIGNED: 'SIGNED',
    REFUSED: 'REFUSED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
  },
};
