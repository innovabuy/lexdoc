import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { TemplateVariable, VariableType } from './templates.schemas';

// Use InspectModule to extract variables
const InspectModule = require('docxtemplater/js/inspect-module');

export class TemplateParserService {
  /**
   * Extract variables from a DOCX template buffer
   */
  extractVariables(buffer: Buffer): TemplateVariable[] {
    const zip = new PizZip(buffer);
    const inspectModule = new InspectModule();

    // Create docxtemplater instance with inspect module
    new Docxtemplater(zip, {
      modules: [inspectModule],
      paragraphLoop: true,
      linebreaks: true,
    });

    // Get all tags (variables) from the template
    const tags = inspectModule.getAllTags();
    const variableNames = this.flattenTags(tags);

    // Convert to TemplateVariable objects with inferred types
    return variableNames.map((name) => ({
      name,
      type: this.inferVariableType(name),
      label: this.generateLabel(name),
      required: true,
    }));
  }

  /**
   * Flatten nested tags object into array of variable names
   */
  private flattenTags(tags: Record<string, unknown>, prefix = ''): string[] {
    const result: string[] = [];

    for (const [key, value] of Object.entries(tags)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Nested object - recurse
        result.push(...this.flattenTags(value as Record<string, unknown>, fullKey));
      } else {
        result.push(fullKey);
      }
    }

    return result;
  }

  /**
   * Infer variable type from naming convention
   */
  private inferVariableType(name: string): VariableType {
    const lowerName = name.toLowerCase();

    // Date patterns
    if (lowerName.startsWith('date_') || lowerName.endsWith('_date') || lowerName === 'date') {
      return 'date';
    }

    // Currency patterns
    if (
      lowerName.startsWith('montant_') ||
      lowerName.endsWith('_montant') ||
      lowerName.startsWith('prix_') ||
      lowerName.endsWith('_prix') ||
      lowerName.startsWith('somme_') ||
      lowerName.endsWith('_somme') ||
      lowerName === 'montant' ||
      lowerName === 'prix'
    ) {
      return 'currency';
    }

    // Boolean patterns
    if (
      lowerName.startsWith('is_') ||
      lowerName.startsWith('has_') ||
      lowerName.startsWith('est_') ||
      lowerName.startsWith('a_')
    ) {
      return 'boolean';
    }

    // Email patterns
    if (lowerName.startsWith('email_') || lowerName.endsWith('_email') || lowerName === 'email') {
      return 'email';
    }

    // Phone patterns
    if (
      lowerName.startsWith('tel_') ||
      lowerName.endsWith('_tel') ||
      lowerName.startsWith('telephone_') ||
      lowerName.endsWith('_telephone') ||
      lowerName === 'tel' ||
      lowerName === 'telephone'
    ) {
      return 'phone';
    }

    // Number patterns
    if (
      lowerName.startsWith('nombre_') ||
      lowerName.endsWith('_nombre') ||
      lowerName.startsWith('nb_') ||
      lowerName.endsWith('_nb') ||
      lowerName.startsWith('numero_') ||
      lowerName.endsWith('_numero') ||
      lowerName === 'nombre' ||
      lowerName === 'numero'
    ) {
      return 'number';
    }

    // Default to text
    return 'text';
  }

  /**
   * Generate a human-readable label from variable name
   */
  private generateLabel(name: string): string {
    // Handle nested properties (e.g., "client.nom" -> "Client Nom")
    const parts = name.split('.');

    return parts
      .map((part) => {
        // Replace underscores with spaces
        return part
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      })
      .join(' - ');
  }

  /**
   * Validate that a template is a valid DOCX file
   */
  validateTemplate(buffer: Buffer): { valid: boolean; error?: string } {
    try {
      const zip = new PizZip(buffer);
      new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid DOCX template',
      };
    }
  }
}

export const templateParserService = new TemplateParserService();
