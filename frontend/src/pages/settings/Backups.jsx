import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Backups() {
  const { token } = useContext(AuthContext);
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [backupsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/backups?pageSize=20`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/backups/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const backupsData = await backupsRes.json();
      const statsData = await statsRes.json();

      setBackups(backupsData.data || []);
      setStats(statsData.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async (type = 'FULL') => {
    setTriggering(true);
    try {
      await fetch(`${API_URL}/backups/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      // Refresh after a delay
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error triggering backup:', error);
    } finally {
      setTriggering(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const styles = {
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    const labels = {
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminé',
      FAILED: 'Échec',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      DATABASE: '🗄️ Base de données',
      MINIO: '📁 Fichiers',
      FULL: '💾 Complète',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sauvegardes</h1>
            <p className="text-gray-500 mt-1">
              Gérez les sauvegardes de vos données
            </p>
          </div>
          <button
            onClick={() => handleTriggerBackup('FULL')}
            disabled={triggering}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {triggering ? 'Démarrage...' : '+ Nouvelle sauvegarde'}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">{stats.last30Days?.total || 0}</div>
              <div className="text-sm text-gray-500">Sauvegardes (30j)</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.last30Days?.completed || 0}</div>
              <div className="text-sm text-green-600">Réussies</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{stats.last30Days?.failed || 0}</div>
              <div className="text-sm text-red-600">Échouées</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {formatBytes(parseInt(stats.last30Days?.totalSize || 0))}
              </div>
              <div className="text-sm text-blue-600">Volume total</div>
            </div>
          </div>
        )}

        {/* Last backup info */}
        {stats?.lastBackup && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <div className="font-medium text-green-800">Dernière sauvegarde réussie</div>
                <div className="text-sm text-green-600">
                  {new Date(stats.lastBackup.completedAt).toLocaleString('fr-FR')} •{' '}
                  {formatBytes(parseInt(stats.lastBackup.fileSize || 0))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleTriggerBackup('DATABASE')}
            disabled={triggering}
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">🗄️</div>
            <div className="font-medium text-gray-900">Base de données</div>
            <div className="text-sm text-gray-500">Sauvegarde PostgreSQL uniquement</div>
          </button>
          <button
            onClick={() => handleTriggerBackup('MINIO')}
            disabled={triggering}
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">📁</div>
            <div className="font-medium text-gray-900">Fichiers</div>
            <div className="text-sm text-gray-500">Sauvegarde MinIO uniquement</div>
          </button>
          <button
            onClick={() => handleTriggerBackup('FULL')}
            disabled={triggering}
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">💾</div>
            <div className="font-medium text-gray-900">Complète</div>
            <div className="text-sm text-gray-500">Base de données + Fichiers</div>
          </button>
        </div>

        {/* Backup history */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-medium text-gray-900">Historique des sauvegardes</h2>
          </div>
          {backups.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Aucune sauvegarde effectuée
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Taille
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durée
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(backup.startedAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getTypeLabel(backup.type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(backup.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {backup.fileSize ? formatBytes(parseInt(backup.fileSize)) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {backup.completedAt
                        ? Math.round(
                            (new Date(backup.completedAt) - new Date(backup.startedAt)) / 1000
                          ) + 's'
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Auto backup info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <div className="font-medium text-blue-800">Sauvegardes automatiques</div>
              <div className="text-sm text-blue-600 mt-1">
                Les sauvegardes sont effectuées automatiquement tous les jours à 3h00 du matin.
                Les anciennes sauvegardes sont conservées pendant 30 jours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
