import { prisma } from '@/config/database';
import { hashPassword, comparePassword, generateUrlSafeToken } from '@/utils/crypto';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '@/utils/errors';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  ChangePasswordInput,
  ListUsersQuery,
} from './users.schemas';

export class UsersService {
  /**
   * List users in cabinet
   */
  async listUsers(cabinetId: string, query: ListUsersQuery) {
    const { page, limit, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      cabinetId,
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          twoFactorEnabled: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string, cabinetId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, cabinetId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        twoFactorEnabled: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Create a new user
   */
  async createUser(cabinetId: string, data: CreateUserInput, createdById: string) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check user limit
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { maxUsers: true },
    });

    const userCount = await prisma.user.count({
      where: { cabinetId, deletedAt: null },
    });

    if (cabinet && userCount >= cabinet.maxUsers) {
      throw new BadRequestError('User limit reached for this cabinet');
    }

    // Generate temporary password
    const tempPassword = generateUrlSafeToken(12);
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        cabinetId,
        verifyToken: generateUrlSafeToken(32),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId: createdById,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        details: { email: user.email, role: user.role },
      },
    });

    // TODO: Send invitation email with temp password

    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    cabinetId: string,
    data: UpdateUserInput,
    updatedById: string
  ) {
    // Verify user exists and belongs to cabinet
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, cabinetId, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId: updatedById,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: userId,
        details: { changes: data },
      },
    });

    return user;
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(
    userId: string,
    cabinetId: string,
    data: UpdateUserRoleInput,
    updatedById: string
  ) {
    // Cannot change own role
    if (userId === updatedById) {
      throw new ForbiddenError('Cannot change your own role');
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, cabinetId, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: data.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId: updatedById,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: userId,
        details: { roleChanged: { from: existingUser.role, to: data.role } },
      },
    });

    return user;
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(
    userId: string,
    cabinetId: string,
    data: UpdateUserStatusInput,
    updatedById: string
  ) {
    // Cannot deactivate yourself
    if (userId === updatedById && !data.isActive) {
      throw new ForbiddenError('Cannot deactivate your own account');
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, cabinetId, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: data.isActive,
        // Invalidate sessions if deactivating
        ...(data.isActive === false && { refreshTokens: [] }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId: updatedById,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: userId,
        details: { isActive: data.isActive },
      },
    });

    return user;
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string, cabinetId: string, deletedById: string) {
    // Cannot delete yourself
    if (userId === deletedById) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, cabinetId, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        refreshTokens: [],
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId: deletedById,
        action: 'USER_DELETED',
        entity: 'User',
        entityId: userId,
        details: { email: existingUser.email },
      },
    });
  }

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValid = await comparePassword(data.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        refreshTokens: [], // Invalidate all sessions
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId: user.cabinetId,
        userId: user.id,
        action: 'USER_PASSWORD_CHANGED',
        entity: 'User',
        entityId: user.id,
      },
    });
  }
}

export const usersService = new UsersService();
