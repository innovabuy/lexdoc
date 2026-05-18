const {
  formatSiret,
  formatSiren,
  buildFooterFromTenant,
} = require('../../src/utils/branding-format');

describe('branding-format utils', () => {

  describe('formatSiret', () => {
    it('formats a 14-digit SIRET into 3-3-3-5 groups', () => {
      expect(formatSiret('12345678900015')).toBe('123 456 789 00015');
    });

    it('normalizes a SIRET that already contains spaces', () => {
      expect(formatSiret('982 600 272 00016')).toBe('982 600 272 00016');
    });

    it('normalizes a SIRET that contains dashes or other separators', () => {
      expect(formatSiret('982-600-272-00016')).toBe('982 600 272 00016');
    });

    it('returns empty string for null/undefined/empty input', () => {
      expect(formatSiret(null)).toBe('');
      expect(formatSiret(undefined)).toBe('');
      expect(formatSiret('')).toBe('');
    });

    it('returns empty string for a SIRET with wrong length', () => {
      expect(formatSiret('982600272000')).toBe(''); // 12 digits
      expect(formatSiret('1234567890001500')).toBe(''); // 16 digits
    });

    it('returns empty string when input contains letters or other invalid chars', () => {
      expect(formatSiret('12345678900015XX')).toBe('');
      expect(formatSiret('ABC45678900015')).toBe('');
      expect(formatSiren('123456789ABC')).toBe('');
    });
  });

  describe('formatSiren', () => {
    it('extracts and formats SIREN from a 14-digit SIRET', () => {
      expect(formatSiren('12345678900015')).toBe('123 456 789');
    });

    it('formats a 9-digit SIREN directly', () => {
      expect(formatSiren('123456789')).toBe('123 456 789');
    });

    it('returns empty string for input with fewer than 9 digits', () => {
      expect(formatSiren('12345')).toBe('');
      expect(formatSiren(null)).toBe('');
      expect(formatSiren('')).toBe('');
    });
  });

  describe('buildFooterFromTenant', () => {
    it('builds the 3-line footer from a complete Pragmavox tenant', () => {
      const tenant = {
        legalName: 'SELARL Pragma Vox Avocat',
        addressLine1: '11 Rue Paul Langevin',
        postalCode: '49240',
        city: 'Avrillé',
        siret: '98260027200016',
        barreau: 'Angers',
      };
      const expected =
        "SELARL Pragma Vox Avocat - Société d'avocats\n" +
        '11 Rue Paul Langevin, 49240 Avrillé\n' +
        'SIRET 982 600 272 00016 - RCS Angers 982 600 272 - Avocat au Barreau de Angers';
      expect(buildFooterFromTenant(tenant)).toBe(expected);
    });

    it('returns empty string when a critical field is missing', () => {
      expect(buildFooterFromTenant({})).toBe('');
      expect(buildFooterFromTenant({ legalName: 'X', addressLine1: 'Y' })).toBe(''); // missing siret
      expect(buildFooterFromTenant(null)).toBe('');
      expect(buildFooterFromTenant(undefined)).toBe('');
    });

    it('falls back to city for RCS when barreau is missing, and omits "Avocat au Barreau de" mention', () => {
      const tenant = {
        legalName: 'SELARL Test',
        addressLine1: '1 Rue X',
        postalCode: '75000',
        city: 'Paris',
        siret: '12345678900015',
        // barreau absent
      };
      const result = buildFooterFromTenant(tenant);
      expect(result).toContain("SELARL Test - Société d'avocats");
      expect(result).toContain('1 Rue X, 75000 Paris');
      expect(result).toContain('SIRET 123 456 789 00015');
      expect(result).toContain('RCS Paris 123 456 789');
      expect(result).not.toContain('Avocat au Barreau de');
      expect(result).not.toContain('undefined');
    });
  });
});
