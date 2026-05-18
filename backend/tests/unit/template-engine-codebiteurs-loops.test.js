const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

function renderAndExtract(templateBuffer, data) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(data);
  const renderedBuffer = doc.getZip().generate({ type: 'nodebuffer' });
  const renderedZip = new PizZip(renderedBuffer);
  const xml = renderedZip.file('word/document.xml').asText();
  return xml.replace(/<[^>]+>/g, '').trim();
}

describe('template-engine co_debiteurs loops', () => {
  let baseTemplate;

  beforeAll(() => {
    baseTemplate = fs.readFileSync(
      path.join(__dirname, '../fixtures/template-co-debiteurs-example.docx')
    );
  });

  it('omits the loop block when co_debiteurs is empty', () => {
    const result = renderAndExtract(baseTemplate, {
      co_debiteurs: [],
      document_date: '2026-05-18',
    });
    expect(result).not.toMatch(/Co-débiteur\s*:/);
    expect(result).toContain('2026-05-18');
    expect(result).toContain('Fin de la mise en demeure');
  });

  it('renders one occurrence per entry when co_debiteurs has 3 entries', () => {
    const result = renderAndExtract(baseTemplate, {
      co_debiteurs: [
        { nom: 'Dupont', prenom: 'Jean', adresse: '1 rue de Paris', code_postal: '49000', ville: 'Angers' },
        { nom: 'Martin', prenom: 'Paul', adresse: '2 avenue Hugo', code_postal: '44000', ville: 'Nantes' },
        { nom: 'Durand', prenom: 'Marie', adresse: '3 bd République', code_postal: '49100', ville: 'Avrillé' },
      ],
      document_date: '2026-05-18',
    });
    expect(result).toContain('Dupont');
    expect(result).toContain('Martin');
    expect(result).toContain('Durand');
    expect(result).toContain('Angers');
    expect(result).toContain('Nantes');
    expect(result).toContain('Avrillé');
    const occurrences = (result.match(/Co-débiteur\s*:/g) || []).length;
    expect(occurrences).toBe(3);
  });

  it('handles single entry without crashing', () => {
    const result = renderAndExtract(baseTemplate, {
      co_debiteurs: [
        { nom: 'Solo', prenom: 'Han', adresse: '42 rue Falcon', code_postal: '49000', ville: 'Angers' },
      ],
      document_date: '2026-05-18',
    });
    expect(result).toContain('Solo');
    expect(result).toContain('Han');
    expect(result).toContain('49000');
    const occurrences = (result.match(/Co-débiteur\s*:/g) || []).length;
    expect(occurrences).toBe(1);
  });
});
