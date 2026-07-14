// GO-LIVE-6 LOT D — régression : omitSensitiveFields / serializeBigInt ne doit PAS
// transformer les Date en {} (bug de sérialisation LRAR : createdAt/updatedAt en {}).
const { omitSensitiveFields } = require('../../src/utils/helpers');

describe('omitSensitiveFields — préserve les types feuilles', () => {
  it('garde une Date intacte (sérialisable en ISO)', () => {
    const d = new Date('2026-07-14T07:30:00.000Z');
    const out = omitSensitiveFields({ id: 'x', createdAt: d, updatedAt: d });
    expect(out.createdAt instanceof Date).toBe(true);
    expect(JSON.stringify(out.createdAt)).toBe('"2026-07-14T07:30:00.000Z"');
    expect(JSON.parse(JSON.stringify(out)).createdAt).toBe('2026-07-14T07:30:00.000Z');
  });

  it('convertit les BigInt en chaîne et retire les champs sensibles', () => {
    const out = omitSensitiveFields({ size: 12345n, password: 'secret', name: 'ok' });
    expect(out.size).toBe('12345');
    expect(out.password).toBeUndefined();
    expect(out.name).toBe('ok');
  });

  it('récursive dans les objets littéraux imbriqués sans casser les Date', () => {
    const out = omitSensitiveFields({ meta: { at: new Date('2026-01-01T00:00:00.000Z'), n: 7n } });
    expect(out.meta.at instanceof Date).toBe(true);
    expect(out.meta.n).toBe('7');
  });
});
