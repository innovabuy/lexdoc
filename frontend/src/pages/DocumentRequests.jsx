import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  COMPLETED: { label: 'Complété', color: 'bg-green-100 text-green-700', icon: '✓' },
  CANCELLED: { label: 'Annulé', color: 'bg-gray-100 text-gray-600', icon: '✕' },
  EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-700', icon: '⚠' },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Basse', color: 'text-gray-500', bg: 'bg-gray-50' },
  NORMAL: { label: 'Normale', color: 'text-blue-600', bg: 'bg-blue-50' },
  HIGH: { label: 'Haute', color: 'text-orange-600', bg: 'bg-orange-50' },
  URGENT: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-50' },
};

export default function DocumentRequests() {
  const { token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/document-requests?pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/document-requests/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const requestsData = await requestsRes.json();
      const statsData = await statsRes.json();

      setRequests(requestsData.data || []);
      setStats(statsData.data || {});
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredRequests = requests.filter((request) => {
    // Filter by status
    if (filter !== 'all') {
      if (filter === 'overdue') {
        const days = getDaysRemaining(request.dueDate);
        if (!(days !== null && days < 0 && request.status === 'PENDING')) return false;
      } else if (request.status !== filter) {
        return false;
      }
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesTitle = request.title.toLowerCase().includes(searchLower);
      const matchesFolder = request.folder?.title?.toLowerCase().includes(searchLower);
      const matchesRef = request.folder?.reference?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesFolder && !matchesRef) return false;
    }

    return true;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demandes de pièces</h1>
            <p className="text-gray-500 mt-1">
              Gérez toutes les demandes de documents auprès des clients
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
              <p className="text-sm text-yellow-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-sm text-green-600">Complétées</p>
              <p className="text-2xl font-bold text-green-700">{stats.completed || 0}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
              <p className="text-sm text-red-600">En retard</p>
              <p className="text-2xl font-bold text-red-700">{stats.overdue || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Annulées</p>
              <p className="text-2xl font-bold text-gray-700">{stats.cancelled || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre ou dossier..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { value: 'all', label: 'Toutes' },
                { value: 'PENDING', label: 'En attente' },
                { value: 'overdue', label: 'En retard' },
                { value: 'COMPLETED', label: 'Complétées' },
                { value: 'CANCELLED', label: 'Annulées' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Chargement...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-medium text-gray-900 mb-2">
                {requests.length === 0 ? 'Aucune demande' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-500">
                {requests.length === 0
                  ? 'Les demandes de pièces apparaîtront ici'
                  : 'Modifiez vos filtres pour voir plus de résultats'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredRequests.map((request) => {
                const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
                const priority = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.NORMAL;
                const daysRemaining = getDaysRemaining(request.dueDate);
                const isOverdue =
                  daysRemaining !== null && daysRemaining < 0 && request.status === 'PENDING';

                return (
                  <div
                    key={request.id}
                    className={`p-4 hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${priority.color} ${priority.bg}`}>
                            {priority.label}
                          </span>
                          {request.reminderCount > 0 && (
                            <span className="text-xs text-gray-400">
                              🔔 {request.reminderCount} relance{request.reminderCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900">{request.title}</h4>
                        {request.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {request.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <Link
                            to={`/folders/${request.folder?.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            📁 {request.folder?.reference} - {request.folder?.title}
                          </Link>
                          {request.dueDate && (
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {isOverdue
                                ? `⚠ En retard de ${Math.abs(daysRemaining)} jour(s)`
                                : `Échéance: ${new Date(request.dueDate).toLocaleDateString('fr-FR')}`}
                            </span>
                          )}
                          <span>
                            Créé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/folders/${request.folder?.id}`}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        Voir le dossier →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
