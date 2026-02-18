import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Activate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/extranet/verify-token/${token}`);
      const data = await res.json();

      if (data.success && data.data.valid) {
        setTokenInfo(data.data);
      } else {
        setError('Ce lien d\'activation est invalide ou a expiré.');
      }
    } catch (err) {
      setError('Erreur de vérification du lien.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Le mot de passe ne respecte pas les exigences de sécurité');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setActivating(true);

    try {
      const res = await fetch(`${API_URL}/extranet/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError('Erreur lors de l\'activation');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Compte activé !</h1>
          <p className="text-gray-500 mt-2">
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  if (error && !tokenInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lien invalide</h1>
          <p className="text-gray-500 mt-2">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Activez votre compte</h1>
          {tokenInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Dossier : <strong>{tokenInfo.folderTitle}</strong></p>
              <p className="text-sm text-gray-600">Cabinet : <strong>{tokenInfo.tenant?.name}</strong></p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Créez votre mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Minimum 12 caractères"
              required
              minLength={12}
            />
            {/* Password requirements checklist */}
            {password.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {[
                  { label: '12 caractères minimum', met: password.length >= 12 },
                  { label: '1 lettre majuscule', met: /[A-Z]/.test(password) },
                  { label: '1 lettre minuscule', met: /[a-z]/.test(password) },
                  { label: '1 chiffre', met: /[0-9]/.test(password) },
                  { label: '1 caractère spécial (recommandé)', met: /[^A-Za-z0-9]/.test(password), recommended: true },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={req.met ? 'text-green-500' : req.recommended ? 'text-yellow-500' : 'text-red-500'}>
                      {req.met ? '✓' : req.recommended ? '○' : '✕'}
                    </span>
                    <span className={req.met ? 'text-green-700' : req.recommended ? 'text-yellow-600' : 'text-red-600'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmez le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={activating}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {activating ? 'Activation...' : 'Activer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
