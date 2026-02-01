export type CabinetStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELED';

export interface Cabinet {
  id: string;
  name: string;
  email: string;
  siret?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  status: CabinetStatus;
  trialEndsAt?: string;
  maxUsers: number;
  maxStorage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CabinetStats {
  totalUsers: number;
  totalDocuments: number;
  totalFolders: number;
  storageUsed: number;
  storageLimit: number;
}

export interface UpdateCabinetInput {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
}
