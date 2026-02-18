import { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CalendarDays,
  PenTool,
  Send,
  FileQuestion,
  MessageSquare,
  Settings,
  Building2,
  FileText,
  GitBranch,
  Puzzle,
  UserCog,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  Menu,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const mainNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Dossiers', href: '/dossiers', icon: FolderOpen },
  { name: 'Agenda', href: '/calendar', icon: CalendarDays },
];

const suiviNav = [
  { name: 'Signatures', href: '/signatures', icon: PenTool },
  { name: 'Envois recommandés', href: '/tracking', icon: Send },
  { name: 'Demandes documents', href: '/document-requests', icon: FileQuestion },
  { name: 'Messagerie', href: '/chat', icon: MessageSquare },
];

const settingsNav = [
  { name: 'Cabinet', href: '/parametres/cabinet', icon: Building2 },
  { name: 'Templates', href: '/parametres/templates', icon: FileText },
  { name: 'Arborescences', href: '/parametres/arborescences', icon: GitBranch },
  { name: 'Intégrations', href: '/parametres/integrations', icon: Puzzle },
  { name: 'Utilisateurs', href: '/parametres/utilisateurs', icon: UserCog },
];

function NavItem({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#eff6ff] text-[#0066ff] font-semibold'
            : 'text-[#334155] hover:bg-[#f8fafc]'
        }`
      }
    >
      <Icon size={20} />
      <span>{item.name}</span>
    </NavLink>
  );
}

function SettingsSubItem({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-[#eff6ff] text-[#0066ff] font-semibold'
            : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#334155]'
        }`
      }
    >
      <Icon size={18} />
      <span>{item.name}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith('/parametres')
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-open settings section when navigating to a settings page
  useEffect(() => {
    if (location.pathname.startsWith('/parametres')) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : '?';

  const fullName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : '';

  const roleName = user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur';

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="sidebar-inner">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">&#x1F537;</span>
        <span className="sidebar-logo-text">LexDoc</span>
        {mobileOpen && (
          <button className="sidebar-close-btn" onClick={closeMobile}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-main">
          {mainNav.map((item) => (
            <NavItem key={item.href} item={item} onClick={closeMobile} />
          ))}
        </div>

        {/* Suivi section */}
        <div className="sidebar-nav-suivi">
          <div className="sidebar-section-label">Suivi</div>
          {suiviNav.map((item) => (
            <NavItem key={item.href} item={item} onClick={closeMobile} />
          ))}
        </div>

        {/* Settings section */}
        <div className="sidebar-nav-settings">
          <button
            className={`sidebar-settings-toggle ${
              location.pathname.startsWith('/parametres')
                ? 'text-[#0066ff]'
                : 'text-[#334155]'
            }`}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <div className="flex items-center gap-3">
              <Settings size={20} />
              <span>Paramètres</span>
            </div>
            {settingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {settingsOpen && (
            <div className="sidebar-settings-items">
              {settingsNav.map((item) => (
                <SettingsSubItem key={item.href} item={item} onClick={closeMobile} />
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User section at bottom */}
      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-details">
            <div className="sidebar-user-name">{fullName}</div>
            <div className="sidebar-user-role">{roleName}</div>
          </div>
        </div>
        <NotificationBell />
        <button className="sidebar-logout" onClick={logout} title="Déconnexion">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="sidebar-hamburger" onClick={() => setMobileOpen(true)}>
        <Menu size={24} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
