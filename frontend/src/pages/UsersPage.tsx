import React from 'react';
import { UserList } from '@/components/users';

const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 mt-1">
          Gérez les membres de votre cabinet
        </p>
      </div>

      {/* User list */}
      <UserList />
    </div>
  );
};

export default UsersPage;
