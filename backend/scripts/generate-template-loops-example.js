const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('Mise en demeure — Co-débiteurs')],
      }),
      new Paragraph({
        children: [new TextRun('Document daté du {document_date}.')],
      }),
      new Paragraph({
        children: [new TextRun('Liste des co-débiteurs :')],
      }),
      new Paragraph({
        children: [new TextRun('{#parties_adverses}')],
      }),
      new Paragraph({
        children: [new TextRun('Partie : {prenom} {nom}, demeurant {adresse}.')],
      }),
      new Paragraph({
        children: [new TextRun('{/parties_adverses}')],
      }),
      new Paragraph({
        children: [new TextRun('Fin de la mise en demeure.')],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, '../tests/fixtures/template-loops-example.docx');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log('Generated:', outPath, '(', buffer.length, 'bytes)');
});
