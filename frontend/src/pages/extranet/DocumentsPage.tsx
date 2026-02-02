import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useExtranetStore } from '@/store/extranetStore';
import { extranetApi, type Document, type Folder } from '@/lib/api/extranet';
import { ReminderIndicator } from './components/ReminderIndicator';
import { StatusBadge } from './components/StatusBadge';

export default function ExtranetDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const { client, logout } = useExtranetStore();
  const navigate = useNavigate();

  const selectedFolderId = searchParams.get('folderId') || '';
  const searchQuery = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    loadData();
  }, [selectedFolderId, searchQuery, page]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docsResponse, foldersData] = await Promise.all([
        extranetApi.getDocuments({
          folderId: selectedFolderId || undefined,
          search: searchQuery || undefined,
          page,
          limit: 20,
        }),
        extranetApi.getFolders(),
      ]);
      setDocuments(docsResponse.data);
      setPagination(docsResponse.pagination);
      setFolders(foldersData);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderChange = (folderId: string) => {
    const params = new URLSearchParams(searchParams);
    if (folderId) {
      params.set('folderId', folderId);
    } else {
      params.delete('folderId');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const handleLogout = () => {
    logout();
    navigate('/extranet/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/extranet/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900">Extranet Client</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{client?.companyName || `${client?.firstName} ${client?.lastName}`}</div>
                <div className="text-xs text-gray-500">{client?.email}</div>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                Deconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Link to="/extranet/dashboard" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour au tableau de bord
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Tous mes documents</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Rechercher un document..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Folder filter */}
            <div className="sm:w-64">
              <select
                value={selectedFolderId}
                onChange={(e) => handleFolderChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les dossiers</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name} ({folder._count.documents})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : documents.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                        Dossier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                        Relances
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{doc.title}</div>
                          <div className="text-sm text-gray-500">{doc.originalName}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                          {doc.folder?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={doc.tracking?.status} />
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <ReminderIndicator tracking={doc.tracking} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {doc.tracking?.status === 'PENDING_SIGNATURE' && (
                              <button
                                onClick={() => navigate(`/extranet/documents/${doc.id}`)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                              >
                                Signer
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/extranet/documents/${doc.id}`)}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
                            >
                              Voir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} sur {pagination.totalPages} ({pagination.total} documents)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Precedent
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {searchQuery || selectedFolderId
                  ? 'Aucun document ne correspond a vos criteres'
                  : 'Aucun document disponible'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
