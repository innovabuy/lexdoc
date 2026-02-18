const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { testUser, testTenant } = require('../fixtures');

// Mock Prisma client
jest.mock('../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock constants
jest.mock('../../src/config/constants', () => ({
  JWT_SECRET: 'test-jwt-secret-min-32-characters-long',
  JWT_EXPIRES_IN: '1h',
}));

const prisma = require('../../src/config/database');
const AuthService = require('../../src/services/auth.service');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      const mockUser = {
        ...testUser,
        password: hashedPassword,
        tenant: testTenant,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await AuthService.login('avocat@test-cabinet.fr', 'TestPassword123!');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('avocat@test-cabinet.fr');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error for invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        AuthService.login('invalid@email.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      const mockUser = {
        ...testUser,
        password: hashedPassword,
        tenant: testTenant,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        AuthService.login('avocat@test-cabinet.fr', 'WrongPassword!')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      const mockUser = {
        ...testUser,
        password: hashedPassword,
        isActive: false,
        tenant: testTenant,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        AuthService.login('avocat@test-cabinet.fr', 'TestPassword123!')
      ).rejects.toThrow('Account disabled');
    });

    it('should trim whitespace from credentials', async () => {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      const mockUser = {
        ...testUser,
        password: hashedPassword,
        tenant: testTenant,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await AuthService.login('  avocat@test-cabinet.fr  ', '  TestPassword123!  ');

      expect(result).toHaveProperty('token');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'avocat@test-cabinet.fr' },
        include: { tenant: true },
      });
    });

    it('should update lastLoginAt on successful login', async () => {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      const mockUser = {
        ...testUser,
        password: hashedPassword,
        tenant: testTenant,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      await AuthService.login('avocat@test-cabinet.fr', 'TestPassword123!');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });
  });

  describe('verifyToken', () => {
    it('should return user for valid token', async () => {
      const mockUser = {
        ...testUser,
        tenant: testTenant,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const token = jwt.sign(
        { userId: testUser.id, tenantId: testTenant.id },
        'test-jwt-secret-min-32-characters-long',
        { expiresIn: '1h' }
      );

      const result = await AuthService.verifyToken(token);

      expect(result).toBeDefined();
      expect(result.email).toBe(testUser.email);
      expect(result).not.toHaveProperty('password');
    });

    it('should return null for invalid token', async () => {
      const result = await AuthService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const token = jwt.sign(
        { userId: testUser.id, tenantId: testTenant.id },
        'test-jwt-secret-min-32-characters-long',
        { expiresIn: '-1h' }
      );

      const result = await AuthService.verifyToken(token);

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const token = jwt.sign(
        { userId: 'non-existent-id', tenantId: testTenant.id },
        'test-jwt-secret-min-32-characters-long',
        { expiresIn: '1h' }
      );

      const result = await AuthService.verifyToken(token);

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      const newUser = {
        email: 'new@test.com',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        tenantId: testTenant.id,
        role: 'USER',
      };

      const createdUser = {
        ...newUser,
        id: 'new-user-id',
        password: 'hashed_password',
        tenant: testTenant,
      };

      prisma.user.create.mockResolvedValue(createdUser);

      const result = await AuthService.register(newUser);

      expect(result).toHaveProperty('email', 'new@test.com');
      expect(result).not.toHaveProperty('password');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@test.com',
          firstName: 'New',
          lastName: 'User',
          password: expect.any(String),
        }),
        include: { tenant: true },
      });
    });
  });
});
