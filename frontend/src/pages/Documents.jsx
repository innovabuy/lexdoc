import { useState, useEffect, useCallback, useMemo } from'react';
import { useSearchParams } from'react-router-dom';
import api from'../services/api';
import DocumentUploader from'../components/documents/DocumentUploader';
import DocumentVersions from'../components/documents/DocumentVersions';
import DocumentPreview from'../components/documents/DocumentPreview';

// Hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Current folder
  const currentFolderId = searchParams.get('folderId');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentFolderId) params.append('folderId', currentFolderId);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('page', String(page));

      const { data } = await api.get(`/documents?${params}`);
      setDocuments(data.data || []);
      setPagination(data.pagination || { page: 1, total: 0, pages: 1 });
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, debouncedSearch, selectedType, selectedStatus, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [currentFolderId, debouncedSearch, selectedType, selectedStatus]);

  const fetchFolders = useCallback(async () => {
    try {
      const params = currentFolderId ? `?parentId=${currentFolderId}` :'?parentId=root';
      const { data } = await api.get(`/folders${params}`);
      setFolders(data.data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  }, [currentFolderId]);

  const fetchBreadcrumb = useCallback(async () => {
    if (!currentFolderId) {
      setBreadcrumb([]);
      return;
    }
    try {
      const { data } = await api.get(`/folders/${currentFolderId}/breadcrumb`);
      setBreadcrumb(data.data || []);
    } catch (error) {
      console.error('Error fetching breadcrumb:', error);
    }
  }, [currentFolderId]);

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
    fetchBreadcrumb();
  }, [fetchDocuments, fetchFolders, fetchBreadcrumb]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!formData.get('file')?.name) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    if (!formData.get('folderId')) {
      alert('Veuillez sélectionner un dossier');
      return;
    }

    try {
      setUploading(true);
      await api.post('/documents', formData, {
        headers: {'Content-Type':'multipart/form-data' },
      });
      setShowUploadModal(false);
      fetchDocuments();
      e.target.reset();
    } catch (error) {
      alert(error.response?.data?.error?.message ||'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType:'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName || doc.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur téléchargement');
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Supprimer"${doc.name}" ?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      fetchDocuments();
    } catch (error) {
      alert('Erreur suppression');
    }
  };

  const navigateToFolder = (folderId) => {
    if (folderId) {
      setSearchParams({ folderId });
    } else {
      setSearchParams({});
    }
  };

  const statusColors = {
    DRAFT:'bg-gray-100 text-gray-600',
    PENDING_REVIEW:'bg-orange-100 text-orange-700',
    PENDING_SIGNATURE:'bg-yellow-100 text-yellow-700',
    SIGNED:'bg-green-100 text-green-700',
    SENT:'bg-blue-100 text-blue-700',
    ARCHIVED:'bg-purple-100 text-purple-700',
    CANCELLED:'bg-red-100 text-red-700',
  };

  const statusLabels = {
    DRAFT:'Brouillon',
    PENDING_REVIEW:'En révision',
    PENDING_SIGNATURE:'En attente signature',
    SIGNED:'Signé',
    SENT:'Envoyé',
    ARCHIVED:'Archivé',
    CANCELLED:'Annulé',
  };

  const typeLabels = {
    CONTRACT:'Contrat',
    DEED:'Acte',
    LETTER:'Courrier',
    INVOICE:'Facture',
    RECEIPT:'Reçu',
    CERTIFICATE:'Certificat',
    REPORT:'Rapport',
    MINUTES:'PV',
    AMENDMENT:'Avenant',
    MEMORANDUM:'Note',
    POWER_OF_ATTORNEY:'Procuration',
    OTHER:'Autre',
  };

  const documentTypes = Object.keys(typeLabels);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mt-1">
            <button onClick={() => navigateToFolder(null)} className="hover:text-blue-600">
              Racine
            </button>
            {breadcrumb.map((folder, idx) => (
              <span key={folder.id} className="flex items-center">
                <span className="mx-2">/</span>
                <button
                  onClick={() => navigateToFolder(folder.id)}
                  className={idx === breadcrumb.length - 1 ?'text-gray-800 font-medium' :'hover:text-blue-600'}
                >
                  {folder.title}
                </button>
              </span>
            ))}
          </nav>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            + Nouveau dossier
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Upload document
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>{typeLabels[type]}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            {Object.keys(statusLabels).map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
          <button
            onClick={() => { setSearch(''); setSelectedType(''); setSelectedStatus(''); }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Folders Grid */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Dossiers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => navigateToFolder(folder.id)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2" style={{ color: folder.color ||'#3B82F6' }}>
                  📁
                </div>
                <p className="font-medium text-gray-800 truncate">{folder.title}</p>
                <p className="text-xs text-gray-500">{folder.reference}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {folder.documentsCount || 0} docs · {folder.subfoldersCount || 0} sous-dossiers
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Documents</h2>
          <span className="text-sm text-gray-500">{pagination.total} document(s)</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Chargement...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">📄</p>
            <p>Aucun document dans ce dossier</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-3">Nom</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Tags</th>
                  <th className="px-6 py-3">Taille</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getFileIcon(doc.mimeType)}</span>
                        <div>
                          <p className="font-medium text-gray-800">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.originalName}</p>
                          {(doc.versionsCount > 0 || doc.version > 1) && (
                            <button
                              onClick={() => setShowVersionsModal(doc)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              v{doc.version || 1} · {doc.versionsCount || 0} version{(doc.versionsCount || 0) !== 1 ?'s' :''}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {typeLabels[doc.type] || doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm ${statusColors[doc.status] ||'bg-gray-100'}`}>
                        {statusLabels[doc.status] || doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(doc.tags || []).slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {(doc.tags || []).length > 3 && (
                          <span className="text-xs text-gray-400">+{doc.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowPreviewModal(doc)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Previsualiser"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => setShowVersionsModal(doc)}
                          className="text-gray-500 hover:text-blue-600"
                          title="Historique des versions"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Telecharger"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  ← Precedent
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal - Drag & Drop */}
      {showUploadModal && (
        <DocumentUploader
          folderId={currentFolderId}
          onUploadComplete={() => {
            setShowUploadModal(false);
            fetchDocuments();
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Document Versions Modal */}
      {showVersionsModal && (
        <DocumentVersions
          document={showVersionsModal}
          onClose={() => setShowVersionsModal(null)}
          onVersionUploaded={() => fetchDocuments()}
        />
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <FolderModal
          parentId={currentFolderId}
          onClose={() => setShowFolderModal(false)}
          onCreated={() => {
            setShowFolderModal(false);
            fetchFolders();
          }}
        />
      )}

      {/* Document Preview Modal */}
      {showPreviewModal && (
        <DocumentPreview
          document={showPreviewModal}
          onClose={() => setShowPreviewModal(null)}
        />
      )}
    </>
  );
}

function FolderModal({ parentId, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get('/clients').then(({ data }) => setClients(data.data || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      setLoading(true);
      await api.post('/folders', {
        title: formData.get('title'),
        description: formData.get('description'),
        type: formData.get('type'),
        clientId: formData.get('clientId'),
        parentId: parentId || null,
        color: formData.get('color'),
      });
      onCreated();
    } catch (error) {
      alert(error.response?.data?.error?.message ||'Erreur création dossier');
    } finally {
      setLoading(false);
    }
  };

  const folderTypes = [
    { value:'LITIGATION', label:'Contentieux' },
    { value:'CONTRACT', label:'Contrat' },
    { value:'BUSINESS', label:'Affaires' },
    { value:'FAMILY', label:'Famille' },
    { value:'REAL_ESTATE', label:'Immobilier' },
    { value:'LABOR', label:'Travail' },
    { value:'INTELLECTUAL', label:'Propriété intellectuelle' },
    { value:'ADMINISTRATIVE', label:'Administratif' },
    { value:'CRIMINAL', label:'Pénal' },
    { value:'OTHER', label:'Autre' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Nouveau Dossier</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              name="clientId"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type ==='COMPANY' ? c.companyName : `${c.firstName} ${c.lastName}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              name="type"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {folderTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
            <input
              type="color"
              name="color"
              defaultValue="#3B82F6"
              className="w-16 h-10 border rounded cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ?'Création...' :'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getFileIcon(mimeType) {
  if (!mimeType) return'📄';
  if (mimeType.includes('pdf')) return'📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return'📘';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return'📗';
  if (mimeType.includes('image')) return'🖼️';
  if (mimeType.includes('text')) return'📝';
  return'📄';
}

function formatFileSize(bytes) {
  if (!bytes) return'0 B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) +'' + sizes[i];
}
