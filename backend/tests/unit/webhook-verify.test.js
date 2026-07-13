const crypto = require('crypto');
const { verifyWebhook, timingSafeEqualStr } = require('../../src/utils/webhook-verify');

const SECRET = 'test_webhook_secret_123';
const body = Buffer.from(JSON.stringify({ id: 'abc', status: 'delivered' }));
const sigHex = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
const sigB64 = crypto.createHmac('sha256', SECRET).update(body).digest('base64');

describe('GO-LIVE-2.B — verifyWebhook (fail-closed HMAC)', () => {
  it('signature valide (hex) → ok', () => {
    expect(verifyWebhook({ secret: SECRET, rawBody: body, signature: sigHex, digest: 'hex', isProduction: true }))
      .toEqual({ ok: true });
  });

  it('signature valide (base64, DocuSign) → ok', () => {
    expect(verifyWebhook({ secret: SECRET, rawBody: body, signature: sigB64, digest: 'base64', isProduction: true }).ok)
      .toBe(true);
  });

  it('signature INVALIDE → 401', () => {
    const r = verifyWebhook({ secret: SECRET, rawBody: body, signature: 'deadbeef', digest: 'hex', isProduction: true });
    expect(r.ok).toBe(false); expect(r.status).toBe(401);
  });

  it('secret ABSENT en PRODUCTION → 401 (fail-closed, PAS 200)', () => {
    const r = verifyWebhook({ secret: undefined, rawBody: body, signature: sigHex, isProduction: true });
    expect(r.ok).toBe(false); expect(r.status).toBe(401);
  });

  it('secret absent hors production → toléré (dev) mais signalé', () => {
    const r = verifyWebhook({ secret: undefined, rawBody: body, signature: sigHex, isProduction: false });
    expect(r.ok).toBe(true); expect(r.insecureDev).toBe(true);
  });

  it('signature manquante → 401', () => {
    const r = verifyWebhook({ secret: SECRET, rawBody: body, signature: undefined, isProduction: true });
    expect(r.ok).toBe(false); expect(r.status).toBe(401);
  });

  it('corps brut absent → 400 (HMAC impossible)', () => {
    const r = verifyWebhook({ secret: SECRET, rawBody: undefined, signature: sigHex, isProduction: true });
    expect(r.ok).toBe(false); expect(r.status).toBe(400);
  });

  it('CORPS MODIFIÉ après signature → 401', () => {
    const tampered = Buffer.from(JSON.stringify({ id: 'abc', status: 'delivered', injected: true }));
    const r = verifyWebhook({ secret: SECRET, rawBody: tampered, signature: sigHex, digest: 'hex', isProduction: true });
    expect(r.ok).toBe(false); expect(r.status).toBe(401);
  });

  it('timestamp périmé (> 5 min) → 401 (anti-rejeu)', () => {
    const old = Math.floor(Date.now() / 1000) - 3600;
    const r = verifyWebhook({ secret: SECRET, rawBody: body, signature: sigHex, digest: 'hex', isProduction: true, timestamp: old });
    expect(r.ok).toBe(false); expect(r.status).toBe(401);
  });

  it('timestamp frais → ok', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(verifyWebhook({ secret: SECRET, rawBody: body, signature: sigHex, digest: 'hex', isProduction: true, timestamp: now }).ok)
      .toBe(true);
  });

  describe('timingSafeEqualStr', () => {
    it('longueurs différentes → false (sans throw)', () => {
      expect(timingSafeEqualStr('abc', 'abcd')).toBe(false);
    });
    it('égales → true', () => {
      expect(timingSafeEqualStr('samesame', 'samesame')).toBe(true);
    });
    it('null/undefined → false, sans crash', () => {
      expect(timingSafeEqualStr(null, 'x')).toBe(false);
      expect(timingSafeEqualStr(undefined, undefined)).toBe(true); // '' === ''
    });
  });
});
