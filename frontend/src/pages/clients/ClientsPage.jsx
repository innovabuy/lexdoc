import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronUp, ChevronDown, Users, List, Type, FolderOpen, ChevronRight, Folder } from 'lucide-react';
import { getClients } from '../../services/clientsApi';
import api from '../../services/api';
import ClientQuickCreate from '../../components/clients/ClientQuickCreate';
import './ClientsPage.css';

const TYPE_LABELS = { INDIVIDUAL: 'PP', COMPANY: 'PM', ASSOCIATION: 'Asso' };
const TYPE_COLORS = {
  INDIVIDUAL: 'badge--blue',
  COMPANY: 'badge--purple',
  ASSOCIATION: 'badge--orange',
};

const FOLDER_NATURE_LABELS = {
  cession: 'Cession',
  contentieux: 'Contentieux',
  conseil: 'Conseil',
  creation_societe: 'Droit des sociétés',
  agoa: 'AGOA',
  LITIGATION: 'Contentieux',
  CONTRACT: 'Contrats',
  BUSINESS: 'Affaires',
  FAMILY: 'Famille',
  REAL_ESTATE: 'Immobilier',
  LABOR: 'Travail',
  INTELLECTUAL: 'Propriété intellectuelle',
  ADMINISTRATIVE: 'Administratif',
  CRIMINAL: 'Pénal',
  OTHER: 'Autre',
};

function CompletenessBar({ percent, level }) {
  const color =
    level === 'complet' ? '#10b981' : level === 'incomplet' ? '#f59e0b' : '#ef4444';
  return (
    <div className="completeness-cell">
      <div className="completeness-minibar">
        <div
          className="completeness-minibar-fill"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      <span className="completeness-percent" style={{ color }}>
        {percent}%
      </span>
    </div>
  );
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sort, setSort] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list | alpha | folder
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const debounceRef = useRef(null);

  // Fetch paginated clients (list view)
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getClients({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        sort: sort || undefined,
        order: sortOrder,
        page,
        pageSize: 20,
      });
      setClients(result.data);
      setPagination(result.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, sort, sortOrder, page]);

  // Fetch ALL clients with folders (tree views)
  const fetchAllClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '9999');
      params.set('includeFolders', 'true');
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);

      const { data } = await api.get(`/clients?${params.toString()}`);
      setAllClients(data.data || []);
    } catch {
      setAllClients([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchClients();
    } else {
      fetchAllClients();
    }
  }, [viewMode, fetchClients, fetchAllClients]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 300);
  };

  const handleSort = (field) => {
    if (sort === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sort !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const clientName = (c) =>
    c.type === 'INDIVIDUAL'
      ? `${c.lastName || ''} ${c.firstName || ''}`.trim()
      : c.companyName || '—';

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Alphabetical grouping ──────────────────────────────────────
  const alphaGroups = useMemo(() => {
    if (viewMode !== 'alpha') return {};
    const groups = {};
    allClients.forEach((c) => {
      const name = clientName(c);
      const letter = (name.charAt(0) || '#').toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    });
    const sorted = {};
    Object.keys(groups).sort().forEach((k) => {
      sorted[k] = groups[k].sort((a, b) => clientName(a).localeCompare(clientName(b)));
    });
    return sorted;
  }, [allClients, viewMode]);

  // ─── Folder nature/type grouping ────────────────────────────────
  const folderGroups = useMemo(() => {
    if (viewMode !== 'folder') return {};
    const groups = {};
    allClients.forEach((c) => {
      const folders = c.folders || [];
      if (folders.length === 0) {
        const key = '_SANS_DOSSIER';
        if (!groups[key]) groups[key] = [];
        groups[key].push({ client: c, folder: null });
      } else {
        folders.forEach((f) => {
          const key = f.nature || f.type || 'OTHER';
          if (!groups[key]) groups[key] = [];
          groups[key].push({ client: c, folder: f });
        });
      }
    });
    return groups;
  }, [allClients, viewMode]);

  // ─── Render: Alphabetical view ──────────────────────────────────
  const renderAlphaView = () => {
    const letters = Object.keys(alphaGroups);
    if (loading) {
      return <div className="clients-tree-loading"><div className="fdp-spinner" /></div>;
    }
    if (letters.length === 0) {
      return (
        <div className="clients-tree-empty">
          <Users size={32} style={{ color: '#cbd5e1' }} />
          <p>Aucun client trouvé</p>
        </div>
      );
    }

    return (
      <div className="clients-tree-view">
        {letters.map((letter) => {
          const isOpen = !collapsedGroups[`alpha-${letter}`];
          const group = alphaGroups[letter];
          return (
            <div key={letter} className="tree-group">
              <button className="tree-group-header" onClick={() => toggleGroup(`alpha-${letter}`)}>
                <ChevronRight size={16} className={`tree-group-chevron ${isOpen ? 'tree-group-chevron--open' : ''}`} />
                <span className="tree-group-letter">{letter}</span>
                <span className="tree-group-count">({group.length})</span>
              </button>
              {isOpen && (
                <div className="tree-group-body">
                  {group.map((c) => (
                    <div
                      key={c.id}
                      className="tree-client-row"
                      onClick={() => navigate(`/clients/${c.id}`)}
                    >
                      <span className="tree-client-icon">📋</span>
                      <span className="tree-client-name">{clientName(c)}</span>
                      <span className={`badge ${TYPE_COLORS[c.type] || 'badge--gray'}`}>
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                      {c.email && <span className="tree-client-email">{c.email}</span>}
                      <span className="tree-client-folders">
                        {c.totalFolderCount || 0} dossier{(c.totalFolderCount || 0) !== 1 ? 's' : ''}
                      </span>
                      {c.completeness && (
                        <CompletenessBar percent={c.completeness.percent} level={c.completeness.level} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render: Folder type/nature view ────────────────────────────
  const renderFolderView = () => {
    const keys = Object.keys(folderGroups);
    if (loading) {
      return <div className="clients-tree-loading"><div className="fdp-spinner" /></div>;
    }
    if (keys.length === 0) {
      return (
        <div className="clients-tree-empty">
          <Users size={32} style={{ color: '#cbd5e1' }} />
          <p>Aucun client trouvé</p>
        </div>
      );
    }

    const sortedKeys = keys.sort((a, b) => {
      if (a === '_SANS_DOSSIER') return 1;
      if (b === '_SANS_DOSSIER') return -1;
      return (FOLDER_NATURE_LABELS[a] || a).localeCompare(FOLDER_NATURE_LABELS[b] || b);
    });

    return (
      <div className="clients-tree-view">
        {sortedKeys.map((typeKey) => {
          const isOpen = !collapsedGroups[`folder-${typeKey}`];
          const items = folderGroups[typeKey];
          const label = typeKey === '_SANS_DOSSIER' ? 'Sans dossier' : (FOLDER_NATURE_LABELS[typeKey] || typeKey);
          const uniqueClients = new Set(items.map((i) => i.client.id));

          return (
            <div key={typeKey} className="tree-group">
              <button className="tree-group-header" onClick={() => toggleGroup(`folder-${typeKey}`)}>
                <ChevronRight size={16} className={`tree-group-chevron ${isOpen ? 'tree-group-chevron--open' : ''}`} />
                <Folder size={16} className="tree-group-folder-icon" />
                <span className="tree-group-letter">{label}</span>
                <span className="tree-group-count">({uniqueClients.size} client{uniqueClients.size !== 1 ? 's' : ''})</span>
              </button>
              {isOpen && (
                <div className="tree-group-body">
                  {items.map((item, idx) => (
                    <div
                      key={`${item.client.id}-${item.folder?.id || idx}`}
                      className="tree-client-row"
                      onClick={() => navigate(`/clients/${item.client.id}`)}
                    >
                      <span className="tree-client-icon">📋</span>
                      <span className="tree-client-name">{clientName(item.client)}</span>
                      {item.folder && (
                        <>
                          <span className="tree-client-dash">—</span>
                          <span className="tree-client-folder-title">{item.folder.title}</span>
                          <span className={`badge ${
                            item.folder.status === 'OPEN' ? 'badge--green' :
                            item.folder.status === 'IN_PROGRESS' ? 'badge--blue' :
                            item.folder.status === 'ARCHIVED' ? 'badge--yellow' :
                            'badge--gray'
                          }`}>
                            {item.folder.status}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render: List view (table) ──────────────────────────────────
  const renderListView = () => (
    <>
      <div className="clients-table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th className="clients-th clients-th--sortable" onClick={() => handleSort('lastName')}>
                Nom <SortIcon field="lastName" />
              </th>
              <th className="clients-th">Type</th>
              <th className="clients-th clients-th--sortable" onClick={() => handleSort('email')}>
                Email <SortIcon field="email" />
              </th>
              <th className="clients-th">Téléphone</th>
              <th className="clients-th" style={{ textAlign: 'center' }}>Dossiers</th>
              <th className="clients-th" style={{ textAlign: 'center' }}>Complétude</th>
            </tr>
          </thead>
          <tbody>
            {loading && clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty">Chargement...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty">
                  <Users size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
                  <div>Aucun client trouvé</div>
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr
                  key={c.id}
                  className="clients-row"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <td className="clients-td clients-td--name">{clientName(c)}</td>
                  <td className="clients-td">
                    <span className={`badge ${TYPE_COLORS[c.type] || 'badge--gray'}`}>
                      {TYPE_LABELS[c.type] || c.type}
                    </span>
                  </td>
                  <td className="clients-td clients-td--email">{c.email || '—'}</td>
                  <td className="clients-td">{c.phone || c.mobile || '—'}</td>
                  <td className="clients-td" style={{ textAlign: 'center' }}>
                    {c.activeFolderCount || 0}
                  </td>
                  <td className="clients-td" style={{ textAlign: 'center' }}>
                    {c.completeness && (
                      <CompletenessBar percent={c.completeness.percent} level={c.completeness.level} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="clients-pagination">
          <button
            className="clients-pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </button>
          <span className="clients-pagination-info">
            Page {page} / {pagination.totalPages}
          </span>
          <button
            className="clients-pagination-btn"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="clients-page">
      <div className="clients-header">
        <div>
          <h1 className="clients-title">Clients</h1>
          <p className="clients-count">
            {viewMode === 'list'
              ? `${pagination.total} client${pagination.total !== 1 ? 's' : ''}`
              : `${allClients.length} client${allClients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="clients-header-actions">
          <div className="clients-view-toggle">
            <button
              className={`clients-view-btn ${viewMode === 'list' ? 'clients-view-btn--active' : ''}`}
              onClick={() => { setViewMode('list'); setCollapsedGroups({}); }}
              title="Vue liste"
            >
              <List size={18} />
            </button>
            <button
              className={`clients-view-btn ${viewMode === 'alpha' ? 'clients-view-btn--active' : ''}`}
              onClick={() => { setViewMode('alpha'); setCollapsedGroups({}); }}
              title="Vue alphabétique"
            >
              <Type size={18} />
            </button>
            <button
              className={`clients-view-btn ${viewMode === 'folder' ? 'clients-view-btn--active' : ''}`}
              onClick={() => { setViewMode('folder'); setCollapsedGroups({}); }}
              title="Vue par dossier"
            >
              <FolderOpen size={18} />
            </button>
          </div>
          <button className="clients-create-btn" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Nouveau client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="clients-filters">
        <div className="clients-search">
          <Search size={18} className="clients-search-icon" />
          <input
            className="clients-search-input"
            placeholder="Rechercher un client..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <select
          className="clients-filter-select"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">Type : Tous</option>
          <option value="INDIVIDUAL">Personne physique</option>
          <option value="COMPANY">Personne morale</option>
          <option value="ASSOCIATION">Association</option>
        </select>
        <select
          className="clients-filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">Statut : Tous</option>
          <option value="active">Actifs</option>
          <option value="archived">Archivés</option>
        </select>
      </div>

      {/* Content */}
      {viewMode === 'list' ? renderListView() : viewMode === 'alpha' ? renderAlphaView() : renderFolderView()}

      {/* Quick Create Modal */}
      <ClientQuickCreate
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          if (viewMode === 'list') fetchClients();
          else fetchAllClients();
        }}
      />
    </div>
  );
}
