import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { prisma } from '@/config/database';
import { config } from '@/config';

// Ensure we're in test environment
if (config.env !== 'test') {
  console.error('Tests must be run in test environment!');
  process.exit(1);
}

// Global setup before all tests
beforeAll(async () => {
  // Connect to database
  await prisma.$connect();

  // Clean up any existing test data to start fresh
  await prisma.auditLog.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cabinet.deleteMany();
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cabinet.deleteMany();
});

// Global teardown after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Increase timeout for integration tests
jest.setTimeout(30000);
