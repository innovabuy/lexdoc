import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/utils/validation';
import { ROLE_LABELS } from '@/lib/utils/constants';
import type { UserListItem, UserRole } from '@/lib/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => void;
  user?: UserListItem | null;
  isLoading?: boolean;
}

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading,
}) => {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        }
      : {
          role: 'COLLABORATEUR' as UserRole,
        },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'COLLABORATEUR',
        phone: '',
      });
    }
  }, [user, reset]);

  const handleFormSubmit = (data: CreateUserInput) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label="Prénom"
            placeholder="Jean"
            error={errors.firstName?.message}
          />
          <Input
            {...register('lastName')}
            label="Nom"
            placeholder="Dupont"
            error={errors.lastName?.message}
          />
        </div>

        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="jean.dupont@cabinet.fr"
          error={errors.email?.message}
          disabled={isEditing}
        />

        {!isEditing && (
          <Input
            {...register('password')}
            type="password"
            label="Mot de passe"
            placeholder="Minimum 8 caractères"
            error={errors.password?.message}
          />
        )}

        <Input
          {...register('phone')}
          type="tel"
          label="Téléphone (optionnel)"
          placeholder="06 12 34 56 78"
          error={errors.phone?.message}
        />

        <Select
          {...register('role')}
          label="Rôle"
          options={roleOptions}
          error={errors.role?.message}
        />

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default UserModal;
