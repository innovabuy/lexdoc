import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Action labels in French
const actionLabels = {
  FOLDER_CREATED: 'Dossier créé',
  FOLDER_UPDATED: 'Dossier modifié',
  FOLDER_VIEWED: 'Dossier consulté',
  FOLDER_DELETED: 'Dossier supprimé',
  FOLDER_ARCHIVED: 'Dossier archivé',
  FOLDER_MOVED: 'Dossier déplacé',
  DOCUMENT_CREATED: 'Document ajouté',
  DOCUMENT_UPLOADED: 'Document téléversé',
  DOCUMENT_UPDATED: 'Document modifié',
  DOCUMENT_DELETED: 'Document supprimé',
  DOCUMENT_DOWNLOADED: 'Document téléchargé',
  DOCUMENT_SIGNED: 'Document signé',
  DOCUMENT_SENT: 'Document envoyé',
  PERSON_ADDED: 'Personne ajoutée',
  PERSON_UPDATED: 'Personne modifiée',
  PERSON_DELETED: 'Personne supprimée',
  FOLDER_PERSON_CREATED: 'Personne ajoutée',
  FOLDER_PERSON_UPDATED: 'Personne modifiée',
  FOLDER_PERSON_DELETED: 'Personne supprimée',
  MANUAL_REMINDER_SENT: 'Rappel envoyé',
};

// Action icons
const actionIcons = {
  FOLDER_CREATED: '📁',
  FOLDER_UPDATED: '✏️',
  FOLDER_VIEWED: '👁️',
  FOLDER_DELETED: '🗑️',
  FOLDER_ARCHIVED: '📦',
  FOLDER_MOVED: '📂',
  DOCUMENT_CREATED: '📄',
  DOCUMENT_UPLOADED: '⬆️',
  DOCUMENT_UPDATED: '✏️',
  DOCUMENT_DELETED: '🗑️',
  DOCUMENT_DOWNLOADED: '⬇️',
  DOCUMENT_SIGNED: '✅',
  DOCUMENT_SENT: '📤',
  PERSON_ADDED: '👤',
  PERSON_UPDATED: '✏️',
  PERSON_DELETED: '🗑️',
  FOLDER_PERSON_CREATED: '👤',
  FOLDER_PERSON_UPDATED: '✏️',
  FOLDER_PERSON_DELETED: '🗑️',
  MANUAL_REMINDER_SENT: '🔔',
};

// Action colors
const actionColors = {
  FOLDER_CREATED: 'bg-green-100 text-green-700 border-green-200',
  FOLDER_UPDATED: 'bg-blue-100 text-blue-700 border-blue-200',
  FOLDER_VIEWED: 'bg-gray-100 text-gray-600 border-gray-200',
  FOLDER_DELETED: 'bg-red-100 text-red-700 border-red-200',
  FOLDER_ARCHIVED: 'bg-purple-100 text-purple-700 border-purple-200',
  FOLDER_MOVED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DOCUMENT_CREATED: 'bg-green-100 text-green-700 border-green-200',
  DOCUMENT_UPLOADED: 'bg-green-100 text-green-700 border-green-200',
  DOCUMENT_UPDATED: 'bg-blue-100 text-blue-700 border-blue-200',
  DOCUMENT_DELETED: 'bg-red-100 text-red-700 border-red-200',
  DOCUMENT_DOWNLOADED: 'bg-gray-100 text-gray-600 border-gray-200',
  DOCUMENT_SIGNED: 'bg-green-100 text-green-700 border-green-200',
  DOCUMENT_SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  PERSON_ADDED: 'bg-green-100 text-green-700 border-green-200',
  PERSON_UPDATED: 'bg-blue-100 text-blue-700 border-blue-200',
  PERSON_DELETED: 'bg-red-100 text-red-700 border-red-200',
  FOLDER_PERSON_CREATED: 'bg-green-100 text-green-700 border-green-200',
  FOLDER_PERSON_UPDATED: 'bg-blue-100 text-blue-700 border-blue-200',
  FOLDER_PERSON_DELETED: 'bg-red-100 text-red-700 border-red-200',
  MANUAL_REMINDER_SENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

// Format relative time in French
function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Format full date
function formatFullDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Group activities by date
function groupByDate(activities) {
  const groups = {};

  activities.forEach(activity => {
    const date = new Date(activity.createdAt);
    const key = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
  });

  return groups;
}

export default function FolderTimeline({ folderId }) {
  const { token } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (folderId) {
      fetchActivities();
    }
  }, [folderId]);

  const fetchActivities = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/folders/${folderId}/activity?page=${pageNum}&pageSize=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setActivities(data.data || []);
        } else {
          setActivities(prev => [...prev, ...(data.data || [])]);
        }
        setHasMore(data.pagination?.page < data.pagination?.totalPages);
        setPage(pageNum);
      } else {
        setError(data.error?.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchActivities(page + 1);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Chargement de l'historique...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchActivities(1)}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
        <div className="text-3xl mb-3">📅</div>
        <h4 className="text-gray-900 font-medium">Aucune activité</h4>
        <p className="text-gray-500 text-sm mt-1">
          L'historique des actions sur ce dossier apparaîtra ici
        </p>
      </div>
    );
  }

  const groupedActivities = groupByDate(activities);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Historique d'activité</h3>
          <p className="text-sm text-gray-500">
            {activities.length} action{activities.length > 1 ? 's' : ''} enregistrée{activities.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => fetchActivities(1)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Actualiser
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="text-sm font-medium text-gray-500 capitalize">{date}</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            {/* Activities for this date */}
            <div className="space-y-3">
              {dayActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border ${
                      actionColors[activity.action] || 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {actionIcons[activity.action] || '📌'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">
                        {actionLabels[activity.action] || activity.action}
                      </p>
                      <span
                        className="text-xs text-gray-500 whitespace-nowrap"
                        title={formatFullDate(activity.createdAt)}
                      >
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>

                    {/* User */}
                    {activity.user && (
                      <p className="text-sm text-gray-600 mt-1">
                        par <span className="font-medium">{activity.user.name}</span>
                      </p>
                    )}

                    {/* Metadata details */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                        {activity.metadata.title && (
                          <span>Titre : {activity.metadata.title}</span>
                        )}
                        {activity.metadata.sentTo && (
                          <span>Envoyé à : {activity.metadata.sentTo}</span>
                        )}
                        {activity.metadata.type && !activity.metadata.title && (
                          <span>Type : {activity.metadata.type}</span>
                        )}
                      </div>
                    )}

                    {/* Changes details */}
                    {activity.changes && Object.keys(activity.changes).filter(k => activity.changes[k] !== undefined).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <details className="cursor-pointer">
                          <summary className="hover:text-gray-700">Voir les modifications</summary>
                          <div className="mt-1 bg-gray-50 rounded p-2 space-y-1">
                            {Object.entries(activity.changes)
                              .filter(([key, value]) => value !== undefined && value !== null)
                              .map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}</span>: {String(value)}
                                </div>
                              ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );
}
