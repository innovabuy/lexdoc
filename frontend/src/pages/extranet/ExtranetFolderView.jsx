import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as extranetApi from '../../services/extranetApi';
import './ExtranetFolderView.css';

export default function ExtranetFolderView() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [folderTitle, setFolderTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [folderId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Get folder info from the folders list
      const foldersRes = await extranetApi.getFolders();
      const folders = foldersRes.data?.data || foldersRes.data || [];
      const folder = folders.find((f) => f.id === folderId);
      if (folder) setFolderTitle(folder.title);

      const docsRes = await extranetApi.getFolderDocuments(folderId);
      const docs = docsRes.data?.data || docsRes.data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch {
      // Folder not found or no access
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      const res = await extranetApi.downloadDocument(doc.id);
      const data = res.data?.data || res.data;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch {
      alert('Erreur lors du téléchargement');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const statusLabel = (status) => {
    const labels = {
      DRAFT: 'Brouillon',
      PENDING_REVIEW: 'En révision',
      PENDING_SIGNATURE: 'En signature',
      SIGNED: 'Signé',
      SENT: 'Envoyé',
      ARCHIVED: 'Archivé',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  };

  const statusClass = (status) => {
    if (status === 'SIGNED') return 'exf-status--success';
    if (status === 'PENDING_SIGNATURE') return 'exf-status--warning';
    if (status === 'CANCELLED') return 'exf-status--danger';
    return '';
  };

  const fileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '\uD83D\uDCC4';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '\uD83D\uDCC3';
    if (mimeType?.includes('image')) return '\uD83D\uDDBC\uFE0F';
    return '\uD83D\uDCC4';
  };

  if (loading) {
    return (
      <div className="exf-loading">
        <div className="exf-spinner" />
        <p>Chargement des documents...</p>
      </div>
    );
  }

  return (
    <div className="exf-container">
      <button className="exf-back" onClick={() => navigate('/extranet/dashboard')}>
        &#x2190; Retour aux dossiers
      </button>

      <h1 className="exf-title">{folderTitle || 'Dossier'}</h1>

      {documents.length === 0 ? (
        <div className="exf-empty">
          <p>Aucun document disponible dans ce dossier pour le moment.</p>
        </div>
      ) : (
        <div className="exf-list">
          {documents.map((doc) => (
            <div key={doc.id} className="exf-row">
              <span className="exf-row-icon">{fileIcon(doc.mimeType)}</span>
              <div className="exf-row-info">
                <span className="exf-row-name">{doc.name}</span>
                <span className={`exf-status ${statusClass(doc.status)}`}>
                  {statusLabel(doc.status)}
                </span>
              </div>
              <span className="exf-row-date">{formatDate(doc.createdAt)}</span>
              <button
                className="exf-download-btn"
                onClick={() => handleDownload(doc)}
                disabled={downloading === doc.id}
              >
                {downloading === doc.id ? '...' : 'Télécharger'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
