import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Activity() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActivity();
  }, [page]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/extranet/activity?page=${page}&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.data || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionInfo = (action) => {
    if (action === 'LOGIN') {
      return { icon: '🔐', label: 'Connexion', color: 'bg-green-100 text-green-700' };
    }
    if (action === 'ACCOUNT_ACTIVATED') {
      return { icon: '✅', label: 'Compte active', color: 'bg-green-100 text-green-700' };
    }
    if (action === 'PASSWORD_CHANGED') {
      return { icon: '🔑', label: 'Mot de passe modifie', color: 'bg-yellow-100 text-yellow-700' };
    }
    if (action.startsWith('DOCUMENT_VIEW:')) {
      return { icon: '👁️', label: 'Document consulte', color: 'bg-blue-100 text-blue-700' };
    }
    if (action.startsWith('DOCUMENT_DOWNLOAD:')) {
      return { icon: '📥', label: 'Document telecharge', color: 'bg-purple-100 text-purple-700' };
    }
    if (action === 'API_REQUEST') {
      return { icon: '🔄', label: 'Acces API', color: 'bg-gray-100 text-gray-600' };
    }
    return { icon: '📋', label: action, color: 'bg-gray-100 text-gray-600' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon activite</h1>
          <p className="text-gray-500 mt-1">Historique de vos actions sur l'espace client</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">Aucune activite enregistree</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs).map(([date, dayLogs]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-3 capitalize">{date}</h3>
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="divide-y">
                    {dayLogs.map((log) => {
                      const info = getActionInfo(log.action);
                      return (
                        <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${info.color}`}>
                              {info.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{info.label}</span>
                                <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                              </div>
                              {log.action.includes(':') && (
                                <p className="text-sm text-gray-500 mt-1 truncate">
                                  ID: {log.action.split(':')[1]}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                {log.ipAddress && log.ipAddress !== 'unknown' && (
                                  <span>IP: {log.ipAddress}</span>
                                )}
                                {log.userAgent && log.userAgent !== 'unknown' && (
                                  <span className="truncate max-w-xs" title={log.userAgent}>
                                    {log.userAgent.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Precedent
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
