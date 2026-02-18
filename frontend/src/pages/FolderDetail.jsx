import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import FolderPersons from '../components/folders/FolderPersons';
import DocumentRequests from '../components/folders/DocumentRequests';
import FolderTimeline from '../components/folders/FolderTimeline';
import DocumentPreview from '../components/documents/DocumentPreview';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const statusColors = {
  OPEN: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-purple-100 text-purple-700',
};

const statusLabels = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  PENDING: 'En attente',
  CLOSED: 'Fermé',
  ARCHIVED: 'Archivé',
};

const typeLabels = {
  LITIGATION: 'Contentieux',
  CONTRACT: 'Contrat',
  BUSINESS: 'Droit des affaires',
  FAMILY: 'Droit de la famille',
  REAL_ESTATE: 'Immobilier',
  LABOR: 'Droit du travail',
  INTELLECTUAL: 'Propriété intellectuelle',
  ADMINISTRATIVE: 'Administratif',
  CRIMINAL: 'Pénal',
  OTHER: 'Autre',
};

const TABS = [
  { id: 'info', label: 'Informations', icon: 'i' },
  { id: 'documents', label: 'Documents', icon: 'D' },
  { id: 'persons', label: 'Personnes', icon: 'P' },
  { id: 'requests', label: 'Demandes', icon: 'R' },
  { id: 'timeline', label: 'Historique', icon: 'T' },
  { id: 'access', label: 'Accès client', icon: 'A' },
];

export default function FolderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [clientAccesses, setClientAccesses] = useState([]);
  const [loadingAccesses, setLoadingAccesses] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchFolder();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'access' && folder) {
      fetchClientAccesses();
    }
  }, [activeTab, folder]);

  const fetchFolder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/folders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setFolder(data.data);
      } else {
        navigate('/folders');
      }
    } catch (err) {
      console.error('Error fetching folder:', err);
      navigate('/folders');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientAccesses = async () => {
    try {
      setLoadingAccesses(true);
      const res = await fetch(`${API_URL}/client-access?folderId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClientAccesses(data.data || []);
    } catch (err) {
      console.error('Error fetching client accesses:', err);
    } finally {
      setLoadingAccesses(false);
    }
  };

  const getClientName = () => {
    if (!folder?.client) return '';
    if (folder.client.companyName) return folder.client.companyName;
    return `${folder.client.firstName || ''} ${folder.client.lastName || ''}`.trim();
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </>
    );
  }

  if (!folder) {
    return (
      <>
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-900">Dossier non trouvé</h2>
          <Link to="/folders" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Retour aux dossiers
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500">
          <Link to="/folders" className="hover:text-gray-700">
            Dossiers
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{folder.reference}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: folder.color || '#3B82F6' }}
              >
                <span className="opacity-80">📁</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{folder.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-gray-500">Réf: {folder.reference}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[folder.status] || 'bg-gray-100'
                    }`}
                  >
                    {statusLabels[folder.status] || folder.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {typeLabels[folder.type] || folder.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/folders`)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
              >
                Retour
              </button>
            </div>
          </div>

          {folder.description && (
            <p className="mt-4 text-gray-600 border-t pt-4">{folder.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b">
            <nav className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'documents' && folder._count?.documents > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {folder._count.documents}
                    </span>
                  )}
                  {tab.id === 'persons' && folder.persons?.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {folder.persons.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">
                    Informations du dossier
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Référence</span>
                      <p className="font-medium">{folder.reference}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Statut</span>
                      <p className="font-medium">{statusLabels[folder.status]}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type</span>
                      <p className="font-medium">{typeLabels[folder.type]}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date d'ouverture</span>
                      <p className="font-medium">
                        {new Date(folder.openedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {folder.closedAt && (
                      <div>
                        <span className="text-gray-500">Date de fermeture</span>
                        <p className="font-medium">
                          {new Date(folder.closedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Client</h3>
                  {folder.client && (
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-gray-500">Nom</span>
                        <p className="font-medium">{getClientName()}</p>
                      </div>
                      {folder.client.email && (
                        <div>
                          <span className="text-gray-500">Email</span>
                          <p className="font-medium">{folder.client.email}</p>
                        </div>
                      )}
                      {folder.client.phone && (
                        <div>
                          <span className="text-gray-500">Téléphone</span>
                          <p className="font-medium">{folder.client.phone}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {folder.createdBy && (
                  <div className="col-span-2 space-y-4">
                    <h3 className="font-medium text-gray-900 border-b pb-2">Créé par</h3>
                    <p className="text-sm">
                      {folder.createdBy.firstName} {folder.createdBy.lastName} -{' '}
                      {new Date(folder.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                {folder.documents?.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="text-3xl mb-3">📄</div>
                    <h4 className="font-medium text-gray-900">Aucun document</h4>
                    <p className="text-gray-500 text-sm mt-1">
                      Les documents de ce dossier apparaîtront ici
                    </p>
                    <Link
                      to="/documents"
                      className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Gérer les documents
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {folder.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {doc.mimeType?.includes('pdf') ? '📕' : '📄'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.originalName} -{' '}
                              {(Number(doc.size) / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                            title="Previsualiser"
                          >
                            👁️ Voir
                          </button>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              doc.status === 'SIGNED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {doc.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Persons Tab */}
            {activeTab === 'persons' && <FolderPersons folderId={id} />}

            {/* Requests Tab */}
            {activeTab === 'requests' && <DocumentRequests folderId={id} />}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && <FolderTimeline folderId={id} />}

            {/* Access Tab */}
            {activeTab === 'access' && (
              <div>
                {loadingAccesses ? (
                  <div className="text-center py-8 text-gray-500">Chargement...</div>
                ) : clientAccesses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="text-3xl mb-3">🔐</div>
                    <h4 className="font-medium text-gray-900">Aucun accès client</h4>
                    <p className="text-gray-500 text-sm mt-1">
                      Invitez des clients à accéder à ce dossier
                    </p>
                    <Link
                      to="/settings/client-access"
                      className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Gérer les accès
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientAccesses.map((access) => (
                      <div
                        key={access.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{access.email}</p>
                          <p className="text-sm text-gray-500">
                            {access.isActivated ? 'Compte activé' : 'En attente d\'activation'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            access.isActivated
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {access.isActivated ? 'Actif' : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  );
}
