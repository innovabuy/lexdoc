import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FolderTree from '../../components/documents/FolderTree';
import Breadcrumb from '../../components/documents/Breadcrumb';
import api from '../../services/api';

export default function DocumentsTreePage() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('createdAt');
  const queryClient = useQueryClient();

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', selectedFolder, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFolder) params.append('folderId', selectedFolder);
      params.append('sortBy', sortBy);

      const { data } = await api.get(`/documents?${params.toString()}`);
      return data?.data || data;
    },
  });

  const { data: folderInfo } = useQuery({
    queryKey: ['folder', selectedFolder],
    queryFn: async () => {
      if (!selectedFolder) return null;
      const { data } = await api.get(`/folders/${selectedFolder}`);
      return data?.data || data;
    },
    enabled: !!selectedFolder,
  });

  const moveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, folderId }) => {
      const { data } = await api.put(`/documents/${documentId}`, { folderId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    },
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
    const documentId = e.dataTransfer.getData('documentId');
    if (documentId) {
      moveDocumentMutation.mutate({ documentId, folderId });
    }
  };

  const handleDragStart = (e, documentId) => {
    e.dataTransfer.setData('documentId', documentId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getDocumentIcon = (type) => {
    const icons = {
      'application/pdf': (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      ),
      'image': (
        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
        </svg>
      ),
      'default': (
        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      ),
    };

    if (type?.startsWith('image/')) return icons['image'];
    if (type === 'application/pdf') return icons['application/pdf'];
    return icons['default'];
  };

  const documents = documentsData?.documents || documentsData || [];

  return (
    <>
    <div className="flex h-[calc(100vh-64px-2rem)] -m-4 lg:-m-8">
      {/* Sidebar avec arborescence */}
      <div
        className="w-80 border-r bg-gray-50 p-4 overflow-y-auto flex-shrink-0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        <FolderTree
          onFolderSelect={setSelectedFolder}
          selectedFolderId={selectedFolder}
        />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6 overflow-y-auto">
        <Breadcrumb
          folderId={selectedFolder}
          onNavigate={setSelectedFolder}
        />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {folderInfo?.title || folderInfo?.name || 'Tous les documents'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="createdAt">Date de creation</option>
              <option value="name">Nom</option>
              <option value="size">Taille</option>
              <option value="type">Type</option>
            </select>

            {/* View mode toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </button>
            </div>

            {/* Upload button */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Uploader
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-4 rounded-lg shadow border animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun document</h3>
            <p className="text-gray-500">
              {selectedFolder
                ? 'Ce dossier est vide. Uploadez des documents ou deplacez-en depuis un autre dossier.'
                : 'Commencez par uploader vos premiers documents.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, doc.id)}
                className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow cursor-move"
              >
                <div className="flex items-start gap-3 mb-3">
                  {getDocumentIcon(doc.mimeType)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{doc.name}</h3>
                    <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  <p>{formatDate(doc.createdAt)} - {formatFileSize(doc.size)}</p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 text-blue-600 hover:bg-blue-50 text-sm py-1.5 rounded transition-colors">
                    Telecharger
                  </button>
                  <button className="flex-1 text-gray-600 hover:bg-gray-50 text-sm py-1.5 rounded transition-colors">
                    Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Taille</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, doc.id)}
                    className="hover:bg-gray-50 cursor-move"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getDocumentIcon(doc.mimeType)}
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{doc.type || 'Document'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(doc.size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(doc.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-700 text-sm mr-3">
                        Telecharger
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 text-sm">
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
