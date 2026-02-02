export type FolderType =
  | 'AFFAIRE_GENERALE'
  | 'CESSION_ENTREPRISE'
  | 'CONTENTIEUX_CIVIL'
  | 'CONTENTIEUX_COMMERCIAL'
  | 'CONTENTIEUX_PRUDHOMMES'
  | 'IMMOBILIER_LOCATIF'
  | 'IMMOBILIER_VENTE'
  | 'DROIT_FAMILLE'
  | 'DROIT_SOCIETES'
  | 'AUTRE';

export const FOLDER_TYPE_LABELS: Record<FolderType, string> = {
  AFFAIRE_GENERALE: 'Affaire generale',
  CESSION_ENTREPRISE: 'Cession d\'entreprise',
  CONTENTIEUX_CIVIL: 'Contentieux civil',
  CONTENTIEUX_COMMERCIAL: 'Contentieux commercial',
  CONTENTIEUX_PRUDHOMMES: 'Contentieux prud\'hommes',
  IMMOBILIER_LOCATIF: 'Immobilier locatif',
  IMMOBILIER_VENTE: 'Immobilier vente',
  DROIT_FAMILLE: 'Droit de la famille',
  DROIT_SOCIETES: 'Droit des societes',
  AUTRE: 'Autre',
};

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  cabinetId: string;
  folderType: FolderType;
  clientId: string | null;
  metadata: Record<string, any> | null;
  documentCount: number;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderTreeNode {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  documentCount: number;
  children: FolderTreeNode[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  color?: string;
  parentId?: string | null;
  folderType?: FolderType;
  clientId?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string | null;
  color?: string;
  folderType?: FolderType;
  clientId?: string | null;
  metadata?: Record<string, any>;
}

export interface MoveFolderInput {
  parentId: string | null;
}

export interface FolderFilters {
  parentId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}
