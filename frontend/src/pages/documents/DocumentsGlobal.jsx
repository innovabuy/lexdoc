import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const statusLabels = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En revision',
  PENDING_SIGNATURE: 'En attente signature',
  SIGNED: 'Signe',
  SENT: 'Envoye',
  ARCHIVED: 'Archive',
  CANCELLED: 'Annule',
};

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  PENDING_REVIEW: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  SIGNED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ARCHIVED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeLabels = {
  CONTRACT: 'Contrat',
  DEED: 'Acte',
  LETTER: 'Courrier',
  INVOICE: 'Facture',
  RECEIPT: 'Recu',
  CERTIFICATE: 'Certificat',
  REPORT: 'Rapport',
  MINUTES: 'PV',
  AMENDMENT: 'Avenant',
  MEMORANDUM: 'Note',
  POWER_OF_ATTORNEY: 'Procuration',
  OTHER: 'Autre',
};

function getFileIcon(mimeType) {
  if (!mimeType) return '📄';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('text')) return '📝';
  return '📄';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DocumentsGlobal() {
  const { success, error: showError } = useToast();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const pageSize = 20;

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch folders for dropdown
  useEffect(() => {
    api.get('/folders?pageSize=200')
      .then(({ data }) => setFolders(data.data || []))
      .catch(() => {});
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('pageSize', pageSize);
      if (search) params.set('search', search);
      if (selectedType) params.set('type', selectedType);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedFolder) params.set('folderId', selectedFolder);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const { data } = await api.get(`/documents?${params.toString()}`);
      setDocuments(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedType, selectedStatus, selectedFolder, dateFrom, dateTo]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [documents]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    // Handle nested folder title
    if (sortBy === 'folder') {
      aVal = a.folder?.title || '';
      bVal = b.folder?.title || '';
    }
    if (sortBy === 'size') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName || doc.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showError('Erreur lors du telechargement');
    }
  };

  const handlePreview = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.id}/preview`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: doc.mimeType || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      showError('Impossible de previsualiser ce document');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkLoading(true);
      const { data } = await api.post('/documents/bulk-download', {
        ids: Array.from(selectedIds),
      });
      // Download each file
      const urls = data.data || [];
      for (const doc of urls) {
        const response = await api.get(`/documents/${doc.id}/download`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.originalName || doc.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      success(`${urls.length} document(s) telecharge(s)`);
    } catch {
      showError('Erreur lors du telechargement en masse');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkLoading(true);
      await api.delete('/documents/bulk-delete', {
        data: { ids: Array.from(selectedIds) },
      });
      success(`${selectedIds.size} document(s) supprime(s)`);
      setShowDeleteConfirm(false);
      setSelectedIds(new Set());
      fetchDocuments();
    } catch {
      showError('Erreur lors de la suppression en masse');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Supprimer "${doc.name}" ?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      success('Document supprime');
      fetchDocuments();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedFolder('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Nom original', 'Dossier', 'Type', 'Statut', 'Taille', 'Date de creation'];
    const rows = sortedDocuments.map(doc => [
      doc.name,
      doc.originalName,
      doc.folder?.title || '',
      typeLabels[doc.type] || doc.type,
      statusLabels[doc.status] || doc.status,
      formatFileSize(doc.size),
      new Date(doc.createdAt).toLocaleDateString('fr-FR'),
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `documents_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / pageSize);

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tous les documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} document{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={sortedDocuments.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          <select
            value={selectedFolder}
            onChange={(e) => { setSelectedFolder(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tous les dossiers</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.title} ({f.reference})</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tous les types</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Reinitialiser
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} document{selectedIds.size !== 1 ? 's' : ''} selectionne{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDownload}
              disabled={bulkLoading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              Telecharger
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={bulkLoading}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Chargement...</p>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun document</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {search || selectedType || selectedStatus || selectedFolder || dateFrom || dateTo
                ? 'Aucun resultat pour ces filtres'
                : 'Aucun document dans le systeme'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === documents.length && documents.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('name')}>
                    Nom <SortIcon column="name" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('folder')}>
                    Dossier <SortIcon column="folder" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('type')}>
                    Type <SortIcon column="type" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('size')}>
                    Taille <SortIcon column="size" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    Date <SortIcon column="createdAt" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('status')}>
                    Statut <SortIcon column="status" />
                  </th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDocuments.map((doc) => (
                  <tr key={doc.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getFileIcon(doc.mimeType)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.originalName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {doc.folder ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate block max-w-[200px]">
                          {doc.folder.title}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                        {typeLabels[doc.type] || doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[doc.status] || 'bg-gray-100 dark:bg-gray-700'}`}>
                        {statusLabels[doc.status] || doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="px-2 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Previsualiser"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Telecharger"
                        >
                          Telecharger
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Supprimer"
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
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            Precedent
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Bulk delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer {selectedIds.size} document(s) ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Cette action est irreversible. Les documents selectionnes seront places dans la corbeille.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {bulkLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
