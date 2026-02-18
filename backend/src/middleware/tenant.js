const { ForbiddenError } = require('../utils/errors');

const enforceTenant = (req, res, next) => {
  // Assure que toutes les requêtes sont filtrées par tenantId
  if (!req.tenant?.id) {
    return next(new ForbiddenError('Tenant context required'));
  }

  // Ajouter le tenantId aux query params Prisma automatiquement
  req.tenantFilter = { tenantId: req.tenant.id };
  next();
};

module.exports = { enforceTenant };
