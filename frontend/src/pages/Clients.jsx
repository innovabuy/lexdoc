import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

const typeLabels = {
  INDIVIDUAL: 'Particulier',
  COMPANY: 'Société',
  ASSOCIATION: 'Association',
};

const typeColors = {
  INDIVIDUAL: 'bg-blue-100 text-blue-700',
  COMPANY: 'bg-purple-100 text-purple-700',
  ASSOCIATION: 'bg-orange-100 text-orange-700',
};

const folderTypeLabels = {
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

const folderStatusLabels = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  CLOSED: 'Fermé',
  ARCHIVED: 'Archivé',
};

const folderStatusColors = {
  OPEN: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-yellow-100 text-yellow-700',
};

const emptyForm = {
  type: 'INDIVIDUAL',
  firstName: '',
  lastName: '',
  companyName: '',
  siret: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  postalCode: '',
  city: '',
  notes: '',
};

const VIEW_MODES = [
  { key: 'list', label: 'Liste' },
  { key: 'alpha', label: 'Alphabétique' },
  { key: 'folder', label: 'Par dossier' },
];

export default function Clients() {
  const { success, error: showError } = useToast();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [viewMode, setViewMode] = useState('list');

  // Collapsed state for tree views
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch paginated clients for list view
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('pageSize', pageSize);
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);

      const { data } = await api.get(`/clients?${params.toString()}`);
      setClients(data.data || []);
      setTotal(data.pagination?.total || data.data?.length || 0);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  // Fetch ALL clients with folders for tree views
  const fetchAllClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', 1);
      params.set('pageSize', 9999);
      params.set('includeFolders', 'true');
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);

      const { data } = await api.get(`/clients?${params.toString()}`);
      setAllClients(data.data || []);
    } catch (err) {
      console.error('Error fetching all clients:', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchClients();
    } else {
      fetchAllClients();
    }
  }, [viewMode, fetchClients, fetchAllClients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const getClientName = (client) => {
    if (client.type === 'COMPANY' || client.type === 'ASSOCIATION') {
      return client.companyName || '';
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim();
  };

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Alphabetical grouping ─────────────────────────────────────────
  const alphaGroups = useMemo(() => {
    if (viewMode !== 'alpha') return {};
    const groups = {};
    allClients.forEach((client) => {
      const name = getClientName(client);
      const letter = name.charAt(0).toUpperCase() || '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(client);
    });
    // Sort letters
    const sorted = {};
    Object.keys(groups).sort().forEach((k) => {
      sorted[k] = groups[k].sort((a, b) =>
        getClientName(a).localeCompare(getClientName(b))
      );
    });
    return sorted;
  }, [allClients, viewMode]);

  // ─── Folder type grouping ─────────────────────────────────────────
  const folderGroups = useMemo(() => {
    if (viewMode !== 'folder') return {};
    const groups = {};
    allClients.forEach((client) => {
      const folders = client.folders || [];
      if (folders.length === 0) {
        const key = 'SANS_DOSSIER';
        if (!groups[key]) groups[key] = [];
        groups[key].push({ client, folder: null });
      } else {
        folders.forEach((folder) => {
          const key = folder.type || 'OTHER';
          if (!groups[key]) groups[key] = [];
          groups[key].push({ client, folder });
        });
      }
    });
    return groups;
  }, [allClients, viewMode]);

  // ─── Modal handlers ────────────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalMode('create');
    setShowModal(true);
  };

  const openEdit = (client) => {
    setForm({
      type: client.type || 'INDIVIDUAL',
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      companyName: client.companyName || '',
      siret: client.siret || '',
      email: client.email || '',
      phone: client.phone || '',
      mobile: client.mobile || '',
      address: client.address || '',
      postalCode: client.postalCode || '',
      city: client.city || '',
      notes: client.notes || '',
    });
    setEditingId(client.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const openView = async (client) => {
    try {
      const { data } = await api.get(`/clients/${client.id}`);
      setSelectedClient(data.data || data);
      setModalMode('view');
      setShowModal(true);
    } catch {
      setSelectedClient(client);
      setModalMode('view');
      setShowModal(true);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (payload.type === 'INDIVIDUAL') {
        delete payload.companyName;
        delete payload.siret;
      }

      if (modalMode === 'edit') {
        await api.put(`/clients/${editingId}`, payload);
        success('Client mis à jour');
      } else {
        await api.post('/clients', payload);
        success('Client créé avec succès');
      }
      setShowModal(false);
      if (viewMode === 'list') fetchClients();
      else fetchAllClients();
    } catch (err) {
      showError(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clientId) => {
    try {
      await api.delete(`/clients/${clientId}`);
      success('Client supprimé');
      setShowDeleteConfirm(null);
      if (viewMode === 'list') fetchClients();
      else fetchAllClients();
    } catch (err) {
      showError(err.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const isCompanyType = form.type === 'COMPANY' || form.type === 'ASSOCIATION';

  // ─── View toggle ───────────────────────────────────────────────────
  const ViewToggle = () => (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      {VIEW_MODES.map((mode) => (
        <button
          key={mode.key}
          onClick={() => { setViewMode(mode.key); setCollapsedGroups({}); }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === mode.key
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );

  // ─── Client mini row for tree views ────────────────────────────────
  const ClientTreeRow = ({ client, extra }) => (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-semibold text-sm">
            {getClientName(client).charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm truncate">
              {getClientName(client)}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[client.type] || 'bg-gray-100'}`}>
              {typeLabels[client.type] || client.type}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {client.email && <span>{client.email}</span>}
            {extra}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {client.totalFolderCount > 0 && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {client.totalFolderCount} dossier{client.totalFolderCount > 1 ? 's' : ''}
          </span>
        )}
        {client.hasExternet && (
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
            Extranet
          </span>
        )}
        <button
          onClick={() => openView(client)}
          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Voir
        </button>
      </div>
    </div>
  );

  // ─── Collapsible group header ──────────────────────────────────────
  const GroupHeader = ({ groupKey, label, count, color }) => {
    const isOpen = !collapsedGroups[groupKey];
    return (
      <button
        onClick={() => toggleGroup(groupKey)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {color && (
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        )}
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </button>
    );
  };

  // ─── Render alphabetical view ──────────────────────────────────────
  const renderAlphaView = () => {
    const letters = Object.keys(alphaGroups);
    if (letters.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900">Aucun client</h3>
          <p className="text-gray-500 mt-1">
            {search || typeFilter ? 'Aucun résultat pour ces filtres' : 'Ajoutez votre premier client'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {letters.map((letter) => (
          <div key={letter} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <GroupHeader
              groupKey={`alpha-${letter}`}
              label={letter}
              count={alphaGroups[letter].length}
              color="bg-blue-500"
            />
            {!collapsedGroups[`alpha-${letter}`] && (
              <div className="border-t border-gray-100 px-2 py-1">
                {alphaGroups[letter].map((client) => (
                  <ClientTreeRow key={client.id} client={client} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ─── Render folder type view ───────────────────────────────────────
  const renderFolderView = () => {
    const keys = Object.keys(folderGroups);
    if (keys.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900">Aucun client</h3>
          <p className="text-gray-500 mt-1">
            {search || typeFilter ? 'Aucun résultat pour ces filtres' : 'Ajoutez votre premier client'}
          </p>
        </div>
      );
    }

    // Sort: named types first, SANS_DOSSIER last
    const sortedKeys = keys.sort((a, b) => {
      if (a === 'SANS_DOSSIER') return 1;
      if (b === 'SANS_DOSSIER') return -1;
      return (folderTypeLabels[a] || a).localeCompare(folderTypeLabels[b] || b);
    });

    const folderTypeColors = {
      LITIGATION: 'bg-red-500',
      CONTRACT: 'bg-blue-500',
      BUSINESS: 'bg-purple-500',
      FAMILY: 'bg-pink-500',
      REAL_ESTATE: 'bg-amber-500',
      LABOR: 'bg-orange-500',
      INTELLECTUAL: 'bg-cyan-500',
      ADMINISTRATIVE: 'bg-indigo-500',
      CRIMINAL: 'bg-rose-500',
      OTHER: 'bg-gray-500',
      SANS_DOSSIER: 'bg-gray-300',
    };

    return (
      <div className="space-y-1">
        {sortedKeys.map((typeKey) => {
          const items = folderGroups[typeKey];
          const label = typeKey === 'SANS_DOSSIER'
            ? 'Sans dossier'
            : (folderTypeLabels[typeKey] || typeKey);

          // Deduplicate clients for count
          const uniqueClientIds = new Set(items.map((i) => i.client.id));

          return (
            <div key={typeKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <GroupHeader
                groupKey={`folder-${typeKey}`}
                label={label}
                count={uniqueClientIds.size}
                color={folderTypeColors[typeKey] || 'bg-gray-400'}
              />
              {!collapsedGroups[`folder-${typeKey}`] && (
                <div className="border-t border-gray-100 px-2 py-1">
                  {items.map((item, idx) => (
                    <ClientTreeRow
                      key={`${item.client.id}-${item.folder?.id || idx}`}
                      client={item.client}
                      extra={
                        item.folder && (
                          <span className="flex items-center gap-1.5">
                            <span className="text-gray-400">—</span>
                            <span>{item.folder.title}</span>
                            <span className={`px-1 py-0.5 rounded text-xs ${folderStatusColors[item.folder.status] || 'bg-gray-100 text-gray-600'}`}>
                              {folderStatusLabels[item.folder.status] || item.folder.status}
                            </span>
                          </span>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render list view (original table) ─────────────────────────────
  const renderListView = () => (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-lg font-medium text-gray-900">Aucun client</h3>
            <p className="text-gray-500 mt-1">
              {search || typeFilter ? 'Aucun résultat pour ces filtres' : 'Ajoutez votre premier client'}
            </p>
            {!search && !typeFilter && (
              <button onClick={openCreate} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                + Nouveau client
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">Téléphone</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Ville</th>
                  <th className="px-4 py-3">Extranet</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-blue-600 font-semibold">
                            {getClientName(client).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{getClientName(client)}</p>
                          {client.siret && (
                            <p className="text-xs text-gray-500">SIRET: {client.siret}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[client.type] || 'bg-gray-100'}`}>
                        {typeLabels[client.type] || client.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{client.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{client.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{client.city || '-'}</td>
                    <td className="px-4 py-3">
                      {client.hasExternet ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Actif</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Non actif</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openView(client)}
                          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => openEdit(client)}
                          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(client.id)}
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === 'list' ? `${total} client${total !== 1 ? 's' : ''}` : `${allClients.length} client${allClients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span> Nouveau client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par nom, email, SIRET..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tous les types</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content by view mode */}
      {loading && viewMode !== 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          Chargement...
        </div>
      ) : viewMode === 'list' ? (
        renderListView()
      ) : viewMode === 'alpha' ? (
        renderAlphaView()
      ) : (
        renderFolderView()
      )}

      {/* Create/Edit Modal */}
      {showModal && (modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'edit' ? 'Modifier le client' : 'Nouveau client'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de client *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Name fields */}
              {isCompanyType ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale *</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                    <input
                      type="text"
                      value={form.siret}
                      onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personne de contact</label>
                    <input
                      type="text"
                      value={`${form.firstName} ${form.lastName}`.trim()}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ');
                        setForm((f) => ({ ...f, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Prénom Nom"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : modalMode === 'edit' ? 'Mettre à jour' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showModal && modalMode === 'view' && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Fiche client</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl text-blue-600 font-bold">
                    {getClientName(selectedClient).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{getClientName(selectedClient)}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[selectedClient.type] || 'bg-gray-100'}`}>
                    {typeLabels[selectedClient.type] || selectedClient.type}
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedClient.email && (
                  <div>
                    <span className="text-gray-500 block">Email</span>
                    <p className="font-medium text-gray-900">{selectedClient.email}</p>
                  </div>
                )}
                {selectedClient.phone && (
                  <div>
                    <span className="text-gray-500 block">Téléphone</span>
                    <p className="font-medium text-gray-900">{selectedClient.phone}</p>
                  </div>
                )}
                {selectedClient.mobile && (
                  <div>
                    <span className="text-gray-500 block">Mobile</span>
                    <p className="font-medium text-gray-900">{selectedClient.mobile}</p>
                  </div>
                )}
                {selectedClient.siret && (
                  <div>
                    <span className="text-gray-500 block">SIRET</span>
                    <p className="font-medium text-gray-900">{selectedClient.siret}</p>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Adresse</span>
                    <p className="font-medium text-gray-900">
                      {selectedClient.address}
                      {selectedClient.postalCode && `, ${selectedClient.postalCode}`}
                      {selectedClient.city && ` ${selectedClient.city}`}
                    </p>
                  </div>
                )}
                {selectedClient.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Notes</span>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                )}
              </div>

              {/* Folders */}
              {selectedClient.folders?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 border-t pt-4">
                    Dossiers ({selectedClient.folders.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedClient.folders.map((folder) => (
                      <div key={folder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{folder.title}</p>
                          <p className="text-xs text-gray-500">{folder.reference}</p>
                        </div>
                        <span className="text-xs text-gray-500">{folder.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => { setShowModal(false); openEdit(selectedClient); }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Éditer
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce client ?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Cette action est irréversible. Tous les dossiers liés resteront mais ne seront plus associés à ce client.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
