// GO-LIVE-6 B2 — jamais de 500 sur une entrée utilisateur : les erreurs Prisma de
// validation (enum invalide) et de requête (octet NUL) doivent être mappées en 400.
jest.mock('../../src/config/logger', () => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn() }));
jest.mock('../../src/config/sentry', () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const { errorHandler } = require('../../src/middleware/errorHandler');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}
const req = { method: 'POST', originalUrl: '/api/clients', ip: '127.0.0.1', body: {}, query: {}, params: {} };

describe('errorHandler — entrées invalides → 400 (jamais 500)', () => {
  it('PrismaClientValidationError (enum inconnu) → 400', () => {
    const err = new Error('Invalid value for argument `type`. Expected ClientType.');
    err.name = 'PrismaClientValidationError';
    const res = mockRes();
    errorHandler(err, req, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('octet NUL 0x00 (PostgreSQL 22021) → 400 avec message explicite', () => {
    const err = new Error('Error occurred during query execution: ... invalid byte sequence for encoding "UTF8": 0x00');
    err.name = 'PrismaClientUnknownRequestError';
    const res = mockRes();
    errorHandler(err, req, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(res.body.error.message).toMatch(/caractères non autorisés/i);
  });

  it('une vraie erreur inconnue reste en 500', () => {
    const err = new Error('boom');
    const res = mockRes();
    errorHandler(err, req, res, () => {});
    expect(res.statusCode).toBe(500);
  });
});
