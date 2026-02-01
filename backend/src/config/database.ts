import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Set the current cabinet ID for RLS
 * MUST be called before any query in a request
 */
export async function setTenantContext(cabinetId: string): Promise<void> {
  // Validate UUID format to prevent SQL injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(cabinetId)) {
    throw new Error('Invalid cabinet ID format');
  }
  await prisma.$executeRawUnsafe(`SET app.current_cabinet_id = '${cabinetId}'`);
}

/**
 * Clear the tenant context
 */
export async function clearTenantContext(): Promise<void> {
  await prisma.$executeRawUnsafe(`RESET app.current_cabinet_id`);
}

/**
 * Execute a function with tenant context
 */
export async function withTenantContext<T>(
  cabinetId: string,
  fn: () => Promise<T>
): Promise<T> {
  await setTenantContext(cabinetId);
  try {
    return await fn();
  } finally {
    await clearTenantContext();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

export default prisma;
