import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  COMPLETED: { label: 'Complété', color: 'bg-green-100 text-green-700', icon: '✓' },
  CANCELLED: { label: 'Annulé', color: 'bg-gray-100 text-gray-600', icon: '✕' },
  EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-700', icon: '⚠' },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Basse', color: 'text-gray-500' },
  NORMAL: { label: 'Normale', color: 'text-blue-600' },
  HIGH: { label: 'Haute', color: 'text-orange-600' },
  URGENT: { label: 'Urgente', color: 'text-red-600 font-semibold' },
};

export default function DocumentRequests({ folderId }) {
  const { token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);

  const emptyForm = {
    title: '',
    description: '',
    priority: 'NORMAL',
    dueDate: '',
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (folderId) {
      fetchRequests();
    }
  }, [folderId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/document-requests/folder/${folderId}`, {
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

  const handleOpenModal = (request = null) => {
    if (request) {
      setEditingRequest(request);
      setForm({
        title: request.title,
        description: request.description || '',
        priority: request.priority,
        dueDate: request.dueDate ? request.dueDate.split('T')[0] : '',
      });
    } else {
      setEditingRequest(null);
      setForm(emptyForm);
    }
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRequest(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        folderId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };

      const url = editingRequest
        ? `${API_URL}/document-requests/${editingRequest.id}`
        : `${API_URL}/document-requests`;

      const res = await fetch(url, {
        method: editingRequest ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }

      handleCloseModal();
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (request) => {
    if (!confirm('Marquer cette demande comme complétée ?')) return;

    try {
      await fetch(`${API_URL}/document-requests/${request.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      fetchRequests();
    } catch (err) {
      console.error('Error completing request:', err);
    }
  };

  const handleCancel = async (request) => {
    if (!confirm('Annuler cette demande ?')) return;

    try {
      await fetch(`${API_URL}/document-requests/${request.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRequests();
    } catch (err) {
      console.error('Error canceling request:', err);
    }
  };

  const handleRemind = async (request) => {
    setSendingReminder(request.id);
    try {
      await fetch(`${API_URL}/document-requests/${request.id}/remind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRequests();
    } catch (err) {
      console.error('Error sending reminder:', err);
    } finally {
      setSendingReminder(null);
    }
  };

  const handleDelete = async (request) => {
    if (!confirm(`Supprimer la demande "${request.title}" ?`)) return;

    try {
      await fetch(`${API_URL}/document-requests/${request.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {requests.filter((r) => r.status === 'PENDING').length} demande(s) en attente
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
        >
          <span>+</span>
          Nouvelle demande
        </button>
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <div className="text-3xl mb-3">📋</div>
          <h4 className="font-medium text-gray-900">Aucune demande de pièce</h4>
          <p className="text-gray-500 text-sm mt-1">
            Créez des demandes pour solliciter des documents auprès du client
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Créer une demande
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
            const priority = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.NORMAL;
            const daysRemaining = getDaysRemaining(request.dueDate);
            const isOverdue = daysRemaining !== null && daysRemaining < 0 && request.status === 'PENDING';

            return (
              <div
                key={request.id}
                className={`p-4 rounded-lg border ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                } hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                      <span className={`text-xs ${priority.color}`}>
                        Priorité {priority.label.toLowerCase()}
                      </span>
                      {request.reminderCount > 0 && (
                        <span className="text-xs text-gray-400">
                          ({request.reminderCount} relance{request.reminderCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900">{request.title}</h4>
                    {request.description && (
                      <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {request.dueDate && (
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {isOverdue
                            ? `En retard de ${Math.abs(daysRemaining)} jour(s)`
                            : daysRemaining === 0
                            ? "Échéance aujourd'hui"
                            : `Échéance dans ${daysRemaining} jour(s)`}
                        </span>
                      )}
                      <span>
                        Créé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {request.responseDocument && (
                      <div className="mt-2 p-2 bg-green-50 rounded flex items-center gap-2 text-sm text-green-700">
                        <span>📎</span>
                        <span>Document reçu: {request.responseDocument.name}</span>
                      </div>
                    )}
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleRemind(request)}
                        disabled={sendingReminder === request.id}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                        title="Envoyer une relance"
                      >
                        {sendingReminder === request.id ? '...' : '🔔'}
                      </button>
                      <button
                        onClick={() => handleComplete(request)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        title="Marquer comme complété"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleOpenModal(request)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleCancel(request)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Annuler"
                      >
                        ⊘
                      </button>
                      <button
                        onClick={() => handleDelete(request)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRequest ? 'Modifier la demande' : 'Nouvelle demande de pièce'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la demande *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Kbis de moins de 3 mois"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Instructions détaillées pour le client..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Basse</option>
                    <option value="NORMAL">Normale</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date limite
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingRequest ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
