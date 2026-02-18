import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Tracking() {
  const { token } = useContext(AuthContext);
  const [trackings, setTrackings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trackingRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/tracking?pageSize=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/tracking/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const trackingData = await trackingRes.json();
      const statsData = await statsRes.json();

      setTrackings(trackingData.data || []);
      setStats(statsData.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-700',
      SIGNED: 'bg-green-100 text-green-700',
      PENDING_DELIVERY: 'bg-blue-100 text-blue-700',
      DELIVERED: 'bg-green-100 text-green-700',
      EXPIRED: 'bg-red-100 text-red-700',
    };
    const labels = {
      DRAFT: 'Brouillon',
      PENDING_SIGNATURE: 'En attente signature',
      SIGNED: 'Signé',
      PENDING_DELIVERY: 'En cours d\'envoi',
      DELIVERED: 'Livré',
      EXPIRED: 'Expiré',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredTrackings = filter === 'all'
    ? trackings
    : trackings.filter((t) => t.status === filter);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi des documents</h1>
          <p className="text-gray-500 mt-1">
            Suivez l'état de vos documents, signatures et envois
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">{stats.totalTracked}</div>
              <div className="text-sm text-gray-500">Total suivis</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{stats.pendingSignature}</div>
              <div className="text-sm text-yellow-600">En attente signature</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.signed}</div>
              <div className="text-sm text-green-600">Signés</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.pendingDelivery}</div>
              <div className="text-sm text-blue-600">En cours d'envoi</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.delivered}</div>
              <div className="text-sm text-green-600">Livrés</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{stats.pendingReminders}</div>
              <div className="text-sm text-orange-600">Relances en attente</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'PENDING_SIGNATURE', label: 'En attente signature' },
            { value: 'SIGNED', label: 'Signés' },
            { value: 'PENDING_DELIVERY', label: 'En cours d\'envoi' },
            { value: 'DELIVERED', label: 'Livrés' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tracking list */}
        {filteredTrackings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-900">Aucun suivi trouvé</h3>
            <p className="text-gray-500 mt-1">
              Les documents avec signature ou envoi LRAR apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Méthode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Relances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dernière action
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrackings.map((tracking) => (
                  <tr key={tracking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {tracking.document?.name || 'Document'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tracking.document?.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tracking.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tracking.deliveryMethod === 'SIGNATURE_ELECTRONIQUE' && '✍️ Signature'}
                      {tracking.deliveryMethod === 'LRAR' && '📮 LRAR'}
                      {tracking.deliveryMethod === 'EMAIL' && '📧 Email'}
                      {!tracking.deliveryMethod && '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{tracking.reminderCount}/3</span>
                        {tracking.autoRemindersEnabled && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            Auto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tracking.lastReminderAt
                        ? new Date(tracking.lastReminderAt).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
