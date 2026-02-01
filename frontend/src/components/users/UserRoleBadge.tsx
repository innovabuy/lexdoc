import React from 'react';
import { Badge } from '@/components/ui';
import { ROLE_LABELS } from '@/lib/utils/constants';
import type { UserRole } from '@/lib/types';

interface UserRoleBadgeProps {
  role: UserRole;
}

const roleVariants: Record<UserRole, 'primary' | 'success' | 'warning' | 'default'> = {
  ADMIN: 'primary',
  AVOCAT: 'success',
  COLLABORATEUR: 'warning',
  SECRETAIRE: 'default',
};

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role }) => {
  return <Badge variant={roleVariants[role]}>{ROLE_LABELS[role]}</Badge>;
};

export default UserRoleBadge;
