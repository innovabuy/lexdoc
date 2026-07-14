import { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import api from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const isImage = (mimeType) => mimeType?.startsWith('image/');
const isPdf = (mimeType) => mimeType === 'application/pdf';
const isText = (mimeType) => mimeType?.startsWith('text/');
// GO-LIVE-6 M7 — les .docx sont rendus CÔTÉ CLIENT (docx-preview), pas par le backend.
const isDocx = (mimeType) =>
  mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
  mimeType === 'application/msword';

export default function DocumentPreview({ document, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  const docxRef = useRef(null);

  const isPreviewable = (mimeType) => {
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ];
    return previewableTypes.includes(mimeType) || isDocx(mimeType);
  };

  useEffect(() => {
    if (!document) return;

    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      setDocxBlob(null);

      if (!isPreviewable(document.mimeType)) {
        setError('Ce type de fichier ne peut pas être prévisualisé.');
        setLoading(false);
        return;
      }

      // GO-LIVE-6 M7 — .docx : on récupère le VRAI fichier (endpoint download) et on le
      // rend dans le navigateur. Pas de conversion serveur.
      if (isDocx(document.mimeType)) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE}/documents/${document.id}/download`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('load');
          setDocxBlob(await response.blob());
        } catch {
          setError('Aperçu indisponible pour ce document. Téléchargez le fichier.');
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/documents/${document.id}/preview`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error('Preview error:', err);
        setError('Impossible de charger la prévisualisation');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [document]);

  // GO-LIVE-6 M7 — rend le .docx dans le conteneur une fois le blob prêt et le DOM monté.
  useEffect(() => {
    if (!docxBlob || !docxRef.current) return;
    let cancelled = false;
    docxRef.current.innerHTML = '';
    renderAsync(docxBlob, docxRef.current, undefined, {
      className: 'docx-render',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
    }).catch((e) => {
      console.error('docx render error:', e);
      if (!cancelled) setError('Aperçu impossible (format inattendu ou fichier corrompu). Téléchargez le fichier pour le lire.');
    });
    return () => { cancelled = true; };
  }, [docxBlob]);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.originalName || document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const getFileIcon = (mimeType) => {
    if (isPdf(mimeType)) return '📄';
    if (isImage(mimeType)) return '🖼️';
    if (isText(mimeType)) return '📝';
    if (mimeType?.includes('word')) return '📘';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📗';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{getFileIcon(document.mimeType)}</span>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">
                {document.name || document.originalName}
              </h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.size)} - {document.mimeType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement de la prévisualisation...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <span className="text-6xl block mb-4">{getFileIcon(document.mimeType)}</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Prévisualisation non disponible
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger le fichier
                </button>
              </div>
            </div>
          )}

          {!loading && !error && previewUrl && (
            <>
              {isPdf(document.mimeType) && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={document.name}
                />
              )}

              {isImage(document.mimeType) && (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={previewUrl}
                    alt={document.name}
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  />
                </div>
              )}

              {isText(document.mimeType) && (
                <div className="w-full h-full overflow-auto p-6">
                  <TextPreview url={previewUrl} />
                </div>
              )}
            </>
          )}

          {/* GO-LIVE-6 M7 — aperçu .docx rendu côté client, avec bandeau d'avertissement */}
          {!loading && !error && docxBlob && (
            <div className="w-full h-full flex flex-col">
              <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', color: '#92400e', fontSize: 13, padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span><strong>Aperçu</strong> — le document final peut différer légèrement. Téléchargez le fichier pour vérification avant envoi.</span>
                <button onClick={handleDownload} className="px-3 py-1 bg-blue-600 text-white rounded whitespace-nowrap" style={{ flexShrink: 0 }}>
                  Télécharger
                </button>
              </div>
              <div className="flex-1 overflow-auto" style={{ background: '#e5e7eb', padding: 16 }}>
                <div ref={docxRef} style={{ background: '#fff', margin: '0 auto', maxWidth: 900 }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer with document info */}
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {document.folder && (
              <span>Dossier: {document.folder.title}</span>
            )}
            {document.createdBy && (
              <span>
                Créé par : {document.createdBy.firstName} {document.createdBy.lastName}
              </span>
            )}
          </div>
          {document.createdAt && (
            <span>
              {new Date(document.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Text file preview component
function TextPreview({ url }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent('Erreur lors du chargement du contenu');
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  return (
    <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-6 rounded-lg shadow-sm border">
      {content}
    </pre>
  );
}
