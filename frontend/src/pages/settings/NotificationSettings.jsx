import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function NotificationSettings() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    emailSignatures: true,
    emailDocuments: true,
    emailDeadlines: true,
    emailMessages: true,
    emailDigest: false,
    digestFrequency: 'DAILY',
    pushEnabled: true,
    pushSignatures: true,
    pushDocuments: true,
    pushDeadlines: true,
    pushMessages: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications/preferences');
      if (data.data) {
        setPrefs(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/notifications/preferences', prefs);
      success('Preferences sauvegardees');
    } catch (err) {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Parametres de notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerez vos preferences de notifications par email et push
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notifications par email
            </h2>

            <div className="space-y-4">
              <ToggleItem
                label="Signatures"
                description="Recevoir des emails pour les demandes de signature et les documents signes"
                checked={prefs.emailSignatures}
                onChange={() => handleToggle('emailSignatures')}
              />
              <ToggleItem
                label="Documents"
                description="Recevoir des emails pour les nouveaux documents et les demandes"
                checked={prefs.emailDocuments}
                onChange={() => handleToggle('emailDocuments')}
              />
              <ToggleItem
                label="Echeances"
                description="Recevoir des rappels pour les echeances a venir"
                checked={prefs.emailDeadlines}
                onChange={() => handleToggle('emailDeadlines')}
              />
              <ToggleItem
                label="Messages"
                description="Recevoir des notifications pour les nouveaux messages"
                checked={prefs.emailMessages}
                onChange={() => handleToggle('emailMessages')}
              />

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <ToggleItem
                  label="Resume quotidien"
                  description="Recevoir un resume par email au lieu de notifications individuelles"
                  checked={prefs.emailDigest}
                  onChange={() => handleToggle('emailDigest')}
                />

                {prefs.emailDigest && (
                  <div className="ml-12 mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frequence
                    </label>
                    <select
                      value={prefs.digestFrequency}
                      onChange={(e) => handleChange('digestFrequency', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="DAILY">Quotidien</option>
                      <option value="WEEKLY">Hebdomadaire</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notifications push
            </h2>

            <div className="space-y-4">
              <ToggleItem
                label="Activer les notifications push"
                description="Recevoir des notifications dans votre navigateur"
                checked={prefs.pushEnabled}
                onChange={() => handleToggle('pushEnabled')}
              />

              {prefs.pushEnabled && (
                <div className="ml-6 space-y-4 pt-2">
                  <ToggleItem
                    label="Signatures"
                    checked={prefs.pushSignatures}
                    onChange={() => handleToggle('pushSignatures')}
                  />
                  <ToggleItem
                    label="Documents"
                    checked={prefs.pushDocuments}
                    onChange={() => handleToggle('pushDocuments')}
                  />
                  <ToggleItem
                    label="Echeances"
                    checked={prefs.pushDeadlines}
                    onChange={() => handleToggle('pushDeadlines')}
                  />
                  <ToggleItem
                    label="Messages"
                    checked={prefs.pushMessages}
                    onChange={() => handleToggle('pushMessages')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder les preferences'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleItem({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
