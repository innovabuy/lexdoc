import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`${API_URL}/extranet/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        navigate('/documents');
        return;
      }

      const data = await res.json();
      setDocument(data.data);
    } catch (error) {
      console.error('Error fetching document:', error);
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/extranet/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.data?.url) {
        window.open(data.data.url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-700',
      SIGNED: 'bg-green-100 text-green-700',
      SENT: 'bg-blue-100 text-blue-700',
    };
    const labels = {
      DRAFT: 'Brouillon',
      PENDING_SIGNATURE: 'En attente de signature',
      SIGNED: 'Signé',
      SENT: 'Envoyé',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.DRAFT}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Document non trouvé</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux documents
        </button>

        {/* Document header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
                📄
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{document.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {getStatusBadge(document.status)}
                  <span className="text-sm text-gray-500">{document.type}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Téléchargement...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Télécharger
                </>
              )}
            </button>
          </div>

          {document.description && (
            <p className="mt-4 text-gray-600">{document.description}</p>
          )}

          <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Date de création</span>
              <p className="font-medium text-gray-900">
                {new Date(document.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Type de fichier</span>
              <p className="font-medium text-gray-900">{document.mimeType}</p>
            </div>
            {document.signatureDeadline && (
              <div>
                <span className="text-gray-500">Date limite de signature</span>
                <p className="font-medium text-gray-900">
                  {new Date(document.signatureDeadline).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Signature section */}
        {document.requiresSignature && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Signatures</h2>

            {document.signatures?.length === 0 ? (
              <p className="text-gray-500">Aucune signature requise</p>
            ) : (
              <div className="space-y-3">
                {document.signatures?.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{sig.signerName}</div>
                      <div className="text-sm text-gray-500">{sig.signerEmail}</div>
                    </div>
                    <div className="text-right">
                      {sig.status === 'SIGNED' ? (
                        <div>
                          <span className="text-green-600 font-medium">Signé</span>
                          <div className="text-xs text-gray-500">
                            {new Date(sig.signedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ) : sig.status === 'PENDING' ? (
                        <span className="text-yellow-600 font-medium">En attente</span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          {sig.status === 'REFUSED' ? 'Refusé' : 'Expiré'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {document.status === 'PENDING_SIGNATURE' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✍️</span>
                  <div>
                    <h3 className="font-medium text-yellow-800">Signature requise</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Ce document nécessite votre signature. Vous recevrez un email avec le lien de
                      signature.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tracking/Timeline */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Historique du document</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-4">
              {/* Document created */}
              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm z-10">
                  📄
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-medium text-gray-900">Document cree</div>
                  <div className="text-sm text-gray-500">
                    {new Date(document.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Signature events */}
              {document.signatures?.map((sig) => (
                <div key={sig.id} className="flex items-start gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 ${
                    sig.status === 'SIGNED' ? 'bg-green-100' :
                    sig.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {sig.status === 'SIGNED' ? '✓' : sig.status === 'PENDING' ? '⏳' : '✕'}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="font-medium text-gray-900">
                      {sig.status === 'SIGNED' ? 'Signature completee' :
                       sig.status === 'PENDING' ? 'En attente de signature' :
                       sig.status === 'REFUSED' ? 'Signature refusee' : 'Signature expiree'}
                    </div>
                    <div className="text-sm text-gray-600">{sig.signerName}</div>
                    <div className="text-sm text-gray-500">
                      {sig.signedAt ? new Date(sig.signedAt).toLocaleString('fr-FR') :
                       sig.invitedAt ? new Date(sig.invitedAt).toLocaleString('fr-FR') : ''}
                    </div>
                  </div>
                </div>
              ))}

              {/* Reminders */}
              {document.tracking?.reminders?.map((reminder) => (
                <div key={reminder.id} className="flex items-start gap-4 relative">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm z-10">
                    📧
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="font-medium text-gray-900">
                      {reminder.type === 'FIRST_REMINDER' ? '1ere relance envoyee' :
                       reminder.type === 'SECOND_REMINDER' ? '2e relance envoyee' :
                       reminder.type === 'THIRD_REMINDER' ? '3e relance (urgente) envoyee' :
                       'Relance envoyee'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reminder.sentTo && <span>Destinataire: {reminder.sentTo}</span>}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(reminder.sentAt || reminder.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}

              {/* LRAR events */}
              {document.registeredMails?.map((mail) => (
                <div key={mail.id} className="flex items-start gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 ${
                    mail.status === 'DELIVERED' ? 'bg-green-100' :
                    mail.status === 'SENT' || mail.status === 'IN_TRANSIT' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}>
                    📬
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="font-medium text-gray-900">
                      {mail.status === 'DELIVERED' ? 'LRAR distribue' :
                       mail.status === 'IN_TRANSIT' ? 'LRAR en cours de distribution' :
                       mail.status === 'SENT' ? 'LRAR envoye' :
                       mail.status === 'RETURNED' ? 'LRAR retourne' : 'LRAR en preparation'}
                    </div>
                    {mail.trackingNumber && (
                      <div className="text-sm text-gray-600">
                        N° suivi: {mail.trackingNumber}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {mail.deliveredAt ? new Date(mail.deliveredAt).toLocaleString('fr-FR') :
                       mail.sentAt ? new Date(mail.sentAt).toLocaleString('fr-FR') :
                       new Date(mail.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
