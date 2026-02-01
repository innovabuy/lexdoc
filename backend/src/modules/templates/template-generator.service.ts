import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { TemplateVariable } from './templates.schemas';

export class TemplateGeneratorService {
  /**
   * Generate a document from a template buffer and data
   */
  generateDocument(
    templateBuffer: Buffer,
    data: Record<string, unknown>,
    variables: TemplateVariable[]
  ): Buffer {
    // Format data according to variable types
    const formattedData = this.formatData(data, variables);

    // Load template
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '', // Replace undefined/null with empty string
    });

    // Render the document with formatted data
    doc.render(formattedData);

    // Generate output buffer
    const output = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return output;
  }

  /**
   * Format data according to variable types
   */
  private formatData(
    data: Record<string, unknown>,
    variables: TemplateVariable[]
  ): Record<string, unknown> {
    const formatted: Record<string, unknown> = {};
    const variableMap = new Map(variables.map((v) => [v.name, v]));

    for (const [key, value] of Object.entries(data)) {
      const variable = variableMap.get(key);

      if (!variable) {
        // Pass through unknown variables as-is
        formatted[key] = value;
        continue;
      }

      formatted[key] = this.formatValue(value, variable.type);
    }

    return formatted;
  }

  /**
   * Format a single value according to its type
   */
  private formatValue(value: unknown, type: string): unknown {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    switch (type) {
      case 'date':
        return this.formatDate(value);
      case 'currency':
        return this.formatCurrency(value);
      case 'boolean':
        return this.formatBoolean(value);
      case 'phone':
        return this.formatPhone(value);
      case 'number':
        return this.formatNumber(value);
      case 'email':
        return String(value).toLowerCase();
      default:
        return String(value);
    }
  }

  /**
   * Format date in French locale: "1 janvier 2024"
   */
  private formatDate(value: unknown): string {
    try {
      const date = value instanceof Date ? value : new Date(String(value));

      if (isNaN(date.getTime())) {
        return String(value);
      }

      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return String(value);
    }
  }

  /**
   * Format currency in EUR: "1 234,56 EUR"
   */
  private formatCurrency(value: unknown): string {
    try {
      const num = typeof value === 'number' ? value : parseFloat(String(value));

      if (isNaN(num)) {
        return String(value);
      }

      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(num);
    } catch {
      return String(value);
    }
  }

  /**
   * Format boolean as "Oui" / "Non"
   */
  private formatBoolean(value: unknown): string {
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }

    const strValue = String(value).toLowerCase();
    if (strValue === 'true' || strValue === 'oui' || strValue === '1') {
      return 'Oui';
    }
    return 'Non';
  }

  /**
   * Format phone number in French format: "06 12 34 56 78"
   */
  private formatPhone(value: unknown): string {
    const phone = String(value).replace(/\D/g, '');

    // French phone number (10 digits)
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    // French phone with country code (+33)
    if (phone.length === 11 && phone.startsWith('33')) {
      const national = '0' + phone.slice(2);
      return national.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    // Return as-is if format not recognized
    return String(value);
  }

  /**
   * Format number with French locale: "1 234,56"
   */
  private formatNumber(value: unknown): string {
    try {
      const num = typeof value === 'number' ? value : parseFloat(String(value));

      if (isNaN(num)) {
        return String(value);
      }

      return new Intl.NumberFormat('fr-FR').format(num);
    } catch {
      return String(value);
    }
  }

  /**
   * Generate sample data for preview based on variable types
   */
  generateSampleData(variables: TemplateVariable[]): Record<string, unknown> {
    const sampleData: Record<string, unknown> = {};

    for (const variable of variables) {
      sampleData[variable.name] = this.getSampleValue(variable);
    }

    return sampleData;
  }

  /**
   * Get a sample value for a variable type
   */
  private getSampleValue(variable: TemplateVariable): unknown {
    switch (variable.type) {
      case 'date':
        return new Date().toISOString();
      case 'currency':
        return 1234.56;
      case 'boolean':
        return true;
      case 'email':
        return 'exemple@email.fr';
      case 'phone':
        return '0612345678';
      case 'number':
        return 42;
      default:
        return `[${variable.label}]`;
    }
  }
}

export const templateGeneratorService = new TemplateGeneratorService();
