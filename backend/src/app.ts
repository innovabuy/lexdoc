import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from '@/config';
import { logger } from '@/utils/logger';
import { apiLimiter } from '@/middlewares/rateLimit';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';

// Import routes
import authRoutes from '@/modules/auth/auth.routes';
import cabinetsRoutes from '@/modules/cabinets/cabinets.routes';
import usersRoutes from '@/modules/users/users.routes';
import healthRoutes from '@/modules/health/health.routes';
import templatesRoutes from '@/modules/templates/templates.routes';
import documentsRoutes from '@/modules/documents/documents.routes';
import foldersRoutes from '@/modules/folders/folders.routes';
import signaturesRoutes, { webhookRouter as signatureWebhookRouter } from '@/modules/signatures/signatures.routes';
import lrarRoutes, { webhookRouter as lrarWebhookRouter } from '@/modules/lrar/lrar.routes';
import documentBlocksRoutes from '@/modules/document-blocks/document-blocks.routes';
import builderTemplatesRoutes from '@/modules/builder-templates/builder-templates.routes';
import generatedDocumentsRoutes from '@/modules/generated-documents/generated-documents.routes';
import avocatLegalInfoRoutes from '@/modules/avocat-legal-info/avocat-legal-info.routes';
import documentGenerationRoutes from '@/modules/document-generation/document-generation.routes';
import freeNotesRoutes, { folderFreeNotesRouter } from '@/modules/free-notes/free-notes.routes';
import { clientsRouter } from '@/modules/clients';
import { rgpdRoutes } from '@/modules/rgpd';

const app = express();

// Trust proxy (behind Traefik)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.env !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LexDoc API',
      version: '1.0.0',
      description: 'API Backend pour Cabinets d\'Avocats',
    },
    servers: [
      {
        url: config.urls.backend,
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/*/*.routes.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cabinets', apiLimiter, cabinetsRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/templates', apiLimiter, templatesRoutes);
app.use('/api/documents', apiLimiter, documentsRoutes);
app.use('/api/folders', apiLimiter, foldersRoutes);
app.use('/api/signatures', apiLimiter, signaturesRoutes);
app.use('/api/lrar', apiLimiter, lrarRoutes);
app.use('/api/document-blocks', apiLimiter, documentBlocksRoutes);
app.use('/api/builder-templates', apiLimiter, builderTemplatesRoutes);
app.use('/api/generated-documents', apiLimiter, generatedDocumentsRoutes);
app.use('/api/avocat-legal-info', apiLimiter, avocatLegalInfoRoutes);
app.use('/api/document-generation', apiLimiter, documentGenerationRoutes);
app.use('/api/free-notes', apiLimiter, freeNotesRoutes);
app.use('/api/folders/:folderId/free-notes', apiLimiter, folderFreeNotesRouter);
app.use('/api/clients', apiLimiter, clientsRouter);
app.use('/api/rgpd', apiLimiter, rgpdRoutes);

// Webhook routes (public, no rate limiting)
app.use('/api/webhooks', signatureWebhookRouter);
app.use('/api/webhooks', lrarWebhookRouter);

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'LexDoc API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      cabinets: '/api/cabinets',
      users: '/api/users',
      templates: '/api/templates',
      documents: '/api/documents',
      folders: '/api/folders',
      signatures: '/api/signatures',
      lrar: '/api/lrar',
      documentBlocks: '/api/document-blocks',
      builderTemplates: '/api/builder-templates',
      generatedDocuments: '/api/generated-documents',
      avocatLegalInfo: '/api/avocat-legal-info',
      documentGeneration: '/api/document-generation',
      freeNotes: '/api/free-notes',
      folderFreeNotes: '/api/folders/:folderId/free-notes',
      clients: '/api/clients',
      rgpd: '/api/rgpd',
      webhooks: '/api/webhooks',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
