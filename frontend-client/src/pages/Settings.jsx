import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { InstallButton } from '../components/InstallPrompt';
import {
  isPushSupported,
  isPushSubscribed,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getNotificationPermission,
} from '../services/pushNotifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Settings() {
  const { token, user, logout } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    setPushSupported(isPushSupported());
    setNotificationPermission(getNotificationPermission());
    if (isPushSupported()) {
      const subscribed = await isPushSubscribed();
      setPushSubscribed(subscribed);
    }
  };

  const handleToggleNotifications = async () => {
    setNotificationLoading(true);
    try {
      if (pushSubscribed) {
        await unsubscribeFromPushNotifications();
        setPushSubscribed(false);
      } else {
        const subscription = await subscribeToPushNotifications();
        setPushSubscribed(!!subscription);
        setNotificationPermission(getNotificationPermission());
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/extranet/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setSuccess('Mot de passe modifie avec succes!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (err) {
      setError('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
          <p className="text-gray-500 mt-1">Gerez votre compte et vos preferences</p>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Informations du compte</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500">Email</label>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Dossier</label>
              <p className="font-medium text-gray-900">{user?.folder?.title}</p>
            </div>
            {user?.client && (
              <div>
                <label className="block text-sm text-gray-500">Client</label>
                <p className="font-medium text-gray-900">
                  {user.client.companyName || `${user.client.firstName} ${user.client.lastName}`}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-500">Derniere connexion</label>
              <p className="font-medium text-gray-900">
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString('fr-FR')
                  : 'Premiere connexion'}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Changer le mot de passe</h2>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Minimum 8 caracteres"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>

        {/* Application Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Application</h2>

          {/* Install App */}
          <div className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Installer l'application</h3>
                <p className="text-sm text-gray-500">
                  Acces rapide depuis l'ecran d'accueil
                </p>
              </div>
              <InstallButton />
            </div>
          </div>

          {/* Push Notifications */}
          <div className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Notifications push</h3>
                <p className="text-sm text-gray-500">
                  {!pushSupported
                    ? 'Non supporte par ce navigateur'
                    : notificationPermission === 'denied'
                    ? 'Bloque dans les parametres du navigateur'
                    : pushSubscribed
                    ? 'Vous recevrez des notifications'
                    : 'Activez pour etre notifie des nouveaux documents'}
                </p>
              </div>
              {pushSupported && notificationPermission !== 'denied' && (
                <button
                  onClick={handleToggleNotifications}
                  disabled={notificationLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${pushSubscribed ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pushSubscribed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            </div>
            {notificationPermission === 'denied' && (
              <p className="mt-2 text-xs text-red-600">
                Pour activer les notifications, modifiez les permissions dans les parametres de votre navigateur.
              </p>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Deconnexion</h2>
          <p className="text-sm text-gray-500 mb-4">
            Vous serez redirige vers la page de connexion.
          </p>
          <button
            onClick={logout}
            className="w-full py-3 px-4 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
          >
            Se deconnecter
          </button>
        </div>
      </div>
    </Layout>
  );
}
