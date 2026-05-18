import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function LegalInfo() {
  const { user } = useContext(AuthContext);
  const [legalInfo, setLegalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState({ signature: false, cachet: false });

  const signatureInputRef = useRef(null);
  const cachetInputRef = useRef(null);

  useEffect(() => {
    fetchLegalInfo();
  }, []);

  const fetchLegalInfo = async () => {
    try {
      const { data } = await api.get('/legal-info');
      const info = data.data || {};
      setLegalInfo(info);
    } catch (error) {
      console.error('Error fetching legal info:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.put('/legal-info', legalInfo);

      setMessage({ type: 'success', text: 'Informations enregistrées avec succès' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setLegalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (type, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Seules les images sont acceptées (PNG, JPEG)' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La taille maximale est de 5MB' });
      return;
    }

    setUploading((prev) => ({ ...prev, [type]: true }));
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append(type, file);

      await api.post(`/legal-info/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchLegalInfo();
      setMessage({ type: 'success', text: `${type === 'signature' ? 'Signature' : 'Cachet'} uploadé(e) avec succès` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Erreur lors de l\'upload' });
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDeleteFile = async (type) => {
    if (!confirm(`Supprimer ${type === 'signature' ? 'la signature' : 'le cachet'} ?`)) return;

    try {
      await api.delete(`/legal-info/${type}`);
      await fetchLegalInfo();
      setMessage({ type: 'success', text: `${type === 'signature' ? 'Signature' : 'Cachet'} supprimé(e)` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Légal Avocat</h1>
          <p className="text-gray-500 mt-1">
            Configurez vos informations professionnelles, signature et mentions légales
          </p>
          {!isAdmin && (
            <div className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Seuls les administrateurs peuvent modifier ces informations
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <span>{message.type === 'success' ? '✓' : '✗'}</span>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'info', label: 'Informations', icon: '📋' },
              { id: 'files', label: 'Signature & Cachet', icon: '✍️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          {/* Tab: Informations */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialités
                </label>
                <input
                  type="text"
                  value={legalInfo?.specialites?.join(', ') || ''}
                  onChange={(e) =>
                    handleChange(
                      'specialites',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Droit des affaires, Droit des sociétés, Droit commercial..."
                />
                <p className="text-xs text-gray-500 mt-1">Séparez les spécialités par des virgules</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Assurance responsabilité civile professionnelle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'assureur
                    </label>
                    <input
                      type="text"
                      value={legalInfo?.assuranceRC || ''}
                      onChange={(e) => handleChange('assuranceRC', e.target.value)}
                      disabled={!isAdmin}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Ex: AXA, Allianz..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° de police
                    </label>
                    <input
                      type="text"
                      value={legalInfo?.numeroPolice || ''}
                      onChange={(e) => handleChange('numeroPolice', e.target.value)}
                      disabled={!isAdmin}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="N° de contrat"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Signature & Cachet */}
          {activeTab === 'files' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Signature */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Signature numérique</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Votre signature sera utilisée pour les documents générés
                  </p>

                  <input
                    type="file"
                    ref={signatureInputRef}
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleFileUpload('signature', e.target.files?.[0])}
                    className="hidden"
                  />

                  <div
                    onClick={() => isAdmin && signatureInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isAdmin ? 'border-gray-300 hover:border-blue-400 cursor-pointer' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {uploading.signature ? (
                      <div className="py-4">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-500">Upload en cours...</p>
                      </div>
                    ) : legalInfo?.signaturePath ? (
                      <div className="space-y-3">
                        <img
                          src={`${import.meta.env.VITE_API_URL || '/api'}/legal-info/signature`}
                          alt="Signature"
                          className="max-h-24 mx-auto border rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="text-green-600 font-medium">✓ Signature enregistrée</div>
                        {isAdmin && (
                          <div className="flex justify-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); signatureInputRef.current?.click(); }}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile('signature'); }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">✍️</div>
                        <div className="text-gray-600">
                          {isAdmin ? 'Cliquez pour uploader votre signature' : 'Aucune signature'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">PNG ou JPEG, max 5MB</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cachet */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Cachet du cabinet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Le cachet sera apposé sur les documents officiels
                  </p>

                  <input
                    type="file"
                    ref={cachetInputRef}
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleFileUpload('cachet', e.target.files?.[0])}
                    className="hidden"
                  />

                  <div
                    onClick={() => isAdmin && cachetInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isAdmin ? 'border-gray-300 hover:border-blue-400 cursor-pointer' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {uploading.cachet ? (
                      <div className="py-4">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-500">Upload en cours...</p>
                      </div>
                    ) : legalInfo?.cachetPath ? (
                      <div className="space-y-3">
                        <img
                          src={`${import.meta.env.VITE_API_URL || '/api'}/legal-info/cachet`}
                          alt="Cachet"
                          className="max-h-24 mx-auto border rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="text-green-600 font-medium">✓ Cachet enregistré</div>
                        {isAdmin && (
                          <div className="flex justify-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); cachetInputRef.current?.click(); }}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile('cachet'); }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">🔏</div>
                        <div className="text-gray-600">
                          {isAdmin ? 'Cliquez pour uploader le cachet' : 'Aucun cachet'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">PNG ou JPEG, max 5MB</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Conseil :</strong> Pour une meilleure qualité, utilisez des images PNG avec fond transparent.
                  La signature et le cachet seront automatiquement intégrés dans les documents générés.
                </p>
              </div>
            </div>
          )}

          {/* Save button */}
          {isAdmin && (
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
