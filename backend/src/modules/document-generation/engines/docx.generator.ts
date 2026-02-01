import {
  Document,
  Paragraph,
  TextRun,
  Header,
  Footer,
  PageBreak,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  TableCell,
  TableRow,
  Table,
  WidthType,
  convertInchesToTwip,
  PageNumber,
  NumberFormat,
} from 'docx';
import { renderTemplate } from './handlebars.engine';

// Document style configuration
export interface DocumentStyle {
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

// Block content with optional styling
export interface BlockContent {
  content: string;
  title?: string;
  category?: string;
  isOptional?: boolean;
}

// Legal mentions configuration
export interface LegalMentionsConfig {
  header?: string;
  footer?: string;
  signature?: string;
  signatureImage?: Buffer;
  cachetImage?: Buffer;
}

// Default styles
const DEFAULT_STYLE: DocumentStyle = {
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineSpacing: 1.15,
  marginTop: 1,
  marginBottom: 1,
  marginLeft: 1,
  marginRight: 1,
};

/**
 * Parse HTML-like content into DOCX paragraphs
 * Supports basic formatting: <strong>, <em>, <u>, <br>, <p>
 */
function parseContentToParagraphs(
  content: string,
  style: DocumentStyle = DEFAULT_STYLE
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Split content by paragraphs (double newlines or <p> tags)
  const parts = content
    .replace(/<p>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/\n\n+/);

  for (const part of parts) {
    if (!part.trim()) continue;

    const textRuns = parseTextRuns(part.trim(), style);
    if (textRuns.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: {
            after: 200,
            line: Math.round((style.lineSpacing || 1.15) * 240),
          },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Parse text into TextRun objects with formatting
 */
function parseTextRuns(text: string, style: DocumentStyle): TextRun[] {
  const runs: TextRun[] = [];
  let currentText = text;

  // Process line breaks
  const lines = currentText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse formatting tags
    const segments = parseFormattingTags(line);

    for (const segment of segments) {
      runs.push(
        new TextRun({
          text: segment.text,
          font: style.fontFamily || 'Times New Roman',
          size: (style.fontSize || 12) * 2, // Size in half-points
          bold: segment.bold,
          italics: segment.italic,
          underline: segment.underline ? {} : undefined,
        })
      );
    }

    // Add line break between lines (except last)
    if (i < lines.length - 1) {
      runs.push(new TextRun({ break: 1 }));
    }
  }

  return runs;
}

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/**
 * Parse HTML-like formatting tags
 */
function parseFormattingTags(text: string): TextSegment[] {
  const segments: TextSegment[] = [];

  // Simple regex-based parsing for basic tags
  let remaining = text;
  let currentSegment: TextSegment = { text: '' };

  // Replace HTML entities
  remaining = remaining
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // Process tags
  const tagRegex = /<(\/?)(strong|b|em|i|u)>/gi;
  let lastIndex = 0;
  let match;

  const activeFormats = {
    bold: false,
    italic: false,
    underline: false,
  };

  while ((match = tagRegex.exec(remaining)) !== null) {
    // Add text before the tag
    if (match.index > lastIndex) {
      const textBefore = remaining.substring(lastIndex, match.index);
      if (textBefore) {
        segments.push({
          text: textBefore,
          bold: activeFormats.bold,
          italic: activeFormats.italic,
          underline: activeFormats.underline,
        });
      }
    }

    // Process the tag
    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();

    if (tagName === 'strong' || tagName === 'b') {
      activeFormats.bold = !isClosing;
    } else if (tagName === 'em' || tagName === 'i') {
      activeFormats.italic = !isClosing;
    } else if (tagName === 'u') {
      activeFormats.underline = !isClosing;
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    segments.push({
      text: remaining.substring(lastIndex),
      bold: activeFormats.bold,
      italic: activeFormats.italic,
      underline: activeFormats.underline,
    });
  }

  // If no segments were created, return the entire text
  if (segments.length === 0) {
    segments.push({ text: remaining });
  }

  return segments.filter((s) => s.text);
}

/**
 * Create a header with legal mentions
 */
function createHeader(content: string, style: DocumentStyle): Header {
  const paragraphs = parseContentToParagraphs(content, {
    ...style,
    fontSize: 10,
  });

  return new Header({
    children: paragraphs,
  });
}

/**
 * Create a footer with legal mentions and page numbers
 */
function createFooter(content: string, style: DocumentStyle): Footer {
  const paragraphs = parseContentToParagraphs(content, {
    ...style,
    fontSize: 10,
  });

  // Add page number
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          children: ['Page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
          font: style.fontFamily || 'Times New Roman',
          size: 18, // 9pt
        }),
      ],
    })
  );

  return new Footer({
    children: paragraphs,
  });
}

/**
 * Create signature block with optional image
 */
function createSignatureBlock(
  content: string,
  signatureImage?: Buffer,
  cachetImage?: Buffer,
  style: DocumentStyle = DEFAULT_STYLE
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Add spacing before signature
  paragraphs.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [],
    })
  );

  // Add signature content
  const signatureParas = parseContentToParagraphs(content, style);
  paragraphs.push(...signatureParas);

  // Add signature image if provided
  if (signatureImage) {
    try {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              data: signatureImage,
              transformation: {
                width: 150,
                height: 75,
              },
              type: 'png',
            }),
          ],
        })
      );
    } catch {
      // Skip image if it fails to load
    }
  }

  // Add cachet image if provided
  if (cachetImage) {
    try {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              data: cachetImage,
              transformation: {
                width: 100,
                height: 100,
              },
              type: 'png',
            }),
          ],
        })
      );
    } catch {
      // Skip image if it fails to load
    }
  }

  return paragraphs;
}

/**
 * Generate DOCX document from assembled content
 */
export async function generateDocx(
  blocks: BlockContent[],
  variables: Record<string, unknown>,
  legalMentions?: LegalMentionsConfig,
  style: DocumentStyle = DEFAULT_STYLE
): Promise<Buffer> {
  const allParagraphs: Paragraph[] = [];

  // Process each block
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Render template with variables
    let renderedContent: string;
    try {
      renderedContent = renderTemplate(block.content, variables);
    } catch (error) {
      renderedContent = `[Error rendering block: ${block.title || 'Unknown'}]`;
    }

    // Add block title if present (for debugging/structure)
    if (block.title && block.category) {
      // Optionally add a subtle marker for block sections
      // allParagraphs.push(new Paragraph({ children: [new TextRun({ text: `— ${block.title} —`, size: 18, color: '888888' })] }));
    }

    // Parse content into paragraphs
    const blockParagraphs = parseContentToParagraphs(renderedContent, style);
    allParagraphs.push(...blockParagraphs);

    // Add spacing between blocks (except last)
    if (i < blocks.length - 1) {
      allParagraphs.push(
        new Paragraph({
          spacing: { after: 300 },
          children: [],
        })
      );
    }
  }

  // Add signature block if provided
  if (legalMentions?.signature) {
    const renderedSignature = renderTemplate(legalMentions.signature, variables);
    const signatureParas = createSignatureBlock(
      renderedSignature,
      legalMentions.signatureImage,
      legalMentions.cachetImage,
      style
    );
    allParagraphs.push(...signatureParas);
  }

  // Create document with headers/footers
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: style.fontFamily || 'Times New Roman',
            size: (style.fontSize || 12) * 2,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(style.marginTop || 1),
              bottom: convertInchesToTwip(style.marginBottom || 1),
              left: convertInchesToTwip(style.marginLeft || 1),
              right: convertInchesToTwip(style.marginRight || 1),
            },
          },
        },
        headers: legalMentions?.header
          ? {
              default: createHeader(
                renderTemplate(legalMentions.header, variables),
                style
              ),
            }
          : undefined,
        footers: legalMentions?.footer
          ? {
              default: createFooter(
                renderTemplate(legalMentions.footer, variables),
                style
              ),
            }
          : undefined,
        children: allParagraphs,
      },
    ],
  });

  // Generate buffer
  const { Packer } = await import('docx');
  return await Packer.toBuffer(doc);
}

/**
 * Generate a simple text preview (for HTML display)
 */
export function generateTextPreview(
  blocks: BlockContent[],
  variables: Record<string, unknown>,
  legalMentions?: LegalMentionsConfig
): string {
  const parts: string[] = [];

  // Render each block
  for (const block of blocks) {
    try {
      const rendered = renderTemplate(block.content, variables);
      parts.push(rendered);
    } catch (error) {
      parts.push(`[Error rendering block: ${block.title || 'Unknown'}]`);
    }
  }

  // Add signature if present
  if (legalMentions?.signature) {
    try {
      const rendered = renderTemplate(legalMentions.signature, variables);
      parts.push('\n---\n' + rendered);
    } catch {
      // Skip on error
    }
  }

  return parts.join('\n\n');
}

/**
 * Generate HTML preview with styling
 */
export function generateHtmlPreview(
  blocks: BlockContent[],
  variables: Record<string, unknown>,
  legalMentions?: LegalMentionsConfig
): string {
  const bodyParts: string[] = [];

  // Header
  if (legalMentions?.header) {
    try {
      const rendered = renderTemplate(legalMentions.header, variables);
      bodyParts.push(`<header class="document-header">${rendered}</header>`);
    } catch {
      // Skip on error
    }
  }

  // Main content
  bodyParts.push('<main class="document-content">');
  for (const block of blocks) {
    try {
      const rendered = renderTemplate(block.content, variables);
      bodyParts.push(`<section class="document-block">${rendered}</section>`);
    } catch (error) {
      bodyParts.push(`<section class="document-block error">[Error rendering: ${block.title}]</section>`);
    }
  }
  bodyParts.push('</main>');

  // Signature
  if (legalMentions?.signature) {
    try {
      const rendered = renderTemplate(legalMentions.signature, variables);
      bodyParts.push(`<aside class="document-signature">${rendered}</aside>`);
    } catch {
      // Skip on error
    }
  }

  // Footer
  if (legalMentions?.footer) {
    try {
      const rendered = renderTemplate(legalMentions.footer, variables);
      bodyParts.push(`<footer class="document-footer">${rendered}</footer>`);
    } catch {
      // Skip on error
    }
  }

  // Wrap in styled HTML
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #333;
      max-width: 800px;
      margin: 20px auto;
      padding: 40px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .document-header {
      border-bottom: 1px solid #ddd;
      padding-bottom: 20px;
      margin-bottom: 30px;
      font-size: 10pt;
      color: #666;
    }
    .document-content {
      min-height: 400px;
    }
    .document-block {
      margin-bottom: 20px;
    }
    .document-block.error {
      color: red;
      font-style: italic;
    }
    .document-signature {
      margin-top: 50px;
      text-align: right;
    }
    .document-footer {
      border-top: 1px solid #ddd;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 10pt;
      color: #666;
      text-align: center;
    }
    strong, b { font-weight: bold; }
    em, i { font-style: italic; }
    u { text-decoration: underline; }
  </style>
</head>
<body>
  ${bodyParts.join('\n')}
</body>
</html>
  `.trim();
}
