import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Layout({ children }) {
  const { user, token, logout } = useContext(AuthContext);
  const location = useLocation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fetch pending requests count
  useEffect(() => {
    if (token) {
      fetchPendingCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchPendingCount = async () => {
    try {
      const res = await fetch(`${API_URL}/extranet/document-requests?status=PENDING&pageSize=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pendingCount || 0);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const navigation = [
    { name: 'Accueil', href: '/', icon: '🏠' },
    { name: 'Documents', href: '/documents', icon: '📄' },
    { name: 'Demandes', href: '/requests', icon: '📥' },
    { name: 'Compte', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⚖️</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">
                {user?.tenant?.name || 'LexDoc'}
              </div>
              <div className="text-xs text-gray-500">Espace Client</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Install prompt */}
      {showInstallPrompt && (
        <div className="bg-primary-600 text-white px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span className="text-sm">Installez l'application pour un accès rapide</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-sm text-primary-200 hover:text-white"
              >
                Plus tard
              </button>
              <button
                onClick={handleInstall}
                className="text-sm bg-white text-primary-600 px-3 py-1 rounded-lg font-medium hover:bg-primary-50"
              >
                Installer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t safe-area-bottom">
        <div className="max-w-3xl mx-auto flex justify-around py-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const showBadge = item.href === '/requests' && pendingCount > 0;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors relative ${
                  isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-xl relative">
                  {item.icon}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </span>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Safe area padding for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
}
