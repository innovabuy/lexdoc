export type TemplateCategory = 'CONTRAT' | 'ACTE' | 'COURRIER' | 'PROCEDURE' | 'OTHER';

export type VariableType = 'text' | 'date' | 'currency' | 'boolean' | 'email' | 'phone' | 'number';

export interface TemplateVariable {
  name: string;
  type: VariableType;
  label: string;
  required: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  filename: string;
  variables: TemplateVariable[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  filename: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFilters {
  search?: string;
  category?: TemplateCategory;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: TemplateCategory;
  file: File;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string | null;
  category?: TemplateCategory;
}

export interface GenerateDocumentInput {
  documentTitle: string;
  folderId?: string;
  data: Record<string, unknown>;
}

export interface GeneratedDocument {
  id: string;
  filename: string;
  title: string;
  createdAt: string;
}

export interface CategoryOption {
  value: TemplateCategory;
  label: string;
}
