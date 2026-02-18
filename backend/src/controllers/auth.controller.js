const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');
const { omitSensitiveFields } = require('../utils/helpers');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  const user = omitSensitiveFields(req.user);
  const tenant = omitSensitiveFields(req.tenant);
  return successResponse(res, { user, tenant });
};

const logout = async (req, res) => {
  // JWT est stateless, logout côté client
  return successResponse(res, null, 'Logged out');
};

module.exports = { login, me, logout };
