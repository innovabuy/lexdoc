const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('Mise en demeure — Co-débiteurs solidaires')],
      }),
      new Paragraph({
        children: [new TextRun('Document daté du {document_date}.')],
      }),
      new Paragraph({
        children: [new TextRun('Sont mis en demeure solidairement :')],
      }),
      new Paragraph({
        children: [new TextRun('{#co_debiteurs}')],
      }),
      new Paragraph({
        children: [new TextRun('Co-débiteur : {prenom} {nom}, demeurant {adresse}, {code_postal} {ville}.')],
      }),
      new Paragraph({
        children: [new TextRun('{/co_debiteurs}')],
      }),
      new Paragraph({
        children: [new TextRun('Fin de la mise en demeure.')],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, '../tests/fixtures/template-co-debiteurs-example.docx');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log('Generated:', outPath, '(', buffer.length, 'bytes)');
});
