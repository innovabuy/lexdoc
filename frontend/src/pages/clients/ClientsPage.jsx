import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronUp, ChevronDown, Users, List, GitBranch, ChevronRight, Folder, FileText } from 'lucide-react';
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
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sort, setSort] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState('tree');
  const [expandedClients, setExpandedClients] = useState({});
  const [clientFolders, setClientFolders] = useState({});
  const [loadingFolders, setLoadingFolders] = useState({});
  const debounceRef = useRef(null);

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

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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

  const toggleClient = async (clientId) => {
    const isExpanding = !expandedClients[clientId];
    setExpandedClients(prev => ({ ...prev, [clientId]: isExpanding }));

    if (isExpanding && !clientFolders[clientId]) {
      setLoadingFolders(prev => ({ ...prev, [clientId]: true }));
      try {
        const { data } = await api.get(`/clients/${clientId}/folders`);
        setClientFolders(prev => ({ ...prev, [clientId]: data.data || [] }));
      } catch {
        setClientFolders(prev => ({ ...prev, [clientId]: [] }));
      }
      setLoadingFolders(prev => ({ ...prev, [clientId]: false }));
    }
  };

  return (
    <div className="clients-page">
      <div className="clients-header">
        <div>
          <h1 className="clients-title">Clients</h1>
          <p className="clients-count">{pagination.total} client{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="clients-header-actions">
          <div className="clients-view-toggle">
            <button
              className={`clients-view-btn ${viewMode === 'list' ? 'clients-view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vue liste"
            >
              <List size={18} />
            </button>
            <button
              className={`clients-view-btn ${viewMode === 'tree' ? 'clients-view-btn--active' : ''}`}
              onClick={() => setViewMode('tree')}
              title="Vue hierarchique"
            >
              <GitBranch size={18} />
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

      {/* Table / Tree View */}
      {viewMode === 'list' ? (
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
      ) : (
        <div className="clients-tree-view">
          {loading && clients.length === 0 ? (
            <div className="clients-tree-loading"><div className="fdp-spinner" /></div>
          ) : clients.length === 0 ? (
            <div className="clients-tree-empty">
              <Users size={32} style={{ color: '#cbd5e1' }} />
              <p>Aucun client trouve</p>
            </div>
          ) : (
            clients.map((c) => {
              const name = clientName(c);
              const isExpanded = expandedClients[c.id];
              const folders = clientFolders[c.id] || [];
              const foldersLoading = loadingFolders[c.id];
              const initials = name.substring(0, 2).toUpperCase();
              const completeness = c.completeness;

              return (
                <div key={c.id} className={`client-tree-card ${isExpanded ? 'client-tree-card--expanded' : ''}`}>
                  <div className="client-tree-header" onClick={() => toggleClient(c.id)}>
                    <div className="client-tree-left">
                      <ChevronRight size={16} className={`client-tree-chevron ${isExpanded ? 'client-tree-chevron--open' : ''}`} />
                      <div className="client-tree-avatar">
                        {initials}
                      </div>
                      <div className="client-tree-info">
                        <div className="client-tree-name-row">
                          <span className="client-tree-name" onClick={(e) => { e.stopPropagation(); navigate(`/clients/${c.id}`); }}>
                            {name}
                          </span>
                          <span className={`badge ${TYPE_COLORS[c.type] || 'badge--gray'}`}>
                            {TYPE_LABELS[c.type] || c.type}
                          </span>
                          {completeness && (
                            <div className="client-tree-completeness">
                              <div className="client-tree-bar">
                                <div className="client-tree-bar-fill" style={{
                                  width: `${completeness.percent}%`,
                                  background: completeness.level === 'complet' ? '#10b981' : completeness.level === 'incomplet' ? '#f59e0b' : '#ef4444'
                                }} />
                              </div>
                              <span className="client-tree-percent" style={{
                                color: completeness.level === 'complet' ? '#10b981' : completeness.level === 'incomplet' ? '#f59e0b' : '#ef4444'
                              }}>
                                {completeness.percent}%
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="client-tree-sub">
                          {c.email || ''}{c.email && (c.phone || c.mobile) ? ' — ' : ''}{c.phone || c.mobile || ''}
                          {' — '}{c.activeFolderCount || 0} dossier{(c.activeFolderCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="client-tree-body">
                      {foldersLoading ? (
                        <div className="client-tree-folder-loading">Chargement des dossiers...</div>
                      ) : folders.length === 0 ? (
                        <div className="client-tree-no-folders">Aucun dossier</div>
                      ) : (
                        <div className="client-tree-folders">
                          {folders.map((folder, fi) => (
                            <div key={folder.id} className={`client-tree-folder ${fi === folders.length - 1 ? 'client-tree-folder--last' : ''}`}>
                              <span className="client-tree-folder-line" />
                              <div className="client-tree-folder-content" onClick={() => navigate(`/dossiers/${folder.id}`)}>
                                <Folder size={16} className="client-tree-folder-icon" />
                                <div className="client-tree-folder-info">
                                  <span className="client-tree-folder-title">{folder.title}</span>
                                  <span className="client-tree-folder-meta">
                                    {folder.reference}{folder.type ? ` — ${folder.type}` : ''} — {folder.status || 'OPEN'}
                                    {folder._count?.documents !== undefined ? ` — ${folder._count.documents} doc${folder._count.documents !== 1 ? 's' : ''}` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

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

      {/* Quick Create Modal */}
      <ClientQuickCreate
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => fetchClients()}
      />
    </div>
  );
}
