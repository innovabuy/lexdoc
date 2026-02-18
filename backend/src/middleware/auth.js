const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const { JWT_SECRET } = require('../config/constants');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedError('No token provided');

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedError('User not found or inactive');

    req.user = user;
    req.tenant = user.tenant;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
