import { useState, useEffect } from 'react';
import api from '../services/api';

const TYPE_LABELS = {
  CONTRACT: 'Contrat',
  DEED: 'Acte',
  LETTER: 'Courrier',
  INVOICE: 'Facture',
  CERTIFICATE: 'Certificat',
  REPORT: 'Rapport',
  OTHER: 'Autre',
  LITIGATION: 'Contentieux',
  BUSINESS: 'Affaires',
  FAMILY: 'Famille',
  REAL_ESTATE: 'Immobilier',
  LABOR: 'Travail',
  INTELLECTUAL: 'PI',
  ADMINISTRATIVE: 'Admin',
  CRIMINAL: 'Penal',
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  PENDING_SIGNATURE: 'En attente',
  SIGNED: 'Signe',
  SENT: 'Envoye',
  ARCHIVED: 'Archive',
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  PENDING: 'En attente',
  CLOSED: 'Ferme',
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function Statistics() {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dashboard: null,
    documents: null,
    folders: null,
    activity: null,
    clients: null,
  });

  useEffect(() => {
    fetchAllStats();
  }, [period]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const [dashboard, documents, folders, activity, clients] = await Promise.all([
        api.get('/statistics/dashboard'),
        api.get(`/statistics/documents?period=${period}`),
        api.get('/statistics/folders'),
        api.get(`/statistics/activity?period=${period}`),
        api.get('/statistics/clients'),
      ]);

      setStats({
        dashboard: dashboard.data.data,
        documents: documents.data.data,
        folders: folders.data.data,
        activity: activity.data.data,
        clients: clients.data.data,
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Documents" value={stats.dashboard?.totalDocuments || 0} icon="📄" color="blue" />
          <KPICard title="Dossiers" value={stats.dashboard?.totalFolders || 0} icon="📁" color="purple" />
          <KPICard title="Clients" value={stats.dashboard?.totalClients || 0} icon="👥" color="green" />
          <KPICard title="Activite (24h)" value={stats.dashboard?.recentActivity || 0} icon="📊" color="orange" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Documents Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Documents crees ({period} jours)
            </h2>
            <div className="h-48">
              <LineChart data={stats.documents?.timeline || []} />
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activite ({period} jours)
            </h2>
            <div className="h-48">
              <LineChart data={stats.activity?.timeline || []} color="#10B981" />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Types */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Types de documents
            </h2>
            <PieChart
              data={stats.documents?.typeDistribution?.map(d => ({
                label: TYPE_LABELS[d.type] || d.type,
                value: d.count,
              })) || []}
            />
          </div>

          {/* Folder Types */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Types de dossiers
            </h2>
            <PieChart
              data={stats.folders?.typeDistribution?.map(d => ({
                label: TYPE_LABELS[d.type] || d.type,
                value: d.count,
              })) || []}
            />
          </div>

          {/* Folder Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statut des dossiers
            </h2>
            <PieChart
              data={stats.folders?.statusDistribution?.map(d => ({
                label: STATUS_LABELS[d.status] || d.status,
                value: d.count,
              })) || []}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Clients
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Total" value={stats.clients?.total || 0} />
              <StatBox label="Nouveaux ce mois" value={stats.clients?.newThisMonth || 0} />
              <StatBox label="Particuliers" value={stats.clients?.individuals || 0} />
              <StatBox label="Entreprises" value={stats.clients?.companies || 0} />
              <StatBox label="Moy. dossiers/client" value={stats.clients?.avgFoldersPerClient || 0} />
              <StatBox label="Total dossiers" value={stats.clients?.totalFolders || 0} />
            </div>
          </div>

          {/* Top Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions les plus frequentes
            </h2>
            <div className="space-y-2">
              {stats.activity?.topActions?.slice(0, 6).map((action, i) => (
                <div key={action.action} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatAction(action.action)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(action.count / (stats.activity?.topActions?.[0]?.count || 1)) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                      {action.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signatures & Requests */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Signatures en attente"
            value={stats.dashboard?.pendingSignatures || 0}
            icon="⏳"
            color="orange"
          />
          <KPICard
            title="Documents signes"
            value={stats.dashboard?.signedDocuments || 0}
            icon="✅"
            color="green"
          />
          <KPICard
            title="Dossiers ouverts"
            value={stats.dashboard?.openFolders || 0}
            icon="📂"
            color="blue"
          />
          <KPICard
            title="Demandes en cours"
            value={stats.dashboard?.pendingRequests || 0}
            icon="📋"
            color="pink"
          />
        </div>
      </div>
    </>
  );
}

// KPI Card Component
function KPICard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
}

// Stat Box Component
function StatBox({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

// Simple Line Chart (SVG-based)
function LineChart({ data, color = '#3B82F6' }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400">Pas de donnees</div>;
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - (d.count / maxValue) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(y => (
        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
      ))}
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Area */}
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  );
}

// Simple Pie Chart (SVG-based)
function PieChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-32 text-gray-400">Pas de donnees</div>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <div className="flex items-center justify-center h-32 text-gray-400">Pas de donnees</div>;
  }

  let currentAngle = -90;
  const segments = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const segment = {
      ...d,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: COLORS[i % COLORS.length],
    };
    currentAngle += angle;
    return segment;
  });

  const getPath = (startAngle, endAngle, radius = 40) => {
    const start = polarToCartesian(50, 50, radius, endAngle);
    const end = polarToCartesian(50, 50, radius, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
        {segments.map((seg, i) => (
          <path key={i} d={getPath(seg.startAngle, seg.endAngle)} fill={seg.color} />
        ))}
      </svg>
      <div className="flex-1 space-y-1">
        {data.slice(0, 5).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{d.label}</span>
            <span className="text-gray-900 dark:text-white font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function formatAction(action) {
  const labels = {
    DOCUMENT_UPLOADED: 'Document televerse',
    DOCUMENT_VIEWED: 'Document consulte',
    DOCUMENT_DOWNLOADED: 'Document telecharge',
    DOCUMENT_UPDATED: 'Document modifie',
    FOLDER_CREATED: 'Dossier cree',
    FOLDER_UPDATED: 'Dossier modifie',
    SIGNATURE_REQUESTED: 'Signature demandee',
    SIGNATURE_COMPLETED: 'Document signe',
    LOGIN: 'Connexion',
  };
  return labels[action] || action;
}
