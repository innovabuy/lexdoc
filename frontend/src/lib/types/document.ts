export type DocumentType =
  | 'ACTE'
  | 'CONTRAT'
  | 'COURRIER'
  | 'DECISION'
  | 'PIECE'
  | 'TEMPLATE'
  | 'OTHER';

export interface Document {
  id: string;
  title: string;
  name: string;
  description: string | null;
  type: DocumentType;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  version: number;
  isLatestVersion: boolean;
  folderId: string | null;
  cabinetId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  folder?: {
    id: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface DocumentVersion {
  id: string;
  version: number;
  filename: string;
  size: number;
  createdAt: string;
  isCurrent?: boolean;
}

export interface CreateDocumentInput {
  name: string;
  description?: string;
  type?: DocumentType;
  folderId: string;
}

export interface UpdateDocumentInput {
  name?: string;
  description?: string | null;
  type?: DocumentType;
}

export interface DocumentFilters {
  folderId?: string;
  type?: DocumentType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentSearchFilters {
  query?: string;
  type?: DocumentType[];
  folderId?: string;
  createdById?: string;
  dateFrom?: string;
  dateTo?: string;
  minSize?: number;
  maxSize?: number;
  page?: number;
  limit?: number;
}

export interface BulkMoveInput {
  documentIds: string[];
  folderId: string;
}

export interface BulkDeleteInput {
  documentIds: string[];
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}
