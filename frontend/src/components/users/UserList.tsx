import React, { useState } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import { Input, Button, EmptyState, LoadingState, ConfirmDialog } from '@/components/ui';
import UserCard from './UserCard';
import UserModal from './UserModal';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserActive } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserListItem, CreateUserInput, UpdateUserInput, UserFilters } from '@/lib/types';

const UserList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filters: UserFilters = {
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, error } = useUsers(filters);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const toggleActiveMutation = useToggleUserActive();

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserListItem) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: UserListItem) => {
    setDeleteUser(user);
  };

  const handleToggleActive = (user: UserListItem) => {
    toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive });
  };

  const handleModalSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    if (selectedUser) {
      await updateMutation.mutateAsync({ id: selectedUser.id, data: data as UpdateUserInput });
    } else {
      await createMutation.mutateAsync(data as CreateUserInput);
    }
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteUser) {
      await deleteMutation.mutateAsync(deleteUser.id);
      setDeleteUser(null);
    }
  };

  if (isLoading) {
    return <LoadingState message="Chargement des utilisateurs..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="Erreur de chargement"
        description="Impossible de charger les utilisateurs. Réessayez."
      />
    );
  }

  const users = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
          />
        </div>

        <Button onClick={handleCreate} leftIcon={<Plus className="h-4 w-4" />}>
          Nouvel utilisateur
        </Button>
      </div>

      {/* Users grid */}
      {users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user: UserListItem) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={search ? 'Aucun résultat' : 'Aucun utilisateur'}
          description={
            search
              ? 'Aucun utilisateur ne correspond à votre recherche.'
              : 'Commencez par créer votre premier utilisateur.'
          }
          action={
            !search
              ? {
                  label: 'Créer un utilisateur',
                  onClick: handleCreate,
                }
              : undefined
          }
        />
      )}

      {/* User modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleModalSubmit}
        user={selectedUser}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteUser?.firstName} ${deleteUser?.lastName} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default UserList;
