import { useState, useEffect, useRef } from'react';
import { useNavigate } from'react-router-dom';
import api from'../services/api';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ documents: [], folders: [], clients: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key ==='k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key ==='Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults({ documents: [], folders: [], clients: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data.data || { documents: [], folders: [], clients: [] });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (type, item) => {
    setIsOpen(false);
    setQuery('');

    switch (type) {
      case'document':
        navigate(`/documents?highlight=${item.id}`);
        break;
      case'folder':
        navigate(`/folders/${item.id}`);
        break;
      case'client':
        navigate(`/clients?highlight=${item.id}`);
        break;
    }
  };

  const totalResults = results.documents.length + results.folders.length + results.clients.length;

  const getDocIcon = (mimeType) => {
    if (!mimeType) return'📄';
    if (mimeType.includes('pdf')) return'📕';
    if (mimeType.includes('word')) return'📘';
    if (mimeType.includes('image')) return'🖼️';
    return'📄';
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm hidden sm:inline">Rechercher...</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-200 rounded">⌘K</kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher documents, dossiers, clients..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none"
              />
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">ESC</kbd>
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Tapez au moins 2 caracteres pour rechercher</p>
                  <p className="text-sm mt-2">
                    Astuce: Utilisez <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘K</kbd> pour ouvrir la recherche
                  </p>
                </div>
              ) : totalResults === 0 && !loading ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="text-4xl block mb-2">🔍</span>
                  Aucun resultat pour"{query}"
                </div>
              ) : (
                <>
                  {/* Documents */}
                  {results.documents.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                        DOCUMENTS ({results.documents.length})
                      </div>
                      {results.documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleSelect('document', doc)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                        >
                          <span className="text-xl">{getDocIcon(doc.mimeType)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {doc.folder?.title ||'Sans dossier'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">{doc.type}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Folders */}
                  {results.folders.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                        DOSSIERS ({results.folders.length})
                      </div>
                      {results.folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleSelect('folder', folder)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                        >
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center"
                            style={{ backgroundColor: folder.color ||'#3B82F6' }}
                          >
                            📁
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{folder.title}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {folder.reference} - {folder.client?.companyName || `${folder.client?.firstName} ${folder.client?.lastName}`}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded ${
 folder.status ==='OPEN' ?'bg-green-100 text-green-700' :'bg-gray-100 text-gray-600'
 }`}>
                            {folder.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Clients */}
                  {results.clients.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                        CLIENTS ({results.clients.length})
                      </div>
                      {results.clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleSelect('client', client)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {client.type ==='COMPANY' ?'🏢' :'👤'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {client.companyName || `${client.firstName} ${client.lastName}`}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {client.email}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {client.type ==='COMPANY' ?'Entreprise' :'Particulier'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <span className="mr-4">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded">↑↓</kbd> naviguer
              </span>
              <span className="mr-4">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded">↵</kbd> selectionner
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-gray-200 rounded">ESC</kbd> fermer
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
