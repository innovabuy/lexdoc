// GO-LIVE-6 — une partie personne morale doit avoir forme sociale + capital + siège +
// n° d'immatriculation. pmIdentityMissing liste les manquants, dans l'ordre de l'acte.
const { pmIdentityMissing } = require('../../src/utils/legal-format');

describe('pmIdentityMissing', () => {
  it('aucun manquant si les 4 champs sont présents', () => {
    expect(pmIdentityMissing({ formeSociale: 'SARL', capital: '10000', siege: '11 rue X, Angers', numeroImmatriculation: '111 111 111' })).toEqual([]);
  });

  it('liste forme + capital + siège + n° RCS si tout est vide', () => {
    expect(pmIdentityMissing({})).toEqual(['forme sociale', 'capital social', 'siège', 'n° RCS']);
  });

  it('signale le capital manquant seul', () => {
    expect(pmIdentityMissing({ formeSociale: 'SAS', capital: '', siege: '9 bd Haussmann', numeroImmatriculation: '222' })).toEqual(['capital social']);
  });

  it('accepte un capital en centimes (Int) non nul, refuse 0', () => {
    expect(pmIdentityMissing({ formeSociale: 'SAS', capital: 5000000, siege: '9 bd', numeroImmatriculation: '222' })).toEqual([]);
    expect(pmIdentityMissing({ formeSociale: 'SAS', capital: 0, siege: '9 bd', numeroImmatriculation: '222' })).toEqual(['capital social']);
  });

  it('traite les blancs comme manquants', () => {
    expect(pmIdentityMissing({ formeSociale: '  ', capital: ' ', siege: '\t', numeroImmatriculation: ' ' })).toEqual(['forme sociale', 'capital social', 'siège', 'n° RCS']);
  });

  it('robuste sans argument', () => {
    expect(pmIdentityMissing()).toEqual(['forme sociale', 'capital social', 'siège', 'n° RCS']);
  });
});
