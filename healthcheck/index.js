/**
 * LexDoc Health Check Service
 * Monitors database and MinIO connectivity
 */

const express = require('express');
const { Client } = require('pg');
const Minio = require('minio');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const config = {
  database: process.env.DATABASE_URL,
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  },
};

// MinIO client
const minioClient = new Minio.Client(config.minio);

// Health check functions
async function checkDatabase() {
  const client = new Client({ connectionString: config.database });
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as time, current_database() as db');
    await client.end();
    return {
      status: 'healthy',
      database: result.rows[0].db,
      timestamp: result.rows[0].time,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

async function checkMinio() {
  try {
    const buckets = await minioClient.listBuckets();
    return {
      status: 'healthy',
      buckets: buckets.map(b => b.name),
      endpoint: config.minio.endPoint,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'LexDoc Health Check',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/ready',
      live: '/live',
    },
  });
});

// Liveness probe - is the service running?
app.get('/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness probe - is the service ready to accept traffic?
app.get('/ready', async (req, res) => {
  const [db, minio] = await Promise.all([checkDatabase(), checkMinio()]);

  const isReady = db.status === 'healthy' && minio.status === 'healthy';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: { database: db, minio },
  });
});

// Full health check
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const [db, minio] = await Promise.all([checkDatabase(), checkMinio()]);

  const isHealthy = db.status === 'healthy' && minio.status === 'healthy';
  const responseTime = Date.now() - startTime;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    services: {
      database: db,
      minio,
    },
    environment: {
      nodeVersion: process.version,
      uptime: `${Math.floor(process.uptime())}s`,
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
    },
  });
});

// Detailed database check
app.get('/health/database', async (req, res) => {
  const result = await checkDatabase();
  res.status(result.status === 'healthy' ? 200 : 503).json(result);
});

// Detailed MinIO check
app.get('/health/minio', async (req, res) => {
  const result = await checkMinio();
  res.status(result.status === 'healthy' ? 200 : 503).json(result);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LexDoc Health Check running on port ${PORT}`);
  console.log(`Database: ${config.database ? 'configured' : 'NOT configured'}`);
  console.log(`MinIO: ${config.minio.endPoint}:${config.minio.port}`);
});
