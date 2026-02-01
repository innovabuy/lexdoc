export interface Folder {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  cabinetId: string;
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
}

export interface UpdateFolderInput {
  name?: string;
  description?: string | null;
  color?: string;
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
