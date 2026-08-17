const fs = require('node:fs');
const path = require('node:path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} = require('docx');

function cleanFileName(value) {
  return String(value || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 90);
}

function infoTable(institution) {
  const rows = [
    ['Institución', institution.name || 'Instituto Emprende'],
    ['Tipo', institution.type || ''],
    ['Provincia', institution.province || ''],
    ['Cantón', institution.canton || ''],
    ['Dirección', institution.address || ''],
    ['Responsable', institution.responsible || ''],
    ['Financiamiento', institution.financing || ''],
    ['Área de influencia', institution.influence_area || ''],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [new Paragraph(String(value || ''))],
        }),
      ],
    })),
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'C7D2FE' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C7D2FE' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'C7D2FE' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'C7D2FE' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    },
  });
}

async function generateWord({ workspaceRoot, document, institution, sections, versionNo }) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: institution.name || 'Instituto Emprende', bold: true, size: 34 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 420 },
      children: [new TextRun({ text: document.name, bold: true, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
      children: [new TextRun({ text: `${document.code} · Versión ${versionNo}`, color: '475569', size: 20 })],
    }),
    infoTable(institution),
    new Paragraph({ text: '', spacing: { after: 240 } }),
  ];

  for (const section of sections) {
    children.push(new Paragraph({
      text: section.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 140 },
    }));

    const content = String(section.content || '').trim();
    if (!content) {
      children.push(new Paragraph({
        children: [new TextRun({ text: '[Pendiente de desarrollar]', italics: true, color: '64748B' })],
        spacing: { after: 180 },
      }));
      continue;
    }

    const paragraphs = content.split(/\n\s*\n/).filter(Boolean);
    for (const text of paragraphs) {
      children.push(new Paragraph({
        children: [new TextRun({ text: text.trim(), size: 22 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 160 },
      }));
    }
  }

  children.push(new Paragraph({
    spacing: { before: 480 },
    children: [new TextRun({
      text: 'Documento generado por Emprende. Requiere revisión humana antes de su presentación oficial.',
      italics: true,
      color: '64748B',
      size: 18,
    })],
  }));

  const doc = new Document({
    creator: 'Emprende',
    title: document.name,
    description: `Documento de trabajo del ${institution.name || 'Instituto Emprende'}`,
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
          paragraph: { spacing: { line: 360 } },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, color: '0F172A', font: 'Arial' },
          paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 0 },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        },
      },
      children,
    }],
  });

  const folder = path.join(workspaceRoot, 'borradores', document.code);
  fs.mkdirSync(folder, { recursive: true });
  const fileName = `${cleanFileName(document.name)}_v${String(versionNo).padStart(2, '0')}.docx`;
  const filePath = path.join(folder, fileName);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { generateWord, cleanFileName };
