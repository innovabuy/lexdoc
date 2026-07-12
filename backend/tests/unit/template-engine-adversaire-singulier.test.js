const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { buildAdversaireSingulier, formatPartieAdverse } = require('../../src/utils/legal-format');

// ── Fabrique un .docx minimal en mémoire pour tester le rendu Docxtemplater ──
function makeDocx(bodyText) {
  const zip = new PizZip();
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>');
  zip.folder('_rels').file('.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>');
  zip.folder('word').file('document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    `<w:p><w:r><w:t xml:space="preserve">${bodyText}</w:t></w:r></w:p>` +
    '</w:body></w:document>');
  return zip.generate({ type: 'nodebuffer' });
}

function render(buffer, data) {
  const doc = new Docxtemplater(new PizZip(buffer), { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const xml = new PizZip(doc.getZip().generate({ type: 'nodebuffer' })).file('word/document.xml').asText();
  return xml.replace(/<[^>]+>/g, '');
}

// Aplatit une section {a:{x}} en {a_x} (comme flattenObject du service)
const flat = (section, obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [`${section}_${k}`, v]));

describe('GO-LIVE-1.C.1 — adversaire singulier + booléens PP/PM', () => {
  const pm = formatPartieAdverse({ type: 'MORALE', lastName: 'Contact', firstName: 'Jean', company: 'Démo SARL',
    address: '10 rue Commerce', email: 'c@demo.fr', formeSociale: 'SARL', capital: 1000000,
    villeImmatriculation: 'Angers', numeroImmatriculation: '987 654 321' }, null);
  const pp = formatPartieAdverse({ type: 'PHYSIQUE', lastName: 'Dupont', firstName: 'Jean', address: '1 rue A', email: 'j@d.fr' }, null);

  describe('buildAdversaireSingulier', () => {
    it('adversaire PM → champs peuplés, est_morale === true (booléen)', () => {
      const a = buildAdversaireSingulier([pm]);
      expect(a.denomination).toBe('Démo SARL');
      expect(a.forme_sociale).toBe('SARL');
      expect(a.ville_immatriculation).toBe('Angers');
      expect(a.numero_immatriculation).toBe('987 654 321');
      expect(a.adresse_mail).toBe('c@demo.fr');
      expect(a.est_morale).toBe(true);
      expect(a.est_physique).toBe(false);
      expect(typeof a.est_morale).toBe('boolean'); // PAS une string
    });

    it('adversaire PP → denomination = nom complet, champs PM vides, est_morale === false', () => {
      const a = buildAdversaireSingulier([pp]);
      expect(a.denomination).toBe('Jean Dupont');
      expect(a.forme_sociale).toBe('');
      expect(a.capital).toBe('');
      expect(a.est_morale).toBe(false);
      expect(a.est_physique).toBe(true);
      expect(typeof a.est_morale).toBe('boolean');
    });

    it('ZÉRO adversaire → chaînes vides, booléens false, pas d’exception', () => {
      const a = buildAdversaireSingulier([]);
      const b = buildAdversaireSingulier(undefined);
      for (const x of [a, b]) {
        expect(x.denomination).toBe('');
        expect(x.est_morale).toBe(false);
        expect(x.est_physique).toBe(false);
      }
    });

    it('2+ adversaires → data.adversaire = le PREMIER', () => {
      const a = buildAdversaireSingulier([pm, pp]);
      expect(a.denomination).toBe('Démo SARL');
      expect(a.est_morale).toBe(true);
    });
  });

  describe('rendu Docxtemplater — le bloc conditionnel respecte le booléen', () => {
    const tpl = '{#adversaire_est_morale}SOCIETE {adversaire_denomination} au capital de {adversaire_capital}{/adversaire_est_morale}{#adversaire_est_physique}M/Mme {adversaire_denomination}{/adversaire_est_physique}';

    it('PM → bloc morale rendu (avec capital), bloc physique omis', () => {
      const out = render(makeDocx(tpl), flat('adversaire', buildAdversaireSingulier([pm])));
      expect(out).toContain('SOCIETE Démo SARL au capital de');
      expect(out).toMatch(/10\s000,00\s€/); // \s matche les espaces insécables (NNBSP/NBSP)
      expect(out).not.toContain('M/Mme');
    });

    it('PP → bloc morale OMIS (le piège du booléen), bloc physique rendu', () => {
      const out = render(makeDocx(tpl), flat('adversaire', buildAdversaireSingulier([pp])));
      expect(out).not.toContain('SOCIETE');       // {#adversaire_est_morale} ne doit PAS s’afficher
      expect(out).not.toContain('au capital de');
      expect(out).toContain('M/Mme Jean Dupont');
    });

    it('ZÉRO adversaire → aucun des deux blocs', () => {
      const out = render(makeDocx(tpl), flat('adversaire', buildAdversaireSingulier([])));
      expect(out).not.toContain('SOCIETE');
      expect(out).not.toContain('M/Mme');
    });
  });

  describe('booléens client (logique type → flags)', () => {
    const flags = (type) => ({ est_morale: type === 'COMPANY' || type === 'ASSOCIATION', est_physique: type === 'INDIVIDUAL' });
    it('COMPANY → morale', () => { expect(flags('COMPANY')).toEqual({ est_morale: true, est_physique: false }); });
    it('ASSOCIATION → morale', () => { expect(flags('ASSOCIATION')).toEqual({ est_morale: true, est_physique: false }); });
    it('INDIVIDUAL → physique', () => { expect(flags('INDIVIDUAL')).toEqual({ est_morale: false, est_physique: true }); });
  });
});
