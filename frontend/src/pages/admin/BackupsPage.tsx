import React, { useState } from 'react';
import {
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Settings,
  RefreshCw,
  HardDrive,
  Cloud,
  Shield,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useBackups,
  useBackupStats,
  useBackupConfig,
  useTriggerBackup,
  useTestBackupConfig,
} from '@/hooks/useBackups';
import type { BackupLog } from '@/lib/api/backups';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'error'; icon: React.ElementType }
> = {
  SUCCESS: { label: 'Reussi', variant: 'success', icon: CheckCircle },
  IN_PROGRESS: { label: 'En cours', variant: 'warning', icon: RefreshCw },
  FAILED: { label: 'Echec', variant: 'error', icon: XCircle },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function parseCronSchedule(cron: string): string {
  // Simple cron parser for common patterns
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour] = parts;

  if (minute === '0' && hour !== '*') {
    return `Tous les jours a ${hour}h00`;
  }

  return cron;
}

export const BackupsPage: React.FC = () => {
  const [selectedBackup, setSelectedBackup] = useState<BackupLog | null>(null);

  const { data: backups, isLoading: backupsLoading, refetch } = useBackups(50);
  const { data: stats } = useBackupStats();
  const { data: config } = useBackupConfig();
  const triggerBackup = useTriggerBackup();
  const testConfig = useTestBackupConfig();

  const handleTriggerBackup = () => {
    triggerBackup.mutate();
  };

  const handleTestConfig = () => {
    testConfig.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sauvegardes</h1>
          <p className="text-gray-600 mt-1">
            Backups automatiques quotidiens sur Google Drive
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={backupsLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${backupsLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleTriggerBackup}
            disabled={triggerBackup.isPending || !config?.isConfigured}
          >
            {triggerBackup.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Backup en cours...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Lancer un backup
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Configuration Warning */}
      {config && !config.isConfigured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Configuration incomplete</h3>
              <p className="mt-1 text-sm text-amber-700">
                Le systeme de backup n'est pas configure. Veuillez configurer les variables
                d'environnement suivantes :
              </p>
              <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                <li>GOOGLE_DRIVE_CREDENTIALS_PATH</li>
                <li>GOOGLE_DRIVE_BACKUP_FOLDER_ID</li>
                <li>BACKUP_ENCRYPTION_KEY</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total backups</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reussis</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.success || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Echecs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.failed || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux de succes</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.successRate || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration Card */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Configuration</h2>
            </div>
            {config?.isConfigured && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestConfig}
                disabled={testConfig.isPending}
              >
                {testConfig.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Tester la connexion'
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Fournisseur</p>
              <div className="flex items-center gap-2 mt-1">
                <Cloud className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {config?.provider || 'Google Drive'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Frequence</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {config?.schedule ? parseCronSchedule(config.schedule) : 'Non configure'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Retention</p>
              <div className="flex items-center gap-2 mt-1">
                <HardDrive className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {config?.retentionDays || 30} jours
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dernier backup reussi</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-gray-900">
                  {stats?.lastSuccessfulBackup
                    ? formatDistanceToNow(new Date(stats.lastSuccessfulBackup), {
                        addSuffix: true,
                        locale: fr,
                      })
                    : 'Aucun'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Backups Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Historique des backups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backup ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duree
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backupsLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Chargement...
                  </td>
                </tr>
              ) : backups && backups.length > 0 ? (
                backups.map((backup) => {
                  const statusConfig = STATUS_CONFIG[backup.status];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(backup.startedAt), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(backup.startedAt), 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {backup.backupId}
                        </code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusConfig?.variant || 'primary'}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig?.label || backup.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {backup.duration ? `${backup.duration.toFixed(1)}s` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {backup.metadata?.totalSize
                          ? formatBytes(backup.metadata.totalSize)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBackup(backup)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucun backup disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Backup Details Modal */}
      {selectedBackup && (
        <Modal
          isOpen={!!selectedBackup}
          onClose={() => setSelectedBackup(null)}
          title="Details du backup"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Backup ID</p>
                <p className="font-mono text-sm">{selectedBackup.backupId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <Badge
                  variant={STATUS_CONFIG[selectedBackup.status]?.variant || 'primary'}
                >
                  {STATUS_CONFIG[selectedBackup.status]?.label || selectedBackup.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de debut</p>
                <p className="text-sm">
                  {format(new Date(selectedBackup.startedAt), 'dd/MM/yyyy HH:mm:ss', {
                    locale: fr,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duree</p>
                <p className="text-sm">
                  {selectedBackup.duration ? `${selectedBackup.duration.toFixed(2)} secondes` : '-'}
                </p>
              </div>
            </div>

            {selectedBackup.error && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{selectedBackup.error}</p>
              </div>
            )}

            {selectedBackup.metadata && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Contenu du backup</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base de donnees</span>
                      <span className="font-medium">
                        {formatBytes(selectedBackup.metadata.database?.size || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Fichiers MinIO</span>
                      <span className="font-medium">
                        {formatBytes(selectedBackup.metadata.files?.minio?.size || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Uploads</span>
                      <span className="font-medium">
                        {formatBytes(selectedBackup.metadata.files?.uploads?.size || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                      <span className="text-gray-700 font-medium">Total</span>
                      <span className="font-bold">
                        {formatBytes(selectedBackup.metadata.totalSize || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Securite</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>
                      Chiffre avec {selectedBackup.metadata.encryption?.algorithm || 'AES-256-CBC'}
                    </span>
                  </div>
                </div>

                {selectedBackup.metadata.retention && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Retention</h4>
                    <p className="text-sm text-gray-600">
                      Ce backup sera conserve pendant {selectedBackup.metadata.retention.days} jours
                      (jusqu'au{' '}
                      {format(
                        new Date(selectedBackup.metadata.retention.deleteAfter),
                        'dd/MM/yyyy',
                        { locale: fr }
                      )}
                      )
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setSelectedBackup(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BackupsPage;
