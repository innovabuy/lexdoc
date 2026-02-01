import type { UserRole } from '@/lib/types';

export const APP_NAME = 'LexDoc';
export const APP_DESCRIPTION = 'Gestion documentaire pour cabinets d\'avocats';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  AVOCAT: 'Avocat',
  COLLABORATEUR: 'Collaborateur',
  SECRETAIRE: 'Secrétaire',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  AVOCAT: 'bg-blue-100 text-blue-700',
  COLLABORATEUR: 'bg-green-100 text-green-700',
  SECRETAIRE: 'bg-yellow-100 text-yellow-700',
};

export const STATUS_LABELS = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  TRIAL: 'Essai',
  CANCELED: 'Annulé',
};

export const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  TRIAL: 'bg-yellow-100 text-yellow-700',
  CANCELED: 'bg-gray-100 text-gray-700',
};

export const DOCUMENT_TYPES = {
  ACTE: 'Acte',
  CONTRAT: 'Contrat',
  COURRIER: 'Courrier',
  DECISION: 'Décision',
  PIECE: 'Pièce',
  TEMPLATE: 'Modèle',
  OTHER: 'Autre',
};

export const PAGINATION_LIMITS = [10, 25, 50, 100];

export const DEFAULT_PAGE_SIZE = 10;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const ACCEPTED_FILE_TYPES = {
  documents: ['.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt'],
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  spreadsheets: ['.xls', '.xlsx', '.csv'],
};
