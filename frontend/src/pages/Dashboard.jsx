import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { error: showError } = useToast();
  const [stats, setStats] = useState({
    pendingSignatures: 0,
    signedDocuments: 0,
    totalDocuments: 0,
    totalClients: 0,
    totalFolders: 0,
    pendingRequests: 0,
    openFolders: 0,
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentFolders, setRecentFolders] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, signaturesRes, clientsRes, foldersRes, requestsRes] = await Promise.all([
        api.get('/documents?pageSize=5'),
        api.get('/signatures?pageSize=100'),
        api.get('/clients'),
        api.get('/folders?pageSize=5'),
        api.get('/document-requests?status=PENDING&pageSize=5'),
      ]);

      const docs = docsRes.data.data || [];
      const signatures = signaturesRes.data.data || [];
      const clients = clientsRes.data.data || [];
      const folders = foldersRes.data.data || [];
      const requests = requestsRes.data.data || [];

      const pendingSigs = signatures.filter(s => s.status === 'PENDING');
      const signedSigs = signatures.filter(s => s.status === 'SIGNED');
      const openFolders = folders.filter(f => f.status === 'OPEN' || f.status === 'IN_PROGRESS');

      setStats({
        pendingSignatures: pendingSigs.length,
        signedDocuments: signedSigs.length,
        totalDocuments: docsRes.data.pagination?.total || docs.length,
        totalClients: clientsRes.data.pagination?.total || clients.length,
        totalFolders: foldersRes.data.pagination?.total || folders.length,
        pendingRequests: requestsRes.data.pagination?.total || requests.length,
        openFolders: openFolders.length,
      });

      setRecentDocs(docs);
      setRecentFolders(folders.slice(0, 5));

      // Build pending items list
      const items = [];
      pendingSigs.slice(0, 3).forEach(s => {
        items.push({
          id: s.id,
          type: 'signature',
          title: `Signature en attente: ${s.document?.name || 'Document'}`,
          link: '/signatures',
          priority: 'high',
        });
      });
      requests.slice(0, 3).forEach(r => {
        items.push({
          id: r.id,
          type: 'request',
          title: `Demande de document: ${r.title}`,
          link: '/document-requests',
          priority: r.priority === 'URGENT' ? 'high' : 'normal',
        });
      });
      setPendingItems(items);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showError('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.firstName || 'Utilisateur'} !
          </h1>
          <p className="text-blue-100 mt-1">
            Voici un apercu de votre activite
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            icon="📄"
            label="Nouveau document"
            link="/documents"
          />
          <QuickAction
            icon="📁"
            label="Nouveau dossier"
            link="/dossiers/nouveau"
          />
          <QuickAction
            icon="👤"
            label="Nouveau client"
            link="/clients"
          />
          <QuickAction
            icon="📝"
            label="Templates"
            link="/templates"
          />
        </div>

        {/* Alerts Section */}
        {pendingItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚠️</span>
              <h3 className="font-semibold text-amber-800">Actions requises</h3>
            </div>
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="text-sm text-gray-700">{item.title}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Documents" value={stats.totalDocuments} icon="📄" color="blue" />
          <StatCard title="Dossiers" value={stats.totalFolders} icon="📁" color="purple" />
          <StatCard title="Dossiers ouverts" value={stats.openFolders} icon="📂" color="indigo" />
          <StatCard title="Clients" value={stats.totalClients} icon="👥" color="green" />
          <StatCard title="Signatures en attente" value={stats.pendingSignatures} icon="⏳" color="orange" highlight={stats.pendingSignatures > 0} />
          <StatCard title="Demandes en cours" value={stats.pendingRequests} icon="📨" color="pink" highlight={stats.pendingRequests > 0} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Documents recents</h2>
              <Link to="/documents" className="text-sm text-blue-600 hover:text-blue-700">
                Voir tout →
              </Link>
            </div>
            {recentDocs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-3xl block mb-2">📄</span>
                Aucun document
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getDocIcon(doc.type)}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Folders */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Dossiers recents</h2>
              <Link to="/dossiers" className="text-sm text-blue-600 hover:text-blue-700">
                Voir tout →
              </Link>
            </div>
            {recentFolders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-3xl block mb-2">📁</span>
                Aucun dossier
              </div>
            ) : (
              <div className="space-y-3">
                {recentFolders.map((folder) => (
                  <Link
                    key={folder.id}
                    to={`/dossiers/${folder.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: folder.color || '#3B82F6' }}
                      >
                        📁
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{folder.title}</p>
                        <p className="text-xs text-gray-500">{folder.reference}</p>
                      </div>
                    </div>
                    <FolderStatusBadge status={folder.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Apercu de l'activite</h2>
          <div className="grid grid-cols-4 gap-4">
            <MiniChart label="Documents" value={stats.totalDocuments} maxValue={Math.max(stats.totalDocuments, 50)} color="blue" />
            <MiniChart label="Signes" value={stats.signedDocuments} maxValue={Math.max(stats.totalDocuments, 50)} color="green" />
            <MiniChart label="En attente" value={stats.pendingSignatures} maxValue={Math.max(stats.totalDocuments, 50)} color="orange" />
            <MiniChart label="Demandes" value={stats.pendingRequests} maxValue={Math.max(stats.pendingRequests, 10)} color="pink" />
          </div>
        </div>
      </div>
    </>
  );
}

// Quick Action Button
function QuickAction({ icon, label, link }) {
  return (
    <Link
      to={link}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium text-gray-700 text-sm">{label}</span>
    </Link>
  );
}

// Stat Card
function StatCard({ title, value, icon, color, highlight }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className={`bg-white rounded-xl border p-4 ${highlight ? 'ring-2 ring-orange-300' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

// Mini Chart (CSS-based)
function MiniChart({ label, value, maxValue, color }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
  };

  return (
    <div className="text-center">
      <div className="h-24 flex items-end justify-center mb-2">
        <div
          className={`w-12 ${colors[color]} rounded-t-lg transition-all duration-500`}
          style={{ height: `${Math.max(percentage, 5)}%` }}
        />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }) {
  const styles = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-700',
    SIGNED: 'bg-green-100 text-green-700',
    SENT: 'bg-blue-100 text-blue-700',
    ARCHIVED: 'bg-purple-100 text-purple-700',
  };

  const labels = {
    DRAFT: 'Brouillon',
    PENDING_SIGNATURE: 'En attente',
    SIGNED: 'Signe',
    SENT: 'Envoye',
    ARCHIVED: 'Archive',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}

// Folder Status Badge
function FolderStatusBadge({ status }) {
  const styles = {
    OPEN: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-gray-100 text-gray-600',
    ARCHIVED: 'bg-purple-100 text-purple-700',
  };

  const labels = {
    OPEN: 'Ouvert',
    IN_PROGRESS: 'En cours',
    PENDING: 'En attente',
    CLOSED: 'Ferme',
    ARCHIVED: 'Archive',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}

// Helpers
function getDocIcon(type) {
  const icons = {
    CONTRACT: '📝',
    DEED: '📜',
    LETTER: '✉️',
    CERTIFICATE: '🎓',
    AMENDMENT: '📋',
  };
  return icons[type] || '📄';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}
