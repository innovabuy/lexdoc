// GO-LIVE-6 C5 — requireRole : un membre sans le rôle requis reçoit 403 (Forbidden),
// jamais 401. Réserve le destructif + signature + LRAR à l'ADMIN.
jest.mock('../../src/config/database', () => ({}));
jest.mock('../../src/config/constants', () => ({ JWT_SECRET: 'x'.repeat(32), JWT_EXPIRES_IN: '1h' }));

const { requireRole } = require('../../src/middleware/auth');

function run(userRole, ...allowed) {
  const req = { user: userRole ? { role: userRole } : null };
  let captured;
  const next = (err) => { captured = err; };
  requireRole(...allowed)(req, {}, next);
  return captured;
}

describe('requireRole (C5)', () => {
  it('laisse passer un ADMIN sur une route ADMIN (next sans erreur)', () => {
    expect(run('ADMIN', 'ADMIN')).toBeUndefined();
  });

  it('refuse un ASSISTANT sur une route ADMIN avec 403', () => {
    const err = run('ASSISTANT', 'ADMIN');
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it('refuse (403) quand aucun utilisateur n\'est présent', () => {
    const err = run(null, 'ADMIN');
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it('accepte un des rôles autorisés multiples', () => {
    expect(run('ASSISTANT', 'ADMIN', 'ASSISTANT')).toBeUndefined();
  });
});
