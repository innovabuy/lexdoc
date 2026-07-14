// GO-LIVE-6 — art. 648 CPC : une partie personne morale d'un acte de procédure doit
// avoir forme sociale + siège + n° d'immatriculation. pmIdentityMissing liste les manquants.
const { pmIdentityMissing } = require('../../src/utils/legal-format');

describe('pmIdentityMissing (art. 648 CPC)', () => {
  it('aucun manquant si les 3 champs sont présents', () => {
    expect(pmIdentityMissing({ formeSociale: 'SARL', siege: '11 rue X, Angers', numeroImmatriculation: '111 111 111' })).toEqual([]);
  });

  it('liste forme sociale + siège + n° RCS si tout est vide', () => {
    expect(pmIdentityMissing({})).toEqual(['forme sociale', 'siège', 'n° RCS']);
  });

  it('ne signale que le champ manquant', () => {
    expect(pmIdentityMissing({ formeSociale: 'SAS', siege: '9 bd Haussmann', numeroImmatriculation: '' })).toEqual(['n° RCS']);
    expect(pmIdentityMissing({ formeSociale: 'SAS', siege: '', numeroImmatriculation: '222' })).toEqual(['siège']);
  });

  it('traite les blancs/espaces comme manquants', () => {
    expect(pmIdentityMissing({ formeSociale: '  ', siege: '\t', numeroImmatriculation: ' ' })).toEqual(['forme sociale', 'siège', 'n° RCS']);
  });

  it('robuste sans argument', () => {
    expect(pmIdentityMissing()).toEqual(['forme sociale', 'siège', 'n° RCS']);
  });
});
