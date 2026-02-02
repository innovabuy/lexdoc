import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database
  database: {
    url: process.env.DATABASE_URL!,
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY!,
  },

  // MinIO
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
    buckets: {
      documents: process.env.MINIO_BUCKET_DOCUMENTS || 'documents',
      templates: process.env.MINIO_BUCKET_TEMPLATES || 'templates',
    },
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  // Email
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@lexdoc.fr',
  },

  // URLs
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
    backend: process.env.BACKEND_URL || 'http://localhost:3000',
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    authMax: 10, // Stricter for auth endpoints
  },

  // 2FA
  twoFactor: {
    issuer: 'LexDoc',
    window: 1, // Allow 1 period tolerance
  },

  // Bcrypt
  bcrypt: {
    saltRounds: 12,
  },

  // Universign (Signature électronique)
  universign: {
    apiKey: process.env.UNIVERSIGN_API_KEY || '',
    apiUrl: process.env.UNIVERSIGN_API_URL || 'https://ws.universign.eu/v1',
    webhookSecret: process.env.UNIVERSIGN_WEBHOOK_SECRET || '',
  },

  // SendingBox (LRAR)
  sendingbox: {
    apiKey: process.env.SENDINGBOX_API_KEY || '',
    apiUrl: process.env.SENDINGBOX_API_URL || 'https://api.sendingbox.io/v1',
    webhookSecret: process.env.SENDINGBOX_WEBHOOK_SECRET || '',
  },

  // Backup System (Google Drive)
  backup: {
    googleDriveCredentialsPath: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || '',
    googleDriveFolderId: process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || '',
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || '',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    scheduleCron: process.env.BACKUP_SCHEDULE_CRON || '0 3 * * *',
    minioDataPath: process.env.MINIO_DATA_PATH || '/opt/lexdoc/data/minio',
    uploadsPath: process.env.UPLOADS_PATH || '/mnt/user-data/uploads',
  },

  // App info
  app: {
    version: process.env.APP_VERSION || '1.0.0',
    name: 'LexDoc',
  },
} as const;

// Validate required config in production
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
];

if (config.env === 'production') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export default config;
