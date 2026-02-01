import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';
import { formatFullName } from '@/lib/utils/helpers';
import { ROLE_LABELS } from '@/lib/utils/constants';

const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">LexDoc</span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="sm"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user ? formatFullName(user.firstName, user.lastName) : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user ? ROLE_LABELS[user.role] : ''}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] bg-white rounded-lg shadow-medium border border-gray-100 py-1 z-50 animate-fade-in"
                align="end"
                sideOffset={8}
              >
                <div className="px-3 py-2 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-medium text-gray-900">
                    {user ? formatFullName(user.firstName, user.lastName) : ''}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                <DropdownMenu.Item asChild>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                  >
                    <User className="h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

                <DropdownMenu.Item
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
