import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Settings,
  Building2,
  ChevronLeft,
  PenTool,
  Mail,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/helpers';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Dossiers', href: '/folders', icon: FolderOpen },
  { label: 'Document Builder', href: '/document-builder', icon: Layers, roles: ['ADMIN', 'AVOCAT'] },
  { label: 'Signatures', href: '/signatures', icon: PenTool, roles: ['ADMIN', 'AVOCAT', 'COLLABORATEUR'] },
  { label: 'LRAR', href: '/lrar', icon: Mail, roles: ['ADMIN', 'AVOCAT', 'COLLABORATEUR'] },
  { label: 'Utilisateurs', href: '/users', icon: Users, roles: ['ADMIN'] },
  { label: 'Cabinet', href: '/cabinet', icon: Building2, roles: ['ADMIN'] },
  { label: 'Paramètres', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapsed } =
    useUIStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-500')} />
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Collapse toggle - desktop only */}
          <div className="hidden lg:block p-3 border-t border-gray-100">
            <button
              onClick={toggleSidebarCollapsed}
              className="flex items-center justify-center w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft
                className={cn(
                  'h-5 w-5 transition-transform duration-300',
                  sidebarCollapsed && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
