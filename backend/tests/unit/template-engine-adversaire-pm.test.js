// Fonctions pures extraites dans un util dédié → aucun I/O (Prisma/MinIO) chargé par ce test.
const {
  formatPartieAdverse,
  formatMontantEur,
  numberToFrenchWords,
  frenchDateInWords,
  frenchHourInWords,
} = require('../../src/utils/legal-format');

// Intl.NumberFormat (fr-FR) insère des espaces insécables (NNBSP  , NBSP  ).
// On normalise en espace simple pour des assertions lisibles.
const norm = (s) => (s || '').replace(/[  ]/g, ' ');

describe('GO-LIVE-1.B — adversaire personne morale', () => {
  describe('formatPartieAdverse — PERSONNE MORALE', () => {
    const pm = {
      type: 'MORALE',
      lastName: 'Contact',
      firstName: 'Jean',
      company: 'Démo SARL',
      address: '10 rue du Commerce, 49000 Angers',
      email: 'contact@demo.fr',
      phone: '0241000000',
      formeSociale: 'SARL',
      capital: 1000000, // centimes = 10 000,00 €
      villeImmatriculation: 'Angers',
      numeroImmatriculation: '987 654 321',
    };

    it('expose toutes les variables personne morale', () => {
      const r = formatPartieAdverse(pm, null);
      expect(r.type).toBe('MORALE');
      expect(r.raison_sociale).toBe('Démo SARL');
      expect(r.forme_sociale).toBe('SARL');
      expect(r.ville_immatriculation).toBe('Angers');
      expect(r.numero_immatriculation).toBe('987 654 321');
      expect(r.adresse).toBe('10 rue du Commerce, 49000 Angers');
      expect(norm(r.capital)).toBe('10 000,00 €');
    });

    it('capital : 1 000 000 centimes → "10 000,00 €"', () => {
      const r = formatPartieAdverse({ type: 'MORALE', lastName: 'X', company: 'Y', capital: 1000000 }, null);
      expect(norm(r.capital)).toBe('10 000,00 €');
    });

    it('mappe l’avocat adverse lié', () => {
      const avocat = { firstName: 'Marie', lastName: 'Durand', cabinet: 'Cabinet Durand', barreau: 'Paris', email: 'md@x.fr' };
      const r = formatPartieAdverse(pm, avocat);
      expect(r.avocat_nom).toBe('Marie Durand');
      expect(r.avocat_barreau).toBe('Paris');
    });
  });

  describe('formatPartieAdverse — PERSONNE PHYSIQUE (non-régression)', () => {
    const pp = {
      type: 'PHYSIQUE',
      lastName: 'Dupont',
      firstName: 'Jean',
      address: '1 rue de Paris',
      email: 'jean@dupont.fr',
      phone: '0600000000',
    };

    it('conserve exactement les clés existantes', () => {
      const r = formatPartieAdverse(pp, null);
      expect(r.nom).toBe('Dupont');
      expect(r.prenom).toBe('Jean');
      expect(r.adresse).toBe('1 rue de Paris');
      expect(r.email).toBe('jean@dupont.fr');
      expect(r.telephone).toBe('0600000000');
    });

    it('les champs personne morale sont des chaînes vides (ne polluent pas le rendu)', () => {
      const r = formatPartieAdverse(pp, null);
      expect(r.raison_sociale).toBe('');
      expect(r.forme_sociale).toBe('');
      expect(r.capital).toBe('');
      expect(r.ville_immatriculation).toBe('');
      expect(r.numero_immatriculation).toBe('');
    });

    it('capital null/absent → chaîne vide', () => {
      expect(formatPartieAdverse({ type: 'PHYSIQUE', lastName: 'X' }, null).capital).toBe('');
      expect(formatPartieAdverse({ type: 'MORALE', lastName: 'X', company: 'Y', capital: null }, null).capital).toBe('');
    });
  });

  describe('numberToFrenchWords', () => {
    const cases = [
      [0, 'zéro'],
      [1, 'un'],
      [16, 'seize'],
      [17, 'dix-sept'],
      [21, 'vingt et un'],
      [22, 'vingt-deux'],
      [70, 'soixante-dix'],
      [71, 'soixante et onze'],
      [80, 'quatre-vingts'],
      [81, 'quatre-vingt-un'],
      [90, 'quatre-vingt-dix'],
      [91, 'quatre-vingt-onze'],
      [100, 'cent'],
      [200, 'deux cents'],
      [101, 'cent un'],
      [1000, 'mille'],
      [2000, 'deux mille'],
      [2026, 'deux mille vingt-six'],
      [2021, 'deux mille vingt et un'],
    ];
    it.each(cases)('%i → %s', (n, expected) => {
      expect(numberToFrenchWords(n)).toBe(expected);
    });
  });

  describe('frenchDateInWords / frenchHourInWords', () => {
    it('date d’audience en toutes lettres', () => {
      // 12 juillet 2026, 14:30 (heure locale)
      const d = new Date(2026, 6, 12, 14, 30);
      expect(frenchDateInWords(d)).toBe('le douze juillet deux mille vingt-six');
    });

    it('1er du mois → "premier"', () => {
      const d = new Date(2026, 2, 1, 9, 0);
      expect(frenchDateInWords(d)).toBe('le premier mars deux mille vingt-six');
    });

    it('heure d’audience en toutes lettres', () => {
      expect(frenchHourInWords(new Date(2026, 6, 12, 14, 30))).toBe('quatorze heures trente');
      expect(frenchHourInWords(new Date(2026, 6, 12, 10, 0))).toBe('dix heures');
      expect(frenchHourInWords(new Date(2026, 6, 12, 1, 0))).toBe('une heure');
    });

    it('date invalide → chaîne vide', () => {
      expect(frenchDateInWords('pas une date')).toBe('');
      expect(frenchHourInWords(undefined)).toBe('');
    });
  });
});
