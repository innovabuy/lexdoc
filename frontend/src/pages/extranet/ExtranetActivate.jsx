import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExtranetAuthContext } from '../../contexts/ExtranetAuthContext';
import { verifyToken } from '../../services/extranetApi';
import './ExtranetAuth.css';

export default function ExtranetActivate() {
  const { token } = useParams();
  const { activate } = useContext(ExtranetAuthContext);
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState(null);
  const [tokenError, setTokenError] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    verifyToken(token)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data.valid) {
          setTokenData(data);
        } else {
          setTokenError(true);
        }
      })
      .catch(() => setTokenError(true))
      .finally(() => setVerifying(false));
  }, [token]);

  const validatePassword = (pwd) => {
    if (pwd.length < 12) return 'Le mot de passe doit contenir au moins 12 caractères';
    if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[a-z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/[0-9]/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);
    try {
      await activate(token, password);
      navigate('/extranet/profile', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Erreur lors de l\'activation';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="exa-page">
        <div className="exa-card">
          <div className="exa-logo">
            <span className="exa-logo-icon">&#x1F537;</span>
          </div>
          <p className="exa-subtitle">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="exa-page">
        <div className="exa-card">
          <div className="exa-logo">
            <span className="exa-logo-icon">&#x1F537;</span>
          </div>
          <h1 className="exa-title">Lien invalide ou expiré</h1>
          <p className="exa-subtitle">
            Ce lien d'activation n'est plus valide. Veuillez contacter votre cabinet pour
            recevoir une nouvelle invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="exa-page">
      <div className="exa-card">
        <div className="exa-logo">
          <span className="exa-logo-icon">&#x1F537;</span>
          <span className="exa-logo-text">{tokenData?.tenant?.name || 'Cabinet'}</span>
        </div>

        <h1 className="exa-title">Activation de votre espace client</h1>
        <p className="exa-subtitle">
          Bienvenue ! Définissez votre mot de passe pour accéder à votre espace.
        </p>

        {error && <div className="exa-error">{error}</div>}

        <form onSubmit={handleSubmit} className="exa-form">
          <div className="exa-field">
            <label className="exa-label">Email</label>
            <input
              type="email"
              className="exa-input"
              value={tokenData?.email || ''}
              readOnly
              disabled
            />
          </div>

          <div className="exa-field">
            <label className="exa-label">Mot de passe</label>
            <input
              type="password"
              className="exa-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="12 caractères minimum"
              required
              autoFocus
            />
            <div className="exa-hint">
              Min. 12 caractères, 1 majuscule, 1 minuscule, 1 chiffre
            </div>
          </div>

          <div className="exa-field">
            <label className="exa-label">Confirmer le mot de passe</label>
            <input
              type="password"
              className="exa-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              required
            />
          </div>

          <button type="submit" className="exa-btn-primary" disabled={loading}>
            {loading ? 'Activation...' : 'Activer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
