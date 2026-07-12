/**
 * GO-LIVE-1.B — Helpers de formatage juridique, purs et sans I/O.
 * Extraits de template-engine.service.js pour être testables isolément
 * (pas de Prisma / MinIO / Docxtemplater chargés).
 */

/**
 * Formate un nombre en montant français : "2 500,00 €"
 */
function formatMontantEur(n) {
  if (n == null || isNaN(n)) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Mappe une FolderPerson (rôle PARTIE_ADVERSE) vers l'objet exposé dans la boucle
 * {#parties_adverses}. Additif : conserve exactement les clés existantes (nom, prenom, adresse,
 * email, telephone, avocat_*) — pour un adversaire PHYSIQUE, les champs PM sont des chaînes vides
 * et ne polluent donc pas le rendu (zéro régression). `capital` est stocké en CENTIMES → /100 au formatage.
 * @param {object} p       FolderPerson (partie adverse)
 * @param {object} [avocat] FolderPerson liée (rôle AVOCAT_ADVERSE) ou undefined
 */
function formatPartieAdverse(p, avocat) {
  return {
    type: p.type || 'PHYSIQUE',
    nom: p.lastName || '',
    prenom: p.firstName || '',
    adresse: p.address || '',
    email: p.email || '',
    telephone: p.phone || '',
    // Personne morale (vides si physique)
    raison_sociale: p.company || '',
    forme_sociale: p.formeSociale || '',
    capital: (p.capital != null && !isNaN(Number(p.capital))) ? formatMontantEur(Number(p.capital) / 100) : '',
    ville_immatriculation: p.villeImmatriculation || '',
    numero_immatriculation: p.numeroImmatriculation || '',
    // Avocat adverse
    avocat_nom: avocat ? `${avocat.firstName || ''} ${avocat.lastName || ''}`.trim() : '',
    avocat_cabinet: avocat?.cabinet || '',
    avocat_barreau: avocat?.barreau || '',
    avocat_email: avocat?.email || '',
  };
}

/**
 * Convertit un entier (0..9999) en toutes lettres françaises.
 * Couvre années, jours, heures, minutes. Orthographe traditionnelle ("vingt et un", "soixante et onze").
 */
function numberToFrenchWords(n) {
  n = Math.floor(Math.abs(Number(n)));
  if (isNaN(n)) return '';
  if (n === 0) return 'zéro';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function under100(x) {
    if (x < 20) return units[x];
    const t = Math.floor(x / 10);
    const u = x % 10;
    const base = tens[t];
    if (t === 7 || t === 9) {
      // 70-79 = soixante + (dix..dix-neuf) ; 90-99 = quatre-vingt + (dix..dix-neuf)
      if (t === 7 && u === 1) return `${base} et ${units[11]}`; // soixante et onze
      return `${base}-${units[10 + u]}`;
    }
    if (u === 0) return t === 8 ? 'quatre-vingts' : base; // 80 → quatre-vingts
    if (u === 1 && t !== 8) return `${base} et ${units[1]}`; // vingt et un ... soixante et un
    return `${base}-${units[u]}`; // quatre-vingt-un (t=8, pas de "et")
  }

  function under1000(x) {
    if (x < 100) return under100(x);
    const h = Math.floor(x / 100);
    const r = x % 100;
    const hundred = h === 1 ? 'cent' : `${units[h]} cent`;
    if (r === 0) return h > 1 ? `${hundred}s` : hundred; // deux cents
    return `${hundred} ${under100(r)}`;
  }

  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  let result = '';
  if (th > 0) result = th === 1 ? 'mille' : `${under1000(th)} mille`;
  if (rest > 0) result = result ? `${result} ${under1000(rest)}` : under1000(rest);
  return result.trim();
}

/**
 * Date en toutes lettres pour l'assignation, ex: "le douze juillet deux mille vingt-six".
 * Le 1er du mois → "premier".
 */
function frenchDateInWords(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const day = d.getDate();
  const dayWord = day === 1 ? 'premier' : numberToFrenchWords(day);
  return `le ${dayWord} ${mois[d.getMonth()]} ${numberToFrenchWords(d.getFullYear())}`;
}

/**
 * Heure en toutes lettres, ex: "quatorze heures trente", "une heure", "dix heures".
 */
function frenchHourInWords(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  const hWord = h === 0 ? 'zéro' : (h === 1 ? 'une' : numberToFrenchWords(h));
  const hLabel = h === 1 ? 'heure' : 'heures';
  let s = `${hWord} ${hLabel}`;
  if (m > 0) s += ` ${numberToFrenchWords(m)}`;
  return s;
}

module.exports = {
  formatMontantEur,
  formatPartieAdverse,
  numberToFrenchWords,
  frenchDateInWords,
  frenchHourInWords,
};
