import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database';
import { hashPassword } from '@/utils/crypto';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { CabinetStatus, UserRole, DocumentType } from '@prisma/client';

export interface TestCabinet {
  id: string;
  name: string;
  email: string;
  status: CabinetStatus;
}

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  cabinetId: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Create a test cabinet
 */
export async function createTestCabinet(
  overrides: Partial<{
    name: string;
    email: string;
    status: CabinetStatus;
  }> = {}
): Promise<TestCabinet> {
  const cabinet = await prisma.cabinet.create({
    data: {
      name: overrides.name || `Test Cabinet ${Date.now()}`,
      email: overrides.email || `cabinet-${Date.now()}@test.com`,
      status: overrides.status || CabinetStatus.ACTIVE,
    },
  });

  return cabinet;
}

/**
 * Create a test user with tokens
 */
export async function createTestUser(
  cabinetId: string,
  overrides: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }> = {}
): Promise<TestUser> {
  const password = overrides.password || 'TestPassword123!';
  const hashedPassword = await hashPassword(password);
  const tokenId = uuidv4();

  const user = await prisma.user.create({
    data: {
      email: overrides.email || `user-${Date.now()}@test.com`,
      password: hashedPassword,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
      role: overrides.role || UserRole.SECRETAIRE,
      cabinetId,
      refreshTokens: [tokenId],
    },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    cabinetId: user.cabinetId,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    tokenId,
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    cabinetId: user.cabinetId,
    accessToken,
    refreshToken,
  };
}

/**
 * Create an admin user for a cabinet
 */
export async function createTestAdmin(cabinetId: string): Promise<TestUser> {
  return createTestUser(cabinetId, {
    email: `admin-${Date.now()}@test.com`,
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
  });
}

/**
 * Create an avocat user for a cabinet
 */
export async function createTestAvocat(cabinetId: string): Promise<TestUser> {
  return createTestUser(cabinetId, {
    email: `avocat-${Date.now()}@test.com`,
    role: UserRole.AVOCAT,
    firstName: 'Avocat',
    lastName: 'User',
  });
}

/**
 * Create a collaborateur user for a cabinet
 */
export async function createTestCollaborateur(cabinetId: string): Promise<TestUser> {
  return createTestUser(cabinetId, {
    email: `collaborateur-${Date.now()}@test.com`,
    role: UserRole.COLLABORATEUR,
    firstName: 'Collaborateur',
    lastName: 'User',
  });
}

/**
 * Create a secretaire user for a cabinet
 */
export async function createTestSecretaire(cabinetId: string): Promise<TestUser> {
  return createTestUser(cabinetId, {
    email: `secretaire-${Date.now()}@test.com`,
    role: UserRole.SECRETAIRE,
    firstName: 'Secretaire',
    lastName: 'User',
  });
}

/**
 * Create a complete test setup with cabinet and admin
 */
export async function createTestSetup(): Promise<{
  cabinet: TestCabinet;
  admin: TestUser;
}> {
  const cabinet = await createTestCabinet();
  const admin = await createTestAdmin(cabinet.id);

  return { cabinet, admin };
}

/**
 * Create test folder
 */
export async function createTestFolder(
  cabinetId: string,
  overrides: Partial<{
    name: string;
    description: string;
    parentId: string;
  }> = {}
) {
  return prisma.folder.create({
    data: {
      name: overrides.name || `Test Folder ${Date.now()}`,
      description: overrides.description,
      parentId: overrides.parentId,
      cabinetId,
    },
  });
}

/**
 * Create test document
 */
export async function createTestDocument(
  cabinetId: string,
  createdById: string,
  overrides: Partial<{
    title: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    minioPath: string;
    folderId: string;
    type: DocumentType;
  }> = {}
) {
  const timestamp = Date.now();
  return prisma.document.create({
    data: {
      title: overrides.title || `Test Document ${timestamp}`,
      filename: overrides.filename || `test-${timestamp}.pdf`,
      originalName: overrides.originalName || `Test Document ${timestamp}.pdf`,
      mimeType: overrides.mimeType || 'application/pdf',
      size: overrides.size || 1024,
      minioPath: overrides.minioPath || `/test/${timestamp}.pdf`,
      type: overrides.type || DocumentType.OTHER,
      folderId: overrides.folderId,
      cabinetId,
      createdById,
    },
  });
}

/**
 * Authorization header helper
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
