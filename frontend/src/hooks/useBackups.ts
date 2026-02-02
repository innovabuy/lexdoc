import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as backupsApi from '@/lib/api/backups';
import { getApiErrorMessage } from '@/lib/utils/error';

/**
 * List all backups
 */
export function useBackups(limit?: number) {
  return useQuery({
    queryKey: ['backups', limit],
    queryFn: () => backupsApi.listBackups(limit),
    staleTime: 30 * 1000,
  });
}

/**
 * Get backup statistics
 */
export function useBackupStats() {
  return useQuery({
    queryKey: ['backups', 'stats'],
    queryFn: () => backupsApi.getBackupStats(),
    staleTime: 60 * 1000,
  });
}

/**
 * Get backup configuration
 */
export function useBackupConfig() {
  return useQuery({
    queryKey: ['backups', 'config'],
    queryFn: () => backupsApi.getBackupConfig(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get a specific backup
 */
export function useBackup(backupId: string | undefined) {
  return useQuery({
    queryKey: ['backups', backupId],
    queryFn: () => backupsApi.getBackup(backupId!),
    enabled: !!backupId,
    staleTime: 30 * 1000,
  });
}

/**
 * Trigger manual backup
 */
export function useTriggerBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => backupsApi.triggerBackup(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      if (result.success) {
        toast.success(`Backup ${result.backupId} termine avec succes`);
      } else {
        toast.error(`Echec du backup: ${result.error}`);
      }
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du backup'));
    },
  });
}

/**
 * Test backup configuration
 */
export function useTestBackupConfig() {
  return useMutation({
    mutationFn: () => backupsApi.testBackupConfig(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du test'));
    },
  });
}

export type { BackupLog, BackupStats, BackupConfig, BackupResult } from '@/lib/api/backups';
