import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function ClientAccess() {
  const { token } = useContext(AuthContext);
  const [accesses, setAccesses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const [inviteForm, setInviteForm] = useState({ folderId: '', email: '' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accessRes, statsRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/client-access?pageSize=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/client-access/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/folders?pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const accessData = await accessRes.json();
      const statsData = await statsRes.json();
      const foldersData = await foldersRes.json();

      setAccesses(accessData.data || []);
      setStats(statsData.data || {});
      setFolders(foldersData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);

    try {
      const res = await fetch(`${API_URL}/client-access/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      });

      if (res.ok) {
        setShowInviteModal(false);
        setInviteForm({ folderId: '', email: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error inviting client:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (accessId) => {
    try {
      await fetch(`${API_URL}/client-access/${accessId}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const handleRevoke = async (accessId) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cet accès ?')) return;

    try {
      await fetch(`${API_URL}/client-access/${accessId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error('Error revoking access:', error);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Accès clients</h1>
            <p className="text-gray-500 mt-1">
              Gérez les accès extranet de vos clients
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Inviter un client
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total invitations</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.activated}</div>
              <div className="text-sm text-green-600">Comptes activés</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-sm text-yellow-600">En attente</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.recentLogins}</div>
              <div className="text-sm text-blue-600">Connexions récentes (7j)</div>
            </div>
          </div>
        )}

        {/* Access list */}
        {accesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-medium text-gray-900">Aucun accès client</h3>
            <p className="text-gray-500 mt-1">
              Invitez vos clients à accéder à leur espace extranet
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Inviter un client
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dossier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accesses.map((access) => (
                  <tr key={access.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{access.email}</div>
                      <div className="text-sm text-gray-500">
                        {access.folder?.client?.companyName ||
                          `${access.folder?.client?.firstName || ''} ${access.folder?.client?.lastName || ''}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{access.folder?.title}</div>
                      <div className="text-xs text-gray-500">{access.folder?.reference}</div>
                    </td>
                    <td className="px-6 py-4">
                      {access.isActivated ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Activé
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {access.lastLoginAt
                        ? new Date(access.lastLoginAt).toLocaleDateString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {!access.isActivated && (
                        <button
                          onClick={() => handleResend(access.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Renvoyer
                        </button>
                      )}
                      <button
                        onClick={() => handleRevoke(access.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Révoquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Inviter un client</h2>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dossier
                  </label>
                  <select
                    value={inviteForm.folderId}
                    onChange={(e) => setInviteForm({ ...inviteForm, folderId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionnez un dossier</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.reference} - {folder.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email du client
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="client@email.com"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
