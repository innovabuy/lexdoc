import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  COMPLETED: { label: 'Envoyé', color: 'bg-green-100 text-green-700', icon: '✓' },
  CANCELLED: { label: 'Annulé', color: 'bg-gray-100 text-gray-600', icon: '✕' },
  EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-700', icon: '⚠' },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Basse', color: 'text-gray-500', bg: 'border-gray-200' },
  NORMAL: { label: 'Normale', color: 'text-blue-600', bg: 'border-blue-200' },
  HIGH: { label: 'Haute', color: 'text-orange-600', bg: 'border-orange-300' },
  URGENT: { label: 'Urgente', color: 'text-red-600', bg: 'border-red-300 bg-red-50' },
};

export default function DocumentRequests() {
  const { token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(null);
  const [uploadForm, setUploadForm] = useState({ file: null, notes: '' });
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/extranet/document-requests?pageSize=50`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 50 Mo');
        return;
      }
      setUploadForm({ ...uploadForm, file });
      setError(null);
    }
  };

  const handleUpload = async (requestId) => {
    if (!uploadForm.file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setUploadingId(requestId);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      if (uploadForm.notes) {
        formData.append('notes', uploadForm.notes);
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      const response = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(JSON.parse(xhr.responseText).error?.message || 'Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));

        xhr.open('POST', `${API_URL}/extranet/document-requests/${requestId}/respond`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      setShowUploadModal(null);
      setUploadForm({ file: null, notes: '' });
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  };

  const openUploadModal = (request) => {
    setShowUploadModal(request);
    setUploadForm({ file: null, notes: '' });
    setError(null);
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

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes de pièces</h1>
          <p className="text-gray-500 mt-1">
            Documents demandés par votre avocat
          </p>
        </div>

        {/* Alert for pending requests */}
        {pendingCount > 0 && filter !== 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-yellow-800">
                {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente
              </p>
              <button
                onClick={() => setFilter('PENDING')}
                className="text-sm text-yellow-700 hover:text-yellow-900 underline mt-1"
              >
                Voir les demandes en attente
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'PENDING', label: 'En attente', count: pendingCount },
            { value: 'COMPLETED', label: 'Envoyés' },
            { value: 'all', label: 'Tous' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  filter === f.value ? 'bg-white/20' : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Requests list */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900">Aucune demande</h3>
            <p className="text-gray-500 mt-1">
              {filter !== 'all'
                ? 'Aucune demande avec ce statut'
                : 'Vous n\'avez pas de demandes de pièces'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
              const priority = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.NORMAL;
              const daysRemaining = getDaysRemaining(request.dueDate);
              const isOverdue = daysRemaining !== null && daysRemaining < 0 && request.status === 'PENDING';
              const isUrgent = request.priority === 'URGENT' || request.priority === 'HIGH';

              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${
                    isOverdue ? 'border-red-300 bg-red-50' :
                    isUrgent && request.status === 'PENDING' ? priority.bg : 'border-gray-200'
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          {request.status === 'PENDING' && (
                            <span className={`text-xs font-medium ${priority.color}`}>
                              Priorité {priority.label.toLowerCase()}
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900 text-lg">{request.title}</h3>

                        {request.description && (
                          <p className="text-gray-600 mt-2">{request.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                          {request.dueDate && (
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                              📅 {isOverdue
                                ? `En retard de ${Math.abs(daysRemaining)} jour(s)`
                                : daysRemaining === 0
                                  ? "Échéance aujourd'hui"
                                  : `Échéance dans ${daysRemaining} jour(s)`
                              }
                            </span>
                          )}
                          <span>
                            Demandé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                          {request.createdBy && (
                            <span>
                              par {request.createdBy.firstName} {request.createdBy.lastName}
                            </span>
                          )}
                        </div>

                        {/* Response info */}
                        {request.responseDocument && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-green-700">
                              <span>✓</span>
                              <span className="font-medium">Document envoyé</span>
                            </div>
                            <p className="text-sm text-green-600 mt-1">
                              {request.responseDocument.name} - {new Date(request.responseDate).toLocaleDateString('fr-FR')}
                            </p>
                            {request.responseNotes && (
                              <p className="text-sm text-gray-600 mt-1 italic">
                                "{request.responseNotes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      {request.status === 'PENDING' && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => openUploadModal(request)}
                            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                              isUrgent || isOverdue
                                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                                : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                          >
                            <span>📤</span>
                            Envoyer le document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Envoyer un document</h2>
              <p className="text-gray-500 mt-1">{showUploadModal.title}</p>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* File drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  uploadForm.file
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                />
                {uploadForm.file ? (
                  <div>
                    <div className="text-4xl mb-2">✓</div>
                    <p className="font-medium text-green-700">{uploadForm.file.name}</p>
                    <p className="text-sm text-green-600 mt-1">
                      {(uploadForm.file.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Cliquez pour changer de fichier</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📄</div>
                    <p className="font-medium text-gray-700">Cliquez pour sélectionner un fichier</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, Word, Excel, Images (max 50 Mo)</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ajoutez un commentaire si nécessaire..."
                />
              </div>

              {/* Progress bar */}
              {uploadingId && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Envoi en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(null)}
                  disabled={uploadingId}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpload(showUploadModal.id)}
                  disabled={!uploadForm.file || uploadingId}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingId ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
