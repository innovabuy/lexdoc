const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');
const { omitSensitiveFields } = require('../utils/helpers');

class AuthService {
  async register(data) {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      include: { tenant: true },
    });

    return omitSensitiveFields(user);
  }

  async login(email, password) {
    // Trim whitespace from credentials
    email = email?.trim();
    password = password?.trim();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) throw new UnauthorizedError('Account disabled');

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      user: omitSensitiveFields(user),
    };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true },
      });

      return user ? omitSensitiveFields(user) : null;
    } catch {
      return null;
    }
  }
}

module.exports = new AuthService();
