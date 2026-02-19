import { useContext, useState, useEffect } from'react';
import { Link, useLocation } from'react-router-dom';
import { AuthContext } from'../contexts/AuthContext';
import NotificationCenter from'./NotificationCenter';
import GlobalSearch from'./GlobalSearch';

const navigation = [
  { name:'Dashboard', href:'/', icon:'📊' },
  { name:'Dossiers', href:'/folders', icon:'📁' },
  { name:'Documents', href:'/documents', icon:'📄' },
  { name:'Arborescence', href:'/documents/tree', icon:'🗂️' },
  { name:'Tous les docs', href:'/documents/all', icon:'📋' },
  { name:'Calendrier', href:'/calendar', icon:'📅' },
  { name:'Statistiques', href:'/statistics', icon:'📈' },
  { name:'Messages', href:'/chat', icon:'💬' },
  { name:'Demandes', href:'/document-requests', icon:'📋' },
  { name:'Clients', href:'/clients', icon:'👥' },
  { name:'Signatures', href:'/signatures', icon:'✍️' },
  { name:'Suivi', href:'/tracking', icon:'📍' },
  { name:'Templates', href:'/templates', icon:'📝' },
];

const settingsNavigation = [
  { name:'Profil legal', href:'/settings/legal-info', icon:'⚖️' },
  { name:'Acces clients', href:'/settings/client-access', icon:'🔐' },
  { name:'Notifications', href:'/settings/notifications', icon:'🔔' },
  { name:'Categories docs', href:'/settings/folder-categories', icon:'📂' },
  { name:'Categories templates', href:'/settings/template-categories', icon:'📝' },
  { name:'Sauvegardes', href:'/settings/backups', icon:'💾' },
];

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow ='hidden';
    } else {
      document.body.style.overflow ='';
    }
    return () => {
      document.body.style.overflow ='';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-100 transition-colors">
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-900 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
 mobileMenuOpen ?'translate-x-0' :'-translate-x-full'
 }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">LexDoc</span>
            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">v2.0</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
 isActive
 ?'bg-blue-600 text-white'
 :'text-gray-300 hover:bg-gray-800'
 }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}

          {/* Settings section */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <span className="flex items-center">
                <span className="mr-3">⚙️</span>
                Parametres
              </span>
              <span className={`transform transition-transform ${settingsOpen ?'rotate-180' :''}`}>▼</span>
            </button>
            {settingsOpen && (
              <div className="ml-4 mt-2">
                {settingsNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-4 py-2 mb-1 rounded-lg transition-colors text-sm ${
 isActive
 ?'bg-blue-600 text-white'
 :'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
 }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8 transition-colors sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-800 truncate">
            {user?.tenant?.name ||'LexDoc'}
          </h1>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Global Search - Hidden on small mobile */}
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
            {/* Notifications */}
            <NotificationCenter />
            {/* User info - Hidden on mobile */}
            <span className="hidden md:inline text-sm text-gray-600">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={logout}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              <span className="hidden sm:inline">Deconnexion</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {[
            { name:'Home', href:'/', icon:'📊' },
            { name:'Dossiers', href:'/folders', icon:'📁' },
            { name:'Docs', href:'/documents', icon:'📄' },
            { name:'Chat', href:'/chat', icon:'💬' },
            { name:'Plus', href:'#menu', icon:'☰', isMenu: true },
          ].map((item) => {
            const isActive = item.isMenu ? false : location.pathname === item.href;
            if (item.isMenu) {
              return (
                <button
                  key={item.name}
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex flex-col items-center justify-center px-3 py-2 text-gray-500"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs mt-1">{item.name}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center px-3 py-2 ${
 isActive
 ?'text-blue-600'
 :'text-gray-500'
 }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-16" />
    </div>
  );
}
