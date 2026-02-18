import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ReminderBadge } from '../components/ReminderIndicator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Signatures() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('signatures');
  const [signatures, setSignatures] = useState([]);
  const [lrarShipments, setLrarShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [lrarStats, setLrarStats] = useState({});

  // Modal states
  const [showCreateSignature, setShowCreateSignature] = useState(false);
  const [showCreateLRAR, setShowCreateLRAR] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [signers, setSigners] = useState([{ email: '', firstName: '', lastName: '', signerType: 'CLIENT' }]);
  const [lrarRecipient, setLrarRecipient] = useState({
    name: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'FR',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [signaturesRes, lrarRes, sigStatsRes, lrarStatsRes, docsRes] = await Promise.all([
        fetch(`${API_URL}/signatures?pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/lrar?pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/signatures/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/lrar/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/documents?pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const signaturesData = await signaturesRes.json();
      const lrarData = await lrarRes.json();
      const sigStatsData = await sigStatsRes.json();
      const lrarStatsData = await lrarStatsRes.json();
      const docsData = await docsRes.json();

      setSignatures(signaturesData.data || []);
      setLrarShipments(lrarData.data || []);
      setStats(sigStatsData.data || {});
      setLrarStats(lrarStatsData.data || {});
      setDocuments(docsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSignatureRequest = async () => {
    if (!selectedDocument) {
      alert('Veuillez selectionner un document');
      return;
    }

    const validSigners = signers.filter(s => s.email && s.firstName && s.lastName);
    if (validSigners.length === 0) {
      alert('Veuillez ajouter au moins un signataire valide');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/signatures`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocument,
          signers: validSigners,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Demande de signature envoyee!');
        setShowCreateSignature(false);
        setSigners([{ email: '', firstName: '', lastName: '', signerType: 'CLIENT' }]);
        setSelectedDocument(null);
        fetchData();
      } else {
        alert('Erreur: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error creating signature:', error);
      alert('Erreur lors de la creation');
    } finally {
      setCreating(false);
    }
  };

  const createLRAR = async () => {
    if (!selectedDocument) {
      alert('Veuillez selectionner un document');
      return;
    }

    if (!lrarRecipient.name || !lrarRecipient.address || !lrarRecipient.postalCode || !lrarRecipient.city) {
      alert('Veuillez remplir tous les champs du destinataire');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/lrar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocument,
          recipientName: lrarRecipient.name,
          recipientAddress: lrarRecipient.address,
          recipientPostalCode: lrarRecipient.postalCode,
          recipientCity: lrarRecipient.city,
          recipientCountry: lrarRecipient.country,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('LRAR envoyee avec succes!');
        setShowCreateLRAR(false);
        setLrarRecipient({ name: '', address: '', postalCode: '', city: '', country: 'FR' });
        setSelectedDocument(null);
        fetchData();
      } else {
        alert('Erreur: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error creating LRAR:', error);
      alert('Erreur lors de l\'envoi');
    } finally {
      setCreating(false);
    }
  };

  const resendSignature = async (signatureId) => {
    try {
      const res = await fetch(`${API_URL}/signatures/${signatureId}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        alert('Relance envoyee!');
        fetchData();
      } else {
        alert('Erreur: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error resending:', error);
      alert('Erreur lors de la relance');
    }
  };

  const cancelSignature = async (signatureId) => {
    if (!confirm('Annuler cette demande de signature?')) return;

    try {
      const res = await fetch(`${API_URL}/signatures/${signatureId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Erreur: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error cancelling:', error);
    }
  };

  const addSigner = () => {
    setSigners([...signers, { email: '', firstName: '', lastName: '', signerType: 'CLIENT' }]);
  };

  const removeSigner = (index) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const updateSigner = (index, field, value) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    SIGNED: 'bg-green-100 text-green-700',
    REFUSED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  const statusLabels = {
    PENDING: 'En attente',
    SIGNED: 'Signe',
    REFUSED: 'Refuse',
    EXPIRED: 'Expire',
    CANCELLED: 'Annule',
  };

  const lrarStatusColors = {
    PREPARING: 'bg-gray-100 text-gray-600',
    SENT: 'bg-blue-100 text-blue-700',
    IN_TRANSIT: 'bg-yellow-100 text-yellow-700',
    DELIVERED: 'bg-green-100 text-green-700',
    RETURNED: 'bg-red-100 text-red-700',
    ERROR: 'bg-red-100 text-red-700',
  };

  const lrarStatusLabels = {
    PREPARING: 'En preparation',
    SENT: 'Envoye',
    IN_TRANSIT: 'En transit',
    DELIVERED: 'Distribue',
    RETURNED: 'Retourne',
    ERROR: 'Erreur',
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Signatures & LRAR</h1>
            <p className="text-gray-500 mt-1">Gerez vos signatures electroniques et courriers recommandes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateSignature(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>✍️</span> Nouvelle signature
            </button>
            <button
              onClick={() => setShowCreateLRAR(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <span>📬</span> Envoyer LRAR
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('signatures')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'signatures'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Signatures electroniques ({signatures.length})
            </button>
            <button
              onClick={() => setActiveTab('lrar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lrar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              LRAR ({lrarShipments.length})
            </button>
          </nav>
        </div>

        {/* Stats */}
        {activeTab === 'signatures' ? (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <p className="text-sm text-yellow-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <p className="text-sm text-green-600">Signees</p>
              <p className="text-2xl font-bold text-green-700">{stats.signed || 0}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4">
              <p className="text-sm text-red-600">Refusees</p>
              <p className="text-2xl font-bold text-red-700">{stats.refused || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <p className="text-sm text-blue-600">Taux completion</p>
              <p className="text-2xl font-bold text-blue-700">{stats.completionRate || 0}%</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{lrarStats.total || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <p className="text-sm text-blue-600">Envoyes</p>
              <p className="text-2xl font-bold text-blue-700">{lrarStats.sent || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <p className="text-sm text-yellow-600">En transit</p>
              <p className="text-2xl font-bold text-yellow-700">{lrarStats.inTransit || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <p className="text-sm text-green-600">Distribues</p>
              <p className="text-2xl font-bold text-green-700">{lrarStats.delivered || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <p className="text-sm text-blue-600">Taux livraison</p>
              <p className="text-2xl font-bold text-blue-700">{lrarStats.deliveryRate || 0}%</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : activeTab === 'signatures' ? (
            signatures.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl">✍️</span>
                <p className="mt-2">Aucune signature electronique</p>
                <button
                  onClick={() => setShowCreateSignature(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Creer une demande
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Signataire</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Relances</th>
                    <th className="px-6 py-4">Invite le</th>
                    <th className="px-6 py-4">Signe le</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signatures.map((signature) => (
                    <tr key={signature.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">📄</span>
                          <span className="font-medium">{signature.document?.name || 'Document'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{signature.signerName}</p>
                        <p className="text-sm text-gray-500">{signature.signerEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {signature.signerType === 'CLIENT' ? 'Client' :
                           signature.signerType === 'LAWYER' ? 'Avocat' : 'Tiers'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm ${statusColors[signature.status] || 'bg-gray-100'}`}>
                          {statusLabels[signature.status] || signature.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ReminderBadge reminderCount={signature.reminders?.length || 0} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(signature.invitedAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {signature.signedAt
                          ? new Date(signature.signedAt).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {signature.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => resendSignature(signature.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Relancer
                              </button>
                              <button
                                onClick={() => cancelSignature(signature.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          {signature.status === 'SIGNED' && signature.signatureUrl && (
                            <a
                              href={`${API_URL}/signatures/${signature.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Telecharger
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : lrarShipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl">📬</span>
              <p className="mt-2">Aucun courrier recommande</p>
              <button
                onClick={() => setShowCreateLRAR(true)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Envoyer un LRAR
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Destinataire</th>
                  <th className="px-6 py-4">N° Suivi</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Envoye le</th>
                  <th className="px-6 py-4">Distribue le</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lrarShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📄</span>
                        <span className="font-medium">{shipment.document?.name || 'Document'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{shipment.recipientName}</p>
                      <p className="text-sm text-gray-500">
                        {shipment.recipientPostalCode} {shipment.recipientCity}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {shipment.trackingNumber || '-'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm ${lrarStatusColors[shipment.status] || 'bg-gray-100'}`}>
                        {lrarStatusLabels[shipment.status] || shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {shipment.sentAt
                        ? new Date(shipment.sentAt).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {shipment.deliveredAt
                        ? new Date(shipment.deliveredAt).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {shipment.trackingNumber && (
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Suivre
                          </button>
                        )}
                        {shipment.proofUrl && (
                          <a
                            href={`${API_URL}/lrar/${shipment.id}/proof`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            AR
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Signature Modal */}
      {showCreateSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Nouvelle demande de signature</h2>
              <button onClick={() => setShowCreateSignature(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document a signer *</label>
                <select
                  value={selectedDocument || ''}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selectionner un document --</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Signers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Signataires *</label>
                  <button
                    type="button"
                    onClick={addSigner}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Ajouter un signataire
                  </button>
                </div>
                <div className="space-y-4">
                  {signers.map((signer, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-sm">Signataire {index + 1}</span>
                        {signers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSigner(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Prenom</label>
                          <input
                            type="text"
                            value={signer.firstName}
                            onChange={(e) => updateSigner(index, 'firstName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Jean"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nom</label>
                          <input
                            type="text"
                            value={signer.lastName}
                            onChange={(e) => updateSigner(index, 'lastName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Dupont"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={signer.email}
                            onChange={(e) => updateSigner(index, 'email', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="jean.dupont@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Type</label>
                          <select
                            value={signer.signerType}
                            onChange={(e) => updateSigner(index, 'signerType', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="CLIENT">Client</option>
                            <option value="LAWYER">Avocat</option>
                            <option value="THIRD_PARTY">Tiers</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateSignature(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={createSignatureRequest}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create LRAR Modal */}
      {showCreateLRAR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Envoyer un LRAR</h2>
              <button onClick={() => setShowCreateLRAR(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Document Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document a envoyer *</label>
                <select
                  value={selectedDocument || ''}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selectionner un document --</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du destinataire *</label>
                <input
                  type="text"
                  value={lrarRecipient.name}
                  onChange={(e) => setLrarRecipient({ ...lrarRecipient, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="M. Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                <input
                  type="text"
                  value={lrarRecipient.address}
                  onChange={(e) => setLrarRecipient({ ...lrarRecipient, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123 rue de la Paix"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code postal *</label>
                  <input
                    type="text"
                    value={lrarRecipient.postalCode}
                    onChange={(e) => setLrarRecipient({ ...lrarRecipient, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="75001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                  <input
                    type="text"
                    value={lrarRecipient.city}
                    onChange={(e) => setLrarRecipient({ ...lrarRecipient, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Paris"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateLRAR(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={createLRAR}
                disabled={creating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? 'Envoi...' : 'Envoyer le LRAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
