// Test fixtures for LexDoc tests

const testTenant = {
  id: 'test-tenant-id',
  name: 'Test Cabinet',
  legalName: 'Test Cabinet SARL',
  siret: '12345678900099',
  address: '123 Test Street',
  postalCode: '75001',
  city: 'Paris',
  country: 'FR',
  phone: '01 23 45 67 89',
  email: 'contact@test-cabinet.fr',
  isActive: true,
  subscriptionTier: 'PRO',
};

const testUser = {
  id: 'test-user-id',
  email: 'avocat@test-cabinet.fr',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.xmQQXKKN1X.F2G', // hash of 'TestPassword123!'
  firstName: 'Jean',
  lastName: 'Dupont',
  role: 'ADMIN',
  isActive: true,
  isEmailVerified: true,
  tenantId: 'test-tenant-id',
};

const testClient = {
  id: 'test-client-id',
  type: 'COMPANY',
  companyName: 'Test Company SAS',
  siret: '98765432100011',
  email: 'client@test-company.fr',
  phone: '01 98 76 54 32',
  address: '456 Client Avenue',
  postalCode: '75002',
  city: 'Paris',
  isActive: true,
  hasExtranet: true,
  tenantId: 'test-tenant-id',
};

const testDocument = {
  id: 'test-document-id',
  name: 'Test Document',
  description: 'A test document',
  type: 'CONCLUSIONS',
  status: 'DRAFT',
  filename: 'test-doc.pdf',
  originalName: 'test-doc.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  bucketName: 'lexdoc-test',
  objectKey: 'test/test-doc.pdf',
  tenantId: 'test-tenant-id',
  createdById: 'test-user-id',
};

const testBuilderBlock = {
  id: 'test-block-id',
  tenantId: 'test-tenant-id',
  category: 'INTRO',
  title: 'Test Introduction Block',
  content: 'DEVANT LE {{juridiction}}\n\nPOUR : {{client.nom}}\n\nCONTRE : {{adversaire.nom}}',
  variables: ['juridiction', 'client.nom', 'adversaire.nom'],
  tags: ['intro', 'test'],
  isMandatory: false,
  isSystem: false,
};

const testBuilderTemplate = {
  id: 'test-template-id',
  tenantId: 'test-tenant-id',
  name: 'Test Template',
  description: 'A test template for unit tests',
  documentType: 'CONCLUSIONS',
  category: 'Procedure civile',
  blocksStructure: [
    { blockId: 'test-block-id', order: 1, isOptional: false },
  ],
  requiredVariables: ['juridiction', 'client.nom', 'adversaire.nom'],
  outputFormat: 'DOCX',
  isSystem: false,
};

// Helper function to generate JWT token for tests
const jwt = require('jsonwebtoken');

function generateTestToken(userId = testUser.id, tenantId = testTenant.id) {
  return jwt.sign(
    { userId, tenantId },
    process.env.JWT_SECRET || 'test-jwt-secret-min-32-characters-long',
    { expiresIn: '1h' }
  );
}

// Helper function to generate client token
function generateClientToken(clientId = testClient.id, tenantId = testTenant.id) {
  return jwt.sign(
    { clientId, tenantId, isClient: true },
    process.env.JWT_SECRET || 'test-jwt-secret-min-32-characters-long',
    { expiresIn: '1h' }
  );
}

module.exports = {
  testTenant,
  testUser,
  testClient,
  testDocument,
  testBuilderBlock,
  testBuilderTemplate,
  generateTestToken,
  generateClientToken,
};
