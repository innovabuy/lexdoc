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

describe('template-engine loops (Docxtemplater)', () => {
  let baseTemplate;

  beforeAll(() => {
    baseTemplate = fs.readFileSync(
      path.join(__dirname, '../fixtures/template-loops-example.docx')
    );
  });

  it('omits the loop block when parties_adverses is empty', () => {
    const result = renderAndExtract(baseTemplate, {
      parties_adverses: [],
      document_date: '2026-05-18',
    });
    expect(result).not.toMatch(/Partie\s*:/);
    expect(result).toContain('2026-05-18');
    expect(result).toContain('Fin de la mise en demeure');
  });

  it('renders one occurrence per entry when parties_adverses has 2 entries', () => {
    const result = renderAndExtract(baseTemplate, {
      parties_adverses: [
        { nom: 'Dupont', prenom: 'Jean', adresse: '1 rue de Paris' },
        { nom: 'Martin', prenom: 'Paul', adresse: '2 avenue Hugo' },
      ],
      document_date: '2026-05-18',
    });
    expect(result).toContain('Dupont');
    expect(result).toContain('Jean');
    expect(result).toContain('1 rue de Paris');
    expect(result).toContain('Martin');
    expect(result).toContain('Paul');
    expect(result).toContain('2 avenue Hugo');
    const occurrences = (result.match(/Partie\s*:/g) || []).length;
    expect(occurrences).toBe(2);
  });

  it('handles a single entry without crashing', () => {
    const result = renderAndExtract(baseTemplate, {
      parties_adverses: [
        { nom: 'Solo', prenom: 'Han', adresse: '42 rue Falcon' },
      ],
      document_date: '2026-05-18',
    });
    expect(result).toContain('Solo');
    expect(result).toContain('Han');
    expect(result).toContain('42 rue Falcon');
    const occurrences = (result.match(/Partie\s*:/g) || []).length;
    expect(occurrences).toBe(1);
  });
});
