/**
 * Utilitaires de formatage pour le branding tenant.
 * Pures string in / string out, sans dépendance Prisma/IO.
 */

function formatSiret(s) {
  if (s == null || s === '') return '';
  const str = String(s);
  if (!/^[\d\s.\-]+$/.test(str)) return '';
  const digits = str.replace(/\D/g, '');
  if (digits.length !== 14) return '';
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

function formatSiren(s) {
  if (s == null || s === '') return '';
  const str = String(s);
  if (!/^[\d\s.\-]+$/.test(str)) return '';
  const digits = str.replace(/\D/g, '');
  if (digits.length < 9) return '';
  const siren = digits.slice(0, 9);
  return `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6, 9)}`;
}

function buildFooterFromTenant(tenant) {
  if (!tenant) return '';
  const { legalName, addressLine1, siret, postalCode, city, barreau } = tenant;
  if (!legalName || !addressLine1 || !siret) return '';

  const l1 = `${legalName} - Société d'avocats`;

  const l2 = `${addressLine1}, ${postalCode || ''} ${city || ''}`
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/, '')
    .trim();

  const siretFmt = formatSiret(siret);
  const sirenFmt = formatSiren(siret);
  const villeRcs = barreau || city;

  const l3parts = [];
  if (siretFmt) l3parts.push(`SIRET ${siretFmt}`);
  if (sirenFmt && villeRcs) l3parts.push(`RCS ${villeRcs} ${sirenFmt}`);
  if (barreau) l3parts.push(`Avocat au Barreau de ${barreau}`);
  const l3 = l3parts.join(' - ');

  return l3 ? `${l1}\n${l2}\n${l3}` : `${l1}\n${l2}`;
}

module.exports = {
  formatSiret,
  formatSiren,
  buildFooterFromTenant,
};
