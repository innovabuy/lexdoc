import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, List, GitBranch, LayoutGrid, ChevronRight, ChevronDown } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import './Folders.css';

// ============================================================
// Labels & config
// ============================================================

const STATUS_LABELS = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  PENDING: 'En attente',
  CLOSED: 'Fermé',
  ARCHIVED: 'Archivé',
};

const STATUS_ORDER = ['IN_PROGRESS', 'OPEN', 'PENDING', 'CLOSED', 'ARCHIVED'];

const STATUS_BORDER = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#3b82f6',
  PENDING: '#f59e0b',
  CLOSED: '#10b981',
  ARCHIVED: '#94a3b8',
};

const STATUS_COLORS = {
  OPEN: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-purple-100 text-purple-700',
};

const TYPE_LABELS = {
  LITIGATION: 'Contentieux',
  CONTRACT: 'Contrat',
  BUSINESS: 'Droit des affaires',
  FAMILY: 'Droit de la famille',
  REAL_ESTATE: 'Immobilier',
  LABOR: 'Droit du travail',
  INTELLECTUAL: 'Propriété intellectuelle',
  ADMINISTRATIVE: 'Administratif',
  CRIMINAL: 'Pénal',
  OTHER: 'Autre',
};

const TYPE_ICONS = {
  LITIGATION: '⚖️',
  CONTRACT: '📜',
  BUSINESS: '💼',
  FAMILY: '👨‍👩‍👧',
  REAL_ESTATE: '🏠',
  LABOR: '👷',
  INTELLECTUAL: '💡',
  ADMINISTRATIVE: '🏛️',
  CRIMINAL: '🔒',
  OTHER: '📁',
};

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Plus récent' },
  { value: 'createdAt-asc', label: 'Plus ancien' },
  { value: 'title-asc', label: 'Titre A-Z' },
  { value: 'title-desc', label: 'Titre Z-A' },
  { value: 'reference-asc', label: 'Référence A-Z' },
];

const GROUP_OPTIONS = [
  { value: 'status-type-nature', label: 'Statut > Type > Nature' },
  { value: 'type-nature', label: 'Type > Nature' },
  { value: 'client', label: 'Client' },
  { value: 'date', label: "Date d'ouverture" },
];

// ============================================================
// Helpers
// ============================================================

function getClientName(folder) {
  if (!folder.client) return 'Sans client';
  if (folder.client.companyName) return folder.client.companyName;
  return `${folder.client.firstName || ''} ${folder.client.lastName || ''}`.trim() || 'Sans nom';
}

function getNatureLabel(nature) {
  if (!nature) return 'Non classifié';
  return nature.charAt(0).toUpperCase() + nature.slice(1).replace(/_/g, ' ');
}

function getMonthYear(dateStr) {
  if (!dateStr) return 'Date inconnue';
  const d = new Date(dateStr);
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ============================================================
// Tree building — group folders into hierarchical nodes
// ============================================================

function buildGroupedTree(folders, groupBy) {
  if (groupBy === 'status-type-nature') return buildStatusTypeNatureTree(folders);
  if (groupBy === 'type-nature') return buildTypeNatureTree(folders);
  if (groupBy === 'client') return buildClientTree(folders);
  if (groupBy === 'date') return buildDateTree(folders);
  return [];
}

function buildStatusTypeNatureTree(folders) {
  const byStatus = {};
  folders.forEach(f => {
    const s = f.status || 'OTHER';
    if (!byStatus[s]) byStatus[s] = [];
    byStatus[s].push(f);
  });

  return STATUS_ORDER
    .filter(s => byStatus[s]?.length > 0)
    .map(status => ({
      key: `status-${status}`,
      label: STATUS_LABELS[status] || status,
      count: byStatus[status].length,
      borderColor: STATUS_BORDER[status],
      icon: '📂',
      children: buildTypeSubtree(byStatus[status], STATUS_BORDER[status]),
    }));
}

function buildTypeSubtree(folders, borderColor) {
  const byType = {};
  folders.forEach(f => {
    const t = f.type || 'OTHER';
    if (!byType[t]) byType[t] = [];
    byType[t].push(f);
  });

  return Object.keys(byType)
    .sort((a, b) => (TYPE_LABELS[a] || a).localeCompare(TYPE_LABELS[b] || b))
    .map(type => ({
      key: `type-${type}`,
      label: TYPE_LABELS[type] || type,
      count: byType[type].length,
      borderColor,
      icon: TYPE_ICONS[type] || '📁',
      children: buildNatureSubtree(byType[type], borderColor),
    }));
}

function buildNatureSubtree(folders, borderColor) {
  const byNature = {};
  folders.forEach(f => {
    const n = f.nature || '_none';
    if (!byNature[n]) byNature[n] = [];
    byNature[n].push(f);
  });

  const natures = Object.keys(byNature).sort((a, b) => {
    if (a === '_none') return 1;
    if (b === '_none') return -1;
    return a.localeCompare(b);
  });

  // If only one group and it's uncategorized, skip the nature level
  if (natures.length === 1 && natures[0] === '_none') {
    return byNature['_none'].map(f => ({ key: f.id, folder: f, borderColor }));
  }

  return natures.map(nature => ({
    key: `nature-${nature}`,
    label: getNatureLabel(nature === '_none' ? null : nature),
    count: byNature[nature].length,
    borderColor,
    icon: '📁',
    children: byNature[nature].map(f => ({ key: f.id, folder: f, borderColor })),
  }));
}

function buildTypeNatureTree(folders) {
  const byType = {};
  folders.forEach(f => {
    const t = f.type || 'OTHER';
    if (!byType[t]) byType[t] = [];
    byType[t].push(f);
  });

  return Object.keys(byType)
    .sort((a, b) => (TYPE_LABELS[a] || a).localeCompare(TYPE_LABELS[b] || b))
    .map(type => {
      const color = '#6366f1';
      return {
        key: `type-${type}`,
        label: TYPE_LABELS[type] || type,
        count: byType[type].length,
        borderColor: color,
        icon: TYPE_ICONS[type] || '📁',
        children: buildNatureSubtree(byType[type], color),
      };
    });
}

function buildClientTree(folders) {
  const byClient = {};
  folders.forEach(f => {
    const name = getClientName(f);
    if (!byClient[name]) byClient[name] = [];
    byClient[name].push(f);
  });

  return Object.keys(byClient)
    .sort()
    .map(name => ({
      key: `client-${name}`,
      label: name,
      count: byClient[name].length,
      borderColor: '#8b5cf6',
      icon: '👤',
      children: byClient[name].map(f => ({ key: f.id, folder: f, borderColor: '#8b5cf6' })),
    }));
}

function buildDateTree(folders) {
  const byMonth = {};
  folders.forEach(f => {
    const m = getMonthYear(f.openedAt || f.createdAt);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(f);
  });

  const sorted = Object.keys(byMonth).sort((a, b) => {
    const da = byMonth[a][0]?.openedAt || byMonth[a][0]?.createdAt;
    const db = byMonth[b][0]?.openedAt || byMonth[b][0]?.createdAt;
    return new Date(db) - new Date(da);
  });

  return sorted.map(month => ({
    key: `date-${month}`,
    label: month,
    count: byMonth[month].length,
    borderColor: '#0ea5e9',
    icon: '📅',
    children: byMonth[month].map(f => ({ key: f.id, folder: f, borderColor: '#0ea5e9' })),
  }));
}

// ============================================================
// TreeGroupNode — a grouping node (status, type, nature)
// ============================================================

function TreeGroupNode({ node, expanded, onToggle, onNavigate }) {
  const isOpen = !!expanded[node.key];

  return (
    <div className="tree-node">
      <div
        className="tree-node-header"
        onClick={() => onToggle(node.key)}
        style={{ borderLeftColor: node.borderColor || '#e2e8f0' }}
      >
        {isOpen
          ? <ChevronDown size={16} className="tree-node-chevron" />
          : <ChevronRight size={16} className="tree-node-chevron" />
        }
        <span className="tree-node-icon">{node.icon}</span>
        <span className="tree-node-label">{node.label}</span>
        <span className="tree-node-count">({node.count})</span>
      </div>

      {isOpen && (
        <div className="tree-node-children">
          {node.children?.map(child =>
            child.folder ? (
              <TreeFolderItem key={child.key} item={child} onNavigate={onNavigate} />
            ) : (
              <TreeGroupNode key={child.key} node={child} expanded={expanded} onToggle={onToggle} onNavigate={onNavigate} />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TreeFolderItem — a leaf node (actual folder)
// ============================================================

function TreeFolderItem({ item, onNavigate }) {
  const f = item.folder;
  const clientName = getClientName(f);
  const docCount = f.documentsCount ?? f._count?.documents ?? 0;

  return (
    <div
      className="tree-folder-item"
      onClick={() => onNavigate(f.id)}
      style={{ borderLeftColor: item.borderColor || '#e2e8f0' }}
    >
      <span className="tree-folder-icon">📋</span>
      <div className="tree-folder-info">
        <div className="tree-folder-title-row">
          <span className="tree-folder-title">{f.title}</span>
          <span className={`tree-folder-badge tree-folder-badge--${f.status?.toLowerCase()}`}>
            {STATUS_LABELS[f.status] || f.status}
          </span>
        </div>
        <div className="tree-folder-meta">
          <span className="tree-folder-ref">{f.reference}</span>
          {clientName !== 'Sans client' && (
            <>
              <span className="tree-folder-sep">—</span>
              <span>{clientName}</span>
            </>
          )}
          <span className="tree-folder-sep">—</span>
          <span>{docCount} doc{docCount !== 1 ? 's' : ''}</span>
          <span className="tree-folder-sep">—</span>
          <span>Ouvert {new Date(f.openedAt || f.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export default function Folders() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // Data
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // View
  const [viewMode, setViewMode] = useState('tree');
  const [groupBy, setGroupBy] = useState('status-type-nature');
  const [expanded, setExpanded] = useState({});

  // Create modal
  const [clients, setClients] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', type: 'OTHER', status: 'OPEN', clientId: '',
  });
  const [saving, setSaving] = useState(false);

  // ── Fetch paginated (list/grid) ──
  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('pageSize', pageSize);
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const [sortField, sortDir] = sortBy.split('-');
      params.set('sortBy', sortField);
      params.set('sortOrder', sortDir);

      const { data } = await api.get(`/folders?${params.toString()}`);
      setFolders(data.data || []);
      setTotal(data.pagination?.total || data.data?.length || 0);
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, sortBy]);

  // ── Fetch all (tree) ──
  const fetchAllFolders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('pageSize', '9999');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const { data } = await api.get(`/folders?${params.toString()}`);
      setAllFolders(data.data || []);
      setTotal(data.pagination?.total || data.data?.length || 0);
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    if (viewMode === 'tree') fetchAllFolders();
    else fetchFolders();
  }, [viewMode, fetchFolders, fetchAllFolders]);

  useEffect(() => {
    api.get('/clients?pageSize=100').then(({ data }) => {
      setClients(data.data || []);
    }).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Build tree ──
  const tree = useMemo(() => buildGroupedTree(allFolders, groupBy), [allFolders, groupBy]);

  // Default: all nodes collapsed when tree changes
  useEffect(() => {
    setExpanded({});
  }, [tree]);

  const toggleNode = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Create ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    try {
      setSaving(true);
      await api.post('/folders', {
        ...createForm,
        clientId: createForm.clientId || undefined,
      });
      success('Dossier créé avec succès');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', type: 'OTHER', status: 'OPEN', clientId: '' });
      if (viewMode === 'tree') fetchAllFolders();
      else fetchFolders();
    } catch (err) {
      showError(err.response?.data?.error?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="folders-page">
      {/* Header */}
      <div className="folders-header">
        <div>
          <h1 className="folders-title">Dossiers</h1>
          <p className="folders-subtitle">{total} dossier{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="folders-btn-primary" onClick={() => navigate('/dossiers/nouveau')}>
          <Plus size={16} /> Nouveau dossier
        </button>
      </div>

      {/* Toolbar */}
      <div className="folders-toolbar">
        <div className="folders-toolbar-row">
          <div className="folders-search-wrap">
            <Search size={16} className="folders-search-icon" />
            <input
              type="text"
              placeholder="Rechercher par titre, référence..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="folders-search-input"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="folders-select"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="folders-select"
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {viewMode !== 'tree' && (
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="folders-select">
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          {viewMode === 'tree' && (
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="folders-select">
              {GROUP_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          <div className="folders-view-wrapper">
            <span className="folders-view-label">
              {viewMode === 'tree' ? 'Arborescence' : viewMode === 'list' ? 'Liste' : 'Grille'}
            </span>
            <div className="folders-view-toggle">
              <button
                onClick={() => setViewMode('tree')}
                className={`folders-view-btn ${viewMode === 'tree' ? 'folders-view-btn--active' : ''}`}
                title="Arborescence"
              >
                <GitBranch size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`folders-view-btn ${viewMode === 'list' ? 'folders-view-btn--active' : ''}`}
                title="Liste"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`folders-view-btn ${viewMode === 'grid' ? 'folders-view-btn--active' : ''}`}
                title="Grille"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="folders-loading">Chargement...</div>
      ) : viewMode === 'tree' ? (
        /* ── Tree View ── */
        allFolders.length === 0 ? (
          <div className="folders-empty">
            <div className="folders-empty-icon">📁</div>
            <h3>Aucun dossier</h3>
            <p>{search || statusFilter || typeFilter ? 'Aucun résultat pour ces filtres' : 'Créez votre premier dossier'}</p>
            {!search && !statusFilter && !typeFilter && (
              <button className="folders-btn-primary" style={{ margin: '16px auto 0' }} onClick={() => navigate('/dossiers/nouveau')}>
                + Nouveau dossier
              </button>
            )}
          </div>
        ) : (
          <div className="folders-tree">
            {tree.map(node => (
              <TreeGroupNode
                key={node.key}
                node={node}
                expanded={expanded}
                onToggle={toggleNode}
                onNavigate={(id) => navigate(`/dossiers/${id}`)}
              />
            ))}
          </div>
        )
      ) : folders.length === 0 ? (
        /* ── Empty state (list/grid) ── */
        <div className="folders-empty">
          <div className="folders-empty-icon">📁</div>
          <h3>Aucun dossier</h3>
          <p>{search || statusFilter || typeFilter ? 'Aucun résultat pour ces filtres' : 'Créez votre premier dossier'}</p>
          {!search && !statusFilter && !typeFilter && (
            <button className="folders-btn-primary" style={{ margin: '16px auto 0' }} onClick={() => navigate('/dossiers/nouveau')}>
              + Nouveau dossier
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => navigate(`/dossiers/${folder.id}`)}
              className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: (folder.color || '#3B82F6') + '20' }}
                >
                  📁
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[folder.status] || 'bg-gray-100'}`}>
                  {STATUS_LABELS[folder.status] || folder.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{folder.title}</h3>
              <p className="text-sm text-gray-500 mb-2">Réf: {folder.reference}</p>
              {folder.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{folder.description}</p>
              )}
              <div className="pt-3 border-t flex justify-between items-center text-xs text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded">{TYPE_LABELS[folder.type] || folder.type}</span>
                <span>{new Date(folder.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              {getClientName(folder) !== 'Sans client' && (
                <div className="mt-2 text-xs text-gray-500">
                  Client : {getClientName(folder)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-4 py-3">Dossier</th>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <tr
                  key={folder.id}
                  onClick={() => navigate(`/dossiers/${folder.id}`)}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-sm"
                        style={{ backgroundColor: (folder.color || '#3B82F6') + '20' }}
                      >
                        📁
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{folder.title}</p>
                        {folder.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{folder.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{folder.reference}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{TYPE_LABELS[folder.type] || folder.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[folder.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[folder.status] || folder.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getClientName(folder) !== 'Sans client' ? getClientName(folder) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(folder.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (list/grid only) */}
      {viewMode !== 'tree' && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Nouveau dossier</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre du dossier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Description du dossier"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    value={createForm.clientId}
                    onChange={(e) => setCreateForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Aucun client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || `${c.firstName} ${c.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Création...' : 'Créer le dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
