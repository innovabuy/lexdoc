const crypto = require('crypto');

/**
 * Comparaison en temps constant (évite les timing attacks). Renvoie false si longueurs différentes.
 */
function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(String(a == null ? '' : a), 'utf8');
  const bb = Buffer.from(String(b == null ? '' : b), 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * GO-LIVE-2.B — Vérification HMAC des webhooks, FAIL-CLOSED.
 * - Secret absent EN PRODUCTION → rejet 401 (jamais 200).
 * - HMAC calculé sur le CORPS BRUT (rawBody), pas le JSON re-sérialisé.
 * - Comparaison en temps constant.
 * - Anti-rejeu optionnel : si un timestamp est fourni, rejet au-delà de maxAgeSec.
 *
 * @returns {{ok:boolean, status?:number, reason?:string, insecureDev?:boolean}}
 */
function verifyWebhook({ secret, rawBody, signature, digest = 'hex', isProduction = false, timestamp, maxAgeSec = 300 }) {
  if (!secret) {
    // Fail-closed en production ; en dev/test on tolère (pas de secret configuré) mais on le signale.
    if (isProduction) return { ok: false, status: 401, reason: 'webhook secret not configured (fail-closed in production)' };
    return { ok: true, insecureDev: true };
  }
  if (!signature) return { ok: false, status: 401, reason: 'missing signature header' };
  if (!rawBody || rawBody.length === 0) return { ok: false, status: 400, reason: 'missing raw body (HMAC impossible)' };

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest(digest);
  if (!timingSafeEqualStr(signature, expected)) return { ok: false, status: 401, reason: 'signature mismatch' };

  if (timestamp != null && timestamp !== '') {
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return { ok: false, status: 401, reason: 'invalid timestamp' };
    const tsSec = ts > 1e12 ? ts / 1000 : ts;   // accepte secondes ou millisecondes
    const ageSec = Math.abs(Date.now() / 1000 - tsSec);
    if (ageSec > maxAgeSec) return { ok: false, status: 401, reason: 'timestamp outside tolerance (replay?)' };
  }

  return { ok: true };
}

module.exports = { verifyWebhook, timingSafeEqualStr };
