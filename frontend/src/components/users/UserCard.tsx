import React from 'react';
import { MoreVertical, Mail, Shield, Edit, Trash2, Power } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Card, Avatar, Badge } from '@/components/ui';
import UserRoleBadge from './UserRoleBadge';
import { formatFullName } from '@/lib/utils/helpers';
import { formatRelativeTime } from '@/lib/utils/formatters';
import type { UserListItem } from '@/lib/types';

interface UserCardProps {
  user: UserListItem;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  onToggleActive: (user: UserListItem) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete, onToggleActive }) => {
  return (
    <Card className="hover:shadow-medium transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            size="lg"
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {formatFullName(user.firstName, user.lastName)}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
          </div>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[160px] bg-white rounded-lg shadow-medium border border-gray-100 py-1 z-50 animate-fade-in"
              align="end"
              sideOffset={4}
            >
              <DropdownMenu.Item
                onClick={() => onEdit(user)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onClick={() => onToggleActive(user)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
              >
                <Power className="h-4 w-4" />
                {user.isActive ? 'Désactiver' : 'Activer'}
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

              <DropdownMenu.Item
                onClick={() => onDelete(user)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <UserRoleBadge role={user.role} />
        {!user.isActive && <Badge variant="error">Inactif</Badge>}
        {user.twoFactorEnabled && (
          <Badge variant="success">
            <Shield className="h-3 w-3 mr-1" />
            2FA
          </Badge>
        )}
      </div>

      {user.lastLoginAt && (
        <p className="mt-3 text-xs text-gray-400">
          Dernière connexion : {formatRelativeTime(user.lastLoginAt)}
        </p>
      )}
    </Card>
  );
};

export default UserCard;
