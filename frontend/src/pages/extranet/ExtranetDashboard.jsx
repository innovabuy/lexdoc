import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExtranetAuthContext } from '../../contexts/ExtranetAuthContext';
import * as extranetApi from '../../services/extranetApi';
import './ExtranetDashboard.css';

export default function ExtranetDashboard() {
  const { access } = useContext(ExtranetAuthContext);
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    extranetApi.getFolders()
      .then((res) => {
        const data = res.data?.data || res.data;
        setFolders(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const clientName = access?.client
    ? `${access.client.firstName || ''} ${access.client.lastName || ''}`.trim() || access.client.companyName
    : '';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  const folderTypeLabel = (type) => {
    const labels = {
      LITIGATION: 'Contentieux',
      CONTRACT: 'Contrats',
      BUSINESS: 'Affaires',
      FAMILY: 'Famille',
      REAL_ESTATE: 'Immobilier',
      LABOR: 'Travail',
      INTELLECTUAL: 'PI',
      ADMINISTRATIVE: 'Administratif',
      CRIMINAL: 'Pénal',
      OTHER: 'Divers',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="exd-loading">
        <div className="exd-spinner" />
        <p>Chargement de vos dossiers...</p>
      </div>
    );
  }

  return (
    <div className="exd-container">
      <h1 className="exd-title">Mes dossiers</h1>
      {clientName && (
        <p className="exd-subtitle">Bienvenue, {clientName}</p>
      )}

      {folders.length === 0 ? (
        <div className="exd-empty">
          <div className="exd-empty-icon">&#x1F4C2;</div>
          <p>Aucun dossier disponible pour le moment.</p>
          <p className="exd-empty-hint">
            Votre cabinet vous donnera accès à vos dossiers lorsqu'ils seront prêts.
          </p>
        </div>
      ) : (
        <div className="exd-grid">
          {folders.map((folder) => (
            <div key={folder.id} className="exd-card">
              <div className="exd-card-icon">&#x1F4C1;</div>
              <div className="exd-card-content">
                <h3 className="exd-card-title">{folder.title}</h3>
                <p className="exd-card-meta">
                  {folderTypeLabel(folder.type)}
                  {folder.documentCount > 0 && (
                    <> — {folder.documentCount} document{folder.documentCount > 1 ? 's' : ''} disponible{folder.documentCount > 1 ? 's' : ''}</>
                  )}
                </p>
                {folder.updatedAt && (
                  <p className="exd-card-date">
                    Dernière mise à jour : {formatDate(folder.updatedAt)}
                  </p>
                )}
              </div>
              <button
                className="exd-card-btn"
                onClick={() => navigate(`/extranet/folders/${folder.id}`)}
              >
                Consulter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
