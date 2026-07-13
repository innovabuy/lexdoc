/**
 * GO-LIVE-6 B1 — Validation du CONTENU réel d'un upload par sa signature (magic number),
 * et NON par l'extension ou le mimetype déclaré (tous deux falsifiables).
 * Un .exe renommé .docx est rejeté : sa signature (MZ / 0x4D5A) n'est pas dans la liste.
 *
 * Formats métier autorisés : PDF, Word (.doc/.docx), OpenDocument (.odt), images JPG/PNG.
 * (docx/odt/xlsx partagent la signature ZIP ; .doc/.xls la signature OLE.)
 */

const SIGNATURES = [
  { kind: 'pdf', hex: '25504446' }, // %PDF
  { kind: 'png', hex: '89504E47' }, // \x89PNG
  { kind: 'jpg', hex: 'FFD8FF' }, // JPEG (JFIF/EXIF)
  { kind: 'zip', hex: '504B0304' }, // ZIP -> docx / odt / xlsx
  { kind: 'zip', hex: '504B0506' }, // ZIP vide
  { kind: 'zip', hex: '504B0708' }, // ZIP spanned
  { kind: 'ole', hex: 'D0CF11E0' }, // OLE compound -> .doc / .xls (Office 97-2003)
];

// Types métier acceptés (par "kind" détecté sur le contenu)
const ALLOWED_KINDS = new Set(['pdf', 'png', 'jpg', 'zip', 'ole']);

const ALLOWED_LABEL = 'PDF, Word (.doc/.docx), OpenDocument (.odt), images JPG/PNG';

/**
 * @param {Buffer} buffer  premiers octets du fichier
 * @returns {string|null}  'pdf' | 'png' | 'jpg' | 'zip' | 'ole' | null (inconnu)
 */
function detectMagic(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  const head = buffer.subarray(0, 8).toString('hex').toUpperCase();
  for (const s of SIGNATURES) {
    if (head.startsWith(s.hex)) return s.kind;
  }
  return null;
}

/**
 * @param {Buffer} buffer
 * @returns {{ ok: boolean, kind: string|null }}
 */
function assertAllowedUpload(buffer) {
  const kind = detectMagic(buffer);
  return { ok: !!kind && ALLOWED_KINDS.has(kind), kind };
}

module.exports = { detectMagic, assertAllowedUpload, ALLOWED_KINDS, ALLOWED_LABEL };
