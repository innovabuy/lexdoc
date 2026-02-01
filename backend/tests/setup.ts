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
  // Order matters due to foreign key constraints
  await prisma.auditLog.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.template.deleteMany();
  await prisma.generatedDocument.deleteMany();
  await prisma.builderTemplate.deleteMany();
  await prisma.documentBlock.deleteMany();
  await prisma.avocatLegalInfo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cabinet.deleteMany();
});

// Note: Individual test files should handle their own cleanup in afterAll
// to avoid interfering with test data created in beforeAll.
// The beforeAll above ensures a clean slate at the start of the test suite.

// Global teardown after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Increase timeout for integration tests
jest.setTimeout(30000);
