import { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ExtranetAuthContext } from '../../contexts/ExtranetAuthContext';
import './ExtranetLayout.css';

export default function ExtranetLayout() {
  const { access, logout } = useContext(ExtranetAuthContext);
  const navigate = useNavigate();

  const tenantName = access?.tenant?.name || 'Cabinet';
  const clientName = access?.client
    ? `${access.client.firstName || ''} ${access.client.lastName || ''}`.trim() || access.client.companyName || ''
    : access?.email || '';

  const handleLogout = () => {
    logout();
    navigate('/extranet/login');
  };

  return (
    <div className="ext-layout">
      {/* Top navbar */}
      <header className="ext-header">
        <div className="ext-header-inner">
          <div className="ext-header-left">
            <span className="ext-logo-icon">&#x1F537;</span>
            <span className="ext-logo-text">{tenantName}</span>
          </div>

          <nav className="ext-nav">
            <NavLink
              to="/extranet/dashboard"
              className={({ isActive }) => `ext-nav-link ${isActive ? 'ext-nav-link--active' : ''}`}
            >
              Mes dossiers
            </NavLink>
            <NavLink
              to="/extranet/profile"
              className={({ isActive }) => `ext-nav-link ${isActive ? 'ext-nav-link--active' : ''}`}
            >
              Mon profil
            </NavLink>
          </nav>

          <div className="ext-header-right">
            <span className="ext-user-name">{clientName}</span>
            <button className="ext-logout-btn" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="ext-main">
        <div className="ext-container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="ext-footer">
        <p>{tenantName} — Espace client sécurisé</p>
      </footer>
    </div>
  );
}
