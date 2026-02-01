import Handlebars from 'handlebars';

// Number to French words converter (simplified for legal documents)
const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
const exceptions = {
  11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze', 15: 'quinze',
  16: 'seize', 17: 'dix-sept', 18: 'dix-huit', 19: 'dix-neuf',
  71: 'soixante-et-onze', 72: 'soixante-douze', 73: 'soixante-treize',
  74: 'soixante-quatorze', 75: 'soixante-quinze', 76: 'soixante-seize',
  77: 'soixante-dix-sept', 78: 'soixante-dix-huit', 79: 'soixante-dix-neuf',
  91: 'quatre-vingt-onze', 92: 'quatre-vingt-douze', 93: 'quatre-vingt-treize',
  94: 'quatre-vingt-quatorze', 95: 'quatre-vingt-quinze', 96: 'quatre-vingt-seize',
  97: 'quatre-vingt-dix-sept', 98: 'quatre-vingt-dix-huit', 99: 'quatre-vingt-dix-neuf',
};

function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + numberToFrenchWords(-n);

  if (n < 10) return unites[n];
  if (n < 100) {
    if (exceptions[n as keyof typeof exceptions]) return exceptions[n as keyof typeof exceptions];
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return dizaines[d] + (d === 8 ? 's' : '');
    if (u === 1 && d !== 8 && d !== 9) return dizaines[d] + '-et-un';
    return dizaines[d] + '-' + unites[u];
  }
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const r = n % 100;
    const prefix = c === 1 ? 'cent' : unites[c] + ' cent';
    if (r === 0) return prefix + (c > 1 ? 's' : '');
    return prefix + ' ' + numberToFrenchWords(r);
  }
  if (n < 1000000) {
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    const prefix = m === 1 ? 'mille' : numberToFrenchWords(m) + ' mille';
    if (r === 0) return prefix;
    return prefix + ' ' + numberToFrenchWords(r);
  }
  if (n < 1000000000) {
    const m = Math.floor(n / 1000000);
    const r = n % 1000000;
    const prefix = numberToFrenchWords(m) + ' million' + (m > 1 ? 's' : '');
    if (r === 0) return prefix;
    return prefix + ' ' + numberToFrenchWords(r);
  }
  return n.toString();
}

// Format amount in words (euros and cents)
function montantEnLettres(montant: number): string {
  const euros = Math.floor(montant);
  const centimes = Math.round((montant - euros) * 100);

  let result = numberToFrenchWords(euros) + ' euro' + (euros > 1 ? 's' : '');
  if (centimes > 0) {
    result += ' et ' + numberToFrenchWords(centimes) + ' centime' + (centimes > 1 ? 's' : '');
  }
  return result;
}

// Date formatting
function formatDate(date: Date | string, format: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    case 'DD MMMM YYYY':
      return `${day} ${months[month]} ${year}`;
    case 'D MMMM YYYY':
      return `${day} ${months[month]} ${year}`;
    case 'MMMM YYYY':
      return `${months[month]} ${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    default:
      return `${day}/${(month + 1).toString().padStart(2, '0')}/${year}`;
  }
}

// Register custom Handlebars helpers
export function registerHelpers(): void {
  // Date formatting helper
  Handlebars.registerHelper('date_format', function(date: Date | string, format: string) {
    if (!date) return '';
    return formatDate(date, typeof format === 'string' ? format : 'DD/MM/YYYY');
  });

  // Amount in words helper
  Handlebars.registerHelper('montant_lettres', function(montant: number) {
    if (typeof montant !== 'number' || isNaN(montant)) return '';
    return montantEnLettres(montant);
  });

  // Number formatting helper (French locale)
  Handlebars.registerHelper('number_format', function(value: number, decimals?: number) {
    if (typeof value !== 'number' || isNaN(value)) return '';
    const dec = typeof decimals === 'number' ? decimals : 2;
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  });

  // Currency formatting helper
  Handlebars.registerHelper('currency', function(value: number) {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  });

  // Addition helper
  Handlebars.registerHelper('add', function(a: number, b: number) {
    return (Number(a) || 0) + (Number(b) || 0);
  });

  // Subtraction helper
  Handlebars.registerHelper('subtract', function(a: number, b: number) {
    return (Number(a) || 0) - (Number(b) || 0);
  });

  // Multiplication helper
  Handlebars.registerHelper('multiply', function(a: number, b: number) {
    return (Number(a) || 0) * (Number(b) || 0);
  });

  // Division helper
  Handlebars.registerHelper('divide', function(a: number, b: number) {
    if (b === 0) return 0;
    return (Number(a) || 0) / (Number(b) || 1);
  });

  // Uppercase helper
  Handlebars.registerHelper('uppercase', function(str: string) {
    return typeof str === 'string' ? str.toUpperCase() : '';
  });

  // Lowercase helper
  Handlebars.registerHelper('lowercase', function(str: string) {
    return typeof str === 'string' ? str.toLowerCase() : '';
  });

  // Capitalize first letter helper
  Handlebars.registerHelper('capitalize', function(str: string) {
    if (typeof str !== 'string' || !str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });

  // Equality check helper
  Handlebars.registerHelper('eq', function(a: unknown, b: unknown) {
    return a === b;
  });

  // Not equal helper
  Handlebars.registerHelper('ne', function(a: unknown, b: unknown) {
    return a !== b;
  });

  // Greater than helper
  Handlebars.registerHelper('gt', function(a: number, b: number) {
    return Number(a) > Number(b);
  });

  // Less than helper
  Handlebars.registerHelper('lt', function(a: number, b: number) {
    return Number(a) < Number(b);
  });

  // Greater than or equal helper
  Handlebars.registerHelper('gte', function(a: number, b: number) {
    return Number(a) >= Number(b);
  });

  // Less than or equal helper
  Handlebars.registerHelper('lte', function(a: number, b: number) {
    return Number(a) <= Number(b);
  });

  // And helper
  Handlebars.registerHelper('and', function(...args: unknown[]) {
    // Remove the options object from the end
    const values = args.slice(0, -1);
    return values.every(Boolean);
  });

  // Or helper
  Handlebars.registerHelper('or', function(...args: unknown[]) {
    const values = args.slice(0, -1);
    return values.some(Boolean);
  });

  // Not helper
  Handlebars.registerHelper('not', function(value: unknown) {
    return !value;
  });

  // Default value helper
  Handlebars.registerHelper('default', function(value: unknown, defaultValue: unknown) {
    return value || defaultValue;
  });

  // Truncate text helper
  Handlebars.registerHelper('truncate', function(str: string, length: number) {
    if (typeof str !== 'string') return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  });

  // Replace helper
  Handlebars.registerHelper('replace', function(str: string, search: string, replace: string) {
    if (typeof str !== 'string') return '';
    return str.replace(new RegExp(search, 'g'), replace);
  });

  // Join array helper
  Handlebars.registerHelper('join', function(arr: unknown[], separator: string) {
    if (!Array.isArray(arr)) return '';
    return arr.join(typeof separator === 'string' ? separator : ', ');
  });

  // Current date helper
  Handlebars.registerHelper('date_jour', function() {
    return formatDate(new Date(), 'DD/MM/YYYY');
  });

  // Current date (long format) helper
  Handlebars.registerHelper('date_jour_long', function() {
    return formatDate(new Date(), 'DD MMMM YYYY');
  });

  // Index helper for loops (1-based)
  Handlebars.registerHelper('inc', function(value: number) {
    return Number(value) + 1;
  });

  // Pluralize helper
  Handlebars.registerHelper('pluralize', function(count: number, singular: string, plural: string) {
    return count === 1 ? singular : (plural || singular + 's');
  });
}

// Initialize helpers on module load
registerHelpers();

/**
 * Compile a Handlebars template string
 */
export function compileTemplate(template: string): HandlebarsTemplateDelegate {
  return Handlebars.compile(template, {
    noEscape: false, // HTML escape by default
    strict: false,   // Don't throw on missing variables
  });
}

/**
 * Render a template with data
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  try {
    const compiled = compileTemplate(template);
    return compiled(data);
  } catch (error) {
    throw new Error(`Template rendering error: ${(error as Error).message}`);
  }
}

/**
 * Validate template syntax
 */
export function validateTemplateSyntax(template: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    Handlebars.precompile(template);
  } catch (error) {
    errors.push((error as Error).message);
  }

  // Check for balanced braces
  const openBraces = (template.match(/\{\{/g) || []).length;
  const closeBraces = (template.match(/\}\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opens, ${closeBraces} closes`);
  }

  // Check for unclosed block helpers
  const blockOpens = (template.match(/\{\{#\w+/g) || []);
  const blockCloses = (template.match(/\{\{\/\w+/g) || []);

  const openCounts: Record<string, number> = {};
  for (const match of blockOpens) {
    const name = match.replace('{{#', '');
    openCounts[name] = (openCounts[name] || 0) + 1;
  }

  for (const match of blockCloses) {
    const name = match.replace('{{/', '');
    openCounts[name] = (openCounts[name] || 0) - 1;
  }

  for (const [name, count] of Object.entries(openCounts)) {
    if (count > 0) {
      errors.push(`Unclosed {{#${name}}} block: ${count} opens, 0 closes`);
    } else if (count < 0) {
      errors.push(`Extra {{/${name}}} without matching open`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract variable names from a template
 */
export function extractVariables(template: string): string[] {
  const variableSet = new Set<string>();

  // Match simple variables {{variable}} and {{object.property}}
  const simpleMatches = template.match(/\{\{[^#/!>][^}]*\}\}/g) || [];
  for (const match of simpleMatches) {
    const content = match.replace(/\{\{|\}\}/g, '').trim();
    // Skip helpers with arguments
    if (!content.includes(' ')) {
      variableSet.add(content.split('.')[0]);
    }
  }

  // Match block helper contexts {{#each items}}
  const eachMatches = template.match(/\{\{#each\s+(\w+)/g) || [];
  for (const match of eachMatches) {
    const varName = match.replace(/\{\{#each\s+/, '');
    variableSet.add(varName);
  }

  // Match if conditions {{#if condition}}
  const ifMatches = template.match(/\{\{#if\s+(\w+)/g) || [];
  for (const match of ifMatches) {
    const varName = match.replace(/\{\{#if\s+/, '');
    variableSet.add(varName);
  }

  return Array.from(variableSet);
}

export { Handlebars };
