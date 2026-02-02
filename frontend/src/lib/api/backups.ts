import { apiClient } from './client';

export interface BackupLog {
  id: string;
  backupId: string;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  provider: string;
  duration?: number;
  error?: string;
  metadata?: {
    backupId: string;
    timestamp: string;
    lexdocVersion: string;
    database: { engine: string; size: number; encrypted: boolean };
    files: {
      minio: { size: number; encrypted: boolean };
      uploads: { size: number; encrypted: boolean };
    };
    encryption?: { algorithm: string; keyDerivation: string };
    totalSize: number;
    retention: { days: number; deleteAfter: string };
  };
  startedAt: string;
  completedAt?: string;
}

export interface BackupStats {
  total: number;
  success: number;
  failed: number;
  successRate: string;
  lastSuccessfulBackup: string | null;
  isConfigured: boolean;
}

export interface BackupConfig {
  isConfigured: boolean;
  provider: string;
  schedule: string;
  retentionDays: number;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  duration?: string;
  error?: string;
}

/**
 * List all backups
 */
export async function listBackups(limit?: number): Promise<BackupLog[]> {
  const params = limit ? `?limit=${limit}` : '';
  const response = await apiClient.get<{ success: boolean; data: BackupLog[] }>(
    `/backups${params}`
  );
  return response.data.data;
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<BackupStats> {
  const response = await apiClient.get<{ success: boolean; data: BackupStats }>(
    '/backups/stats'
  );
  return response.data.data;
}

/**
 * Get backup configuration
 */
export async function getBackupConfig(): Promise<BackupConfig> {
  const response = await apiClient.get<{ success: boolean; data: BackupConfig }>(
    '/backups/config'
  );
  return response.data.data;
}

/**
 * Get a specific backup
 */
export async function getBackup(backupId: string): Promise<BackupLog> {
  const response = await apiClient.get<{ success: boolean; data: BackupLog }>(
    `/backups/${backupId}`
  );
  return response.data.data;
}

/**
 * Trigger manual backup
 */
export async function triggerBackup(): Promise<BackupResult> {
  const response = await apiClient.post<{ success: boolean; data: BackupResult }>(
    '/backups/trigger'
  );
  return response.data.data;
}

/**
 * Test backup configuration
 */
export async function testBackupConfig(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/backups/test'
  );
  return { success: response.data.success, message: response.data.message };
}

/**
 * Get backup manifest
 */
export async function getBackupManifest(backupId: string): Promise<any> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/backups/${backupId}/manifest`
  );
  return response.data.data;
}
