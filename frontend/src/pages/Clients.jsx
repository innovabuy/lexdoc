import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

const typeLabels = {
  INDIVIDUAL: 'Particulier',
  COMPANY: 'Société',
  ASSOCIATION: 'Association',
};

const typeColors = {
  INDIVIDUAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPANY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ASSOCIATION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
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

export default function Clients() {
  const { success, error: showError } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit | view
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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
      fetchClients();
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
      fetchClients();
    } catch (err) {
      showError(err.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const isCompanyType = form.type === 'COMPANY' || form.type === 'ASSOCIATION';

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} client{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> Nouveau client
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par nom, email, SIRET..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tous les types</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun client</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
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
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
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
                  <tr key={client.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {getClientName(client).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{getClientName(client)}</p>
                          {client.siret && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">SIRET: {client.siret}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[client.type] || 'bg-gray-100'}`}>
                        {typeLabels[client.type] || client.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{client.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{client.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">{client.city || '-'}</td>
                    <td className="px-4 py-3">
                      {client.hasExternet ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">Actif</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded text-xs">Non actif</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openView(client)}
                          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => openEdit(client)}
                          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(client.id)}
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalMode === 'edit' ? 'Modifier le client' : 'Nouveau client'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de client *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Raison sociale *</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIRET</label>
                    <input
                      type="text"
                      value={form.siret}
                      onChange={(e) => setForm(f => ({ ...f, siret: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personne de contact</label>
                    <input
                      type="text"
                      value={`${form.firstName} ${form.lastName}`.trim()}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ');
                        setForm(f => ({ ...f, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Prénom Nom"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm(f => ({ ...f, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fiche client</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-2xl text-blue-600 dark:text-blue-400 font-bold">
                    {getClientName(selectedClient).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getClientName(selectedClient)}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[selectedClient.type] || 'bg-gray-100'}`}>
                    {typeLabels[selectedClient.type] || selectedClient.type}
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedClient.email && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Email</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClient.email}</p>
                  </div>
                )}
                {selectedClient.phone && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Téléphone</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClient.phone}</p>
                  </div>
                )}
                {selectedClient.mobile && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Mobile</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClient.mobile}</p>
                  </div>
                )}
                {selectedClient.siret && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">SIRET</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClient.siret}</p>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400 block">Adresse</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedClient.address}
                      {selectedClient.postalCode && `, ${selectedClient.postalCode}`}
                      {selectedClient.city && ` ${selectedClient.city}`}
                    </p>
                  </div>
                )}
                {selectedClient.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400 block">Notes</span>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                )}
              </div>

              {/* Folders */}
              {selectedClient.folders?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 border-t dark:border-gray-700 pt-4">
                    Dossiers ({selectedClient.folders.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedClient.folders.map((folder) => (
                      <div key={folder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{folder.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{folder.reference}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{folder.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => { setShowModal(false); openEdit(selectedClient); }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer ce client ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Cette action est irréversible. Tous les dossiers liés resteront mais ne seront plus associés à ce client.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
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
