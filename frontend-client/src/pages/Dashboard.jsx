import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Dashboard() {
  const { token, user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/extranet/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-700',
      SIGNED: 'bg-green-100 text-green-700',
      SENT: 'bg-blue-100 text-blue-700',
    };
    const labels = {
      DRAFT: 'Brouillon',
      PENDING_SIGNATURE: 'À signer',
      SIGNED: 'Signé',
      SENT: 'Envoyé',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">Bonjour {user?.client?.firstName || 'Client'}</h1>
          <p className="mt-1 text-primary-100">
            Bienvenue sur votre espace client sécurisé
          </p>
          <div className="mt-4 text-sm text-primary-200">
            Dossier : {user?.folder?.title || 'N/A'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-3xl font-bold text-gray-900">{data?.stats?.totalDocuments || 0}</div>
            <div className="text-sm text-gray-500">Documents</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-700">{data?.stats?.pendingSignature || 0}</div>
            <div className="text-sm text-yellow-600">À signer</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="text-3xl font-bold text-orange-700">{data?.stats?.pendingRequests || 0}</div>
            <div className="text-sm text-orange-600">Demandes</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-700">{data?.stats?.signed || 0}</div>
            <div className="text-sm text-green-600">Signés</div>
          </div>
        </div>

        {/* Recent documents */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Documents récents</h2>
            <Link to="/documents" className="text-sm text-primary-600 hover:text-primary-700">
              Voir tous →
            </Link>
          </div>
          {data?.recentDocuments?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun document disponible
            </div>
          ) : (
            <div className="divide-y">
              {data?.recentDocuments?.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      📄
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{doc.name}</div>
                      <div className="text-sm text-gray-500">{doc.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc.status)}
                    {doc.requiresSignature && doc.status === 'PENDING_SIGNATURE' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded animate-pulse">
                        Action requise
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending document requests */}
        {data?.pendingRequests?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-orange-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">📥</span>
                <h2 className="font-semibold text-orange-800">Pièces demandées</h2>
              </div>
              <Link to="/requests" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                Voir toutes →
              </Link>
            </div>
            <div className="divide-y">
              {data.pendingRequests.map((request) => (
                <Link
                  key={request.id}
                  to="/requests"
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      request.priority === 'URGENT' ? 'bg-red-100' :
                      request.priority === 'HIGH' ? 'bg-orange-100' : 'bg-yellow-100'
                    }`}>
                      📋
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{request.title}</div>
                      {request.dueDate && (
                        <div className="text-sm text-gray-500">
                          Échéance: {new Date(request.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    request.priority === 'URGENT' ? 'bg-red-100 text-red-700 animate-pulse' :
                    request.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {request.priority === 'URGENT' ? 'Urgent' :
                     request.priority === 'HIGH' ? 'Prioritaire' : 'En attente'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions needing attention */}
        {data?.stats?.pendingSignature > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✍️</div>
              <div>
                <h3 className="font-medium text-yellow-800">
                  {data.stats.pendingSignature} document(s) en attente de signature
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Veuillez signer les documents en attente pour permettre le traitement de votre dossier.
                </p>
                <Link
                  to="/documents?status=PENDING_SIGNATURE"
                  className="inline-block mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  Voir les documents à signer →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Alert for pending requests */}
        {data?.stats?.pendingRequests > 0 && !data?.pendingRequests?.length && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📥</div>
              <div>
                <h3 className="font-medium text-orange-800">
                  {data.stats.pendingRequests} pièce(s) demandée(s)
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Votre avocat vous a demandé des documents. Merci de les fournir dès que possible.
                </p>
                <Link
                  to="/requests"
                  className="inline-block mt-2 text-sm font-medium text-orange-800 hover:text-orange-900"
                >
                  Voir les demandes →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
