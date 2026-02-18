import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExtranetAuthContext } from '../../contexts/ExtranetAuthContext';
import './ExtranetAuth.css';

export default function ExtranetLogin() {
  const { login, isAuthenticated } = useContext(ExtranetAuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/extranet/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      // If profile incomplete, redirect to wizard
      if (data.access?.profileCompletionPercent < 100 && !data.access?.profileSubmittedAt) {
        navigate('/extranet/profile', { replace: true });
      } else {
        navigate('/extranet/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Identifiants incorrects';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exa-page">
      <div className="exa-card">
        <div className="exa-logo">
          <span className="exa-logo-icon">&#x1F537;</span>
          <span className="exa-logo-text">Espace client sécurisé</span>
        </div>

        <h1 className="exa-title">Connexion</h1>
        <p className="exa-subtitle">
          Accédez à votre espace pour consulter vos dossiers et documents.
        </p>

        {error && <div className="exa-error">{error}</div>}

        <form onSubmit={handleSubmit} className="exa-form">
          <div className="exa-field">
            <label className="exa-label">Email</label>
            <input
              type="email"
              className="exa-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              required
              autoFocus
            />
          </div>

          <div className="exa-field">
            <label className="exa-label">Mot de passe</label>
            <input
              type="password"
              className="exa-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
            />
          </div>

          <button type="submit" className="exa-btn-primary" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="exa-footer-text">
          Première visite ? Cliquez sur le lien dans l'email d'invitation.
        </p>
      </div>
    </div>
  );
}
