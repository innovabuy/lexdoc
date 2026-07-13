const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
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

// GO-LIVE-6 C5 — autorisation par rôle. Un utilisateur authentifié mais sans le rôle
// requis reçoit 403 (Forbidden), pas 401 (Unauthorized) : il EST identifié, mais n'a
// pas la permission. Utilisé pour réserver le destructif + signature + LRAR à l'ADMIN.
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Action réservée à un administrateur du cabinet'));
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
